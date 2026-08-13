import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../config/env";
import { recordAuditEvent } from "../lib/audit-log";
import { getClientIp } from "../lib/request-ip";

export type UserRole = "bpm_admin" | "admin" | "supervisor" | "operario";

export interface JwtPayload {
  sub: string; // userId
  companyId: string | null;
  sedeId: string | null;
  role: UserRole;
}

// Plugin base: expone `jwt` (firmar/verificar) para el módulo de auth.
export const jwtPlugin = new Elysia({ name: "jwt-plugin" }).use(
  jwt({
    name: "jwt",
    secret: env.jwtSecret,
    exp: env.jwtExpiresIn,
  }),
);

// Deriva el usuario autenticado (o null) a partir del header Authorization.
// Úsalo con `.use(currentUser)` en cualquier módulo que necesite saber quién
// está logueado sin bloquear rutas públicas.
export const currentUser = new Elysia({ name: "current-user" })
  .use(jwtPlugin)
  .derive({ as: "global" }, async ({ jwt, headers }) => {
    const authHeader = headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
    if (!token) return { user: null as JwtPayload | null };

    const payload = await jwt.verify(token);
    if (!payload) return { user: null as JwtPayload | null };

    return { user: payload as unknown as JwtPayload };
  });

// Bloquea el acceso si no hay usuario autenticado.
export const requireAuth = new Elysia({ name: "require-auth" })
  .use(currentUser)
  .onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "No autorizado. Incluye un token Bearer válido." };
    }
  });

// Factory: exige uno de los roles indicados. Debe usarse DESPUÉS de requireAuth.
// Ejemplo: .use(requireAuth).use(requireRole(["admin", "bpm_admin"]))
export function requireRole(roles: UserRole[]) {
  const auditBpmAdmin = roles.includes("bpm_admin");

  return new Elysia({ name: `require-role-${roles.join("-")}` })
    .use(currentUser)
    .onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
      if (!user || !roles.includes(user.role)) {
        set.status = 403;
        return { error: "No tienes permisos para esta acción." };
      }
    })
    // Un bpm_admin (staff de BPM Consulting) puede administrar datos de
    // cualquier empresa cliente — cada mutación que haga queda en
    // audit_log para trazabilidad, sin bloquear la respuesta si el log falla.
    .onAfterHandle({ as: "scoped" }, ({ user, request, path, set, server, headers }) => {
      if (!auditBpmAdmin || !user || user.role !== "bpm_admin") return;
      if (request.method === "GET") return;
      if (typeof set.status === "number" && set.status >= 400) return;

      void recordAuditEvent({
        companyId: user.companyId,
        userId: user.sub,
        action: "bpm_admin.mutation",
        entityType: path,
        metadata: { method: request.method, path },
        ipAddress: getClientIp({ request, server, headers }),
      });
    });
}
