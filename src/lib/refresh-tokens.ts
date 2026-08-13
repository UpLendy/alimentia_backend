import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { refreshTokens } from "../db/schema";
import { env } from "../config/env";

// Refresh tokens son opacos (no JWT): un valor aleatorio de alta entropía
// que el cliente guarda y reenvía tal cual. Solo se persiste su hash
// SHA-256 (no reversible) — si la base de datos se filtra, no se puede
// reconstruir un token válido a partir de las filas de refresh_tokens.
// SHA-256 (no argon2/bcrypt) porque esto no es una contraseña de baja
// entropía elegida por un humano: ya es aleatorio, así que un hash rápido
// y determinístico es suficiente y permite buscarlo por igualdad en SQL.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseDurationMs(spec: string): number {
  const match = /^(\d+)\s*(s|m|h|d|w)$/i.exec(spec.trim());
  if (!match) throw new Error(`Formato de duración inválido: "${spec}" (usa algo como "30d", "15m", "1h").`);
  const value = Number(match[1]);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return value * unitMs[match[2]!.toLowerCase()]!;
}

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

/** Emite y persiste (hasheado) un nuevo refresh token para el usuario. */
export async function createRefreshToken(userId: string): Promise<IssuedRefreshToken> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + parseDurationMs(env.refreshTokenExpiresIn));

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Verifica un refresh token recibido del cliente: existe, no está revocado
 * y no ha expirado. Devuelve el userId si es válido, o null si no.
 */
export async function verifyRefreshToken(token: string): Promise<{ id: string; userId: string } | null> {
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, hashToken(token)), isNull(refreshTokens.revokedAt)))
    .limit(1);

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  return { id: row.id, userId: row.userId };
}

/** Revoca un refresh token puntual (logout, o rotación tras un /auth/refresh). */
export async function revokeRefreshToken(token: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashToken(token)));
}

/**
 * Revoca TODAS las sesiones activas de un usuario (ej. al cambiar
 * contraseña, o si un admin sospecha que la cuenta fue comprometida).
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
