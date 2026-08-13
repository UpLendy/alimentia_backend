import { db } from "../db/client";
import { auditLog } from "../db/schema";

export interface AuditEvent {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

// Registro de auditoría best-effort: si falla el insert (ej. la base de
// datos está caída), no debe tumbar la petición que lo disparó — solo se
// loguea el error. Úsalo para login exitoso/fallido, cambios de rol,
// acciones de un bpm_admin sobre datos de un cliente, y (a futuro) intentos
// de cobro del módulo de pagos.
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLog).values({
      companyId: event.companyId ?? null,
      userId: event.userId ?? null,
      action: event.action,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? null,
      metadata: event.metadata ?? null,
      ipAddress: event.ipAddress ?? null,
    });
  } catch (err) {
    console.error("[audit-log] no se pudo registrar el evento:", event.action, err);
  }
}
