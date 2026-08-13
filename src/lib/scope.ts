import { and, eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { JwtPayload } from "../plugins/auth";

/**
 * Construye el filtro de alcance multi-tenant para una tabla que tiene
 * columnas companyId y sedeId:
 *  - Si el usuario tiene sedeId (operario/supervisor de una sede puntual),
 *    se filtra por esa sede exacta.
 *  - Si el usuario NO tiene sedeId (admin de la empresa, o bpm_admin), se
 *    filtra solo por companyId, dando acceso a todas las sedes.
 *
 * Lanza si el usuario no tiene companyId (caso bpm_admin sin empresa elegida
 * explícitamente vía query param — manejarlo en la ruta antes de llamar esto).
 */
export function scopeFilter(
  user: JwtPayload,
  companyIdCol: PgColumn,
  sedeIdCol: PgColumn,
): SQL {
  if (!user.companyId) {
    throw new Error("scopeFilter requiere un usuario con companyId (bpm_admin debe indicar companyId explícito).");
  }
  if (user.sedeId) {
    return and(eq(companyIdCol, user.companyId), eq(sedeIdCol, user.sedeId))!;
  }
  return eq(companyIdCol, user.companyId);
}
