import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

// Rastro de auditoría de seguridad: login exitoso/fallido, cambios de rol,
// acciones de un bpm_admin sobre datos de una empresa cliente, y (a futuro)
// intentos de cobro del módulo de pagos. companyId/userId son nullable
// porque un intento de login fallido puede no resolver a ningún usuario o
// empresa real (ej. email inexistente) y aun así queremos dejar rastro.
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("audit_log_company_idx").on(table.companyId),
    userIdx: index("audit_log_user_idx").on(table.userId),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  }),
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
