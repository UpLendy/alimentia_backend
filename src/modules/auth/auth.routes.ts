import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { hashPassword, verifyPassword } from "../../lib/password";
import { jwtPlugin, requireAuth, requireRole } from "../../plugins/auth";
import { noStoreCache } from "../../plugins/security-headers";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "../../plugins/rate-limit";
import {
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from "../../lib/refresh-tokens";
import { recordAuditEvent } from "../../lib/audit-log";
import { getClientIp } from "../../lib/request-ip";
import { loginBody, registerUserBody, refreshBody, logoutBody, changeRoleBody } from "./auth.schema";

export const authRoutes = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .use(jwtPlugin)
  .use(noStoreCache)
  .post(
    "/login",
    async ({ body, jwt, set, request, server, headers }) => {
      const ip = getClientIp({ request, server, headers });
      const rateLimitKey = `login:${ip ?? "unknown"}:${body.email.toLowerCase()}`;

      const limit = checkRateLimit(rateLimitKey);
      if (!limit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(limit.retryAfterSeconds);
        return { error: "Demasiados intentos fallidos. Intenta de nuevo más tarde." };
      }

      const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);

      if (!user || !user.active) {
        recordFailedAttempt(rateLimitKey);
        void recordAuditEvent({
          action: "auth.login.failed",
          metadata: { email: body.email, reason: !user ? "usuario_no_existe" : "usuario_inactivo" },
          ipAddress: ip,
        });
        set.status = 401;
        return { error: "Credenciales inválidas." };
      }

      const validPassword = await verifyPassword(body.password, user.passwordHash);
      if (!validPassword) {
        recordFailedAttempt(rateLimitKey);
        void recordAuditEvent({
          companyId: user.companyId,
          userId: user.id,
          action: "auth.login.failed",
          metadata: { email: body.email, reason: "password_incorrecto" },
          ipAddress: ip,
        });
        set.status = 401;
        return { error: "Credenciales inválidas." };
      }

      clearRateLimit(rateLimitKey);

      const token = await jwt.sign({
        sub: user.id,
        companyId: user.companyId,
        sedeId: user.sedeId,
        role: user.role,
      });
      const refreshToken = await createRefreshToken(user.id);

      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

      void recordAuditEvent({
        companyId: user.companyId,
        userId: user.id,
        action: "auth.login.success",
        ipAddress: ip,
      });

      return {
        token,
        refreshToken: refreshToken.token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          sedeId: user.sedeId,
        },
      };
    },
    { body: loginBody, detail: { security: [] } },
  )
  // El front hoy guarda el refresh token en localStorage (ver nota pendiente
  // en PROMPTS.md: debería migrar a una cookie httpOnly). Mientras tanto,
  // este endpoint rota el refresh token en cada uso: revoca el que llega y
  // emite uno nuevo, para limitar el daño si un token queda expuesto.
  .post(
    "/refresh",
    async ({ body, jwt, set, request, server, headers }) => {
      const ip = getClientIp({ request, server, headers });
      const rateLimitKey = `refresh:${ip ?? "unknown"}`;

      const limit = checkRateLimit(rateLimitKey);
      if (!limit.allowed) {
        set.status = 429;
        set.headers["Retry-After"] = String(limit.retryAfterSeconds);
        return { error: "Demasiados intentos. Intenta de nuevo más tarde." };
      }

      const verified = await verifyRefreshToken(body.refreshToken);
      if (!verified) {
        recordFailedAttempt(rateLimitKey);
        void recordAuditEvent({ action: "auth.refresh.failed", ipAddress: ip });
        set.status = 401;
        return { error: "Refresh token inválido o expirado." };
      }

      const [user] = await db.select().from(users).where(eq(users.id, verified.userId)).limit(1);
      if (!user || !user.active) {
        await revokeRefreshToken(body.refreshToken);
        recordFailedAttempt(rateLimitKey);
        void recordAuditEvent({
          userId: verified.userId,
          action: "auth.refresh.failed",
          metadata: { reason: "usuario_inactivo" },
          ipAddress: ip,
        });
        set.status = 401;
        return { error: "Refresh token inválido o expirado." };
      }

      clearRateLimit(rateLimitKey);

      // Rotación: se revoca el token recibido y se emite uno nuevo, así un
      // refresh token robado deja de servir apenas el dueño legítimo lo usa.
      await revokeRefreshToken(body.refreshToken);
      const newRefreshToken = await createRefreshToken(user.id);

      const token = await jwt.sign({
        sub: user.id,
        companyId: user.companyId,
        sedeId: user.sedeId,
        role: user.role,
      });

      void recordAuditEvent({
        companyId: user.companyId,
        userId: user.id,
        action: "auth.refresh.success",
        ipAddress: ip,
      });

      return { token, refreshToken: newRefreshToken.token };
    },
    { body: refreshBody, detail: { security: [] } },
  )
  .post(
    "/logout",
    async ({ body, request, server, headers }) => {
      const ip = getClientIp({ request, server, headers });
      const verified = await verifyRefreshToken(body.refreshToken);
      await revokeRefreshToken(body.refreshToken);

      void recordAuditEvent({
        userId: verified?.userId ?? null,
        action: "auth.logout",
        ipAddress: ip,
      });

      return { success: true };
    },
    { body: logoutBody, detail: { security: [] } },
  )
  .use(requireAuth)
  .get("/me", ({ user }) => ({ user }))
  // Solo admin (de la empresa) o bpm_admin pueden crear nuevos usuarios de esa empresa.
  .use(requireRole(["admin", "bpm_admin"]))
  .post(
    "/users",
    async ({ body, user, set }) => {
      if (!user?.companyId) {
        set.status = 400;
        return { error: "No se pudo determinar la empresa del usuario autenticado." };
      }

      const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      if (existing) {
        set.status = 409;
        return { error: "Ya existe un usuario con ese correo." };
      }

      const passwordHash = await hashPassword(body.password);
      const [created] = await db
        .insert(users)
        .values({
          companyId: user.companyId,
          sedeId: body.sedeId ?? null,
          fullName: body.fullName,
          email: body.email,
          passwordHash,
          role: body.role,
        })
        .returning();

      return { user: created };
    },
    { body: registerUserBody },
  )
  .patch(
    "/users/:id/role",
    async ({ params, body, user, set }) => {
      const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
      if (!target || (user!.role !== "bpm_admin" && target.companyId !== user!.companyId)) {
        set.status = 404;
        return { error: "Usuario no encontrado." };
      }

      const previousRole = target.role;
      const [updated] = await db
        .update(users)
        .set({ role: body.role, updatedAt: new Date() })
        .where(eq(users.id, params.id))
        .returning();

      void recordAuditEvent({
        companyId: target.companyId,
        userId: user!.sub,
        action: "user.role_changed",
        entityType: "users",
        entityId: target.id,
        metadata: { previousRole, newRole: body.role },
      });

      return { user: updated };
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: changeRoleBody },
  )
  // Revoca todas las sesiones activas (refresh tokens) de un usuario — útil
  // tras un cambio de contraseña, o si se sospecha que la cuenta fue
  // comprometida. No invalida el access token corto ya emitido, pero este
  // expira solo en minutos (ver JWT_EXPIRES_IN).
  .post(
    "/users/:id/revoke-sessions",
    async ({ params, user, set }) => {
      const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
      if (!target || (user!.role !== "bpm_admin" && target.companyId !== user!.companyId)) {
        set.status = 404;
        return { error: "Usuario no encontrado." };
      }

      await revokeAllUserRefreshTokens(target.id);

      void recordAuditEvent({
        companyId: target.companyId,
        userId: user!.sub,
        action: "user.sessions_revoked",
        entityType: "users",
        entityId: target.id,
      });

      return { success: true };
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  );
