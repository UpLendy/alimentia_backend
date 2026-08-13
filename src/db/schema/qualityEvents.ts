import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { users } from "./users";
import { severityEnum, nonConformityStatusEnum } from "./enums";

// No conformidades y acciones correctivas / CAPA (checklist: "No conformidades
// y Documentos"). Fase 2 — plan Pro/Plus.
export const nonConformities = pgTable(
  "non_conformities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id")
      .notNull()
      .references(() => sedes.id, { onDelete: "cascade" }),
    // Origen: puede venir de un formato diario, una auditoría externa o reportarse manualmente
    sourceType: text("source_type").notNull().default("manual"), // manual | formato | auditoria
    sourceReferenceId: uuid("source_reference_id"),
    description: text("description").notNull(),
    severity: severityEnum("severity").notNull().default("media"),
    correctiveAction: text("corrective_action"),
    responsibleUserId: uuid("responsible_user_id").references(() => users.id),
    dueDate: date("due_date"),
    status: nonConformityStatusEnum("status").notNull().default("abierta"),
    evidenceFileUrl: text("evidence_file_url"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sedeIdx: index("non_conformities_sede_idx").on(table.sedeId),
  }),
);

// Gestión de incidentes (checklist: "Gestión de incidentes")
export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  sedeId: uuid("sede_id")
    .notNull()
    .references(() => sedes.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  type: text("type"),
  severity: severityEnum("severity").notNull().default("media"),
  resolution: text("resolution"),
  reportedBy: uuid("reported_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type NonConformity = typeof nonConformities.$inferSelect;
export type NewNonConformity = typeof nonConformities.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
