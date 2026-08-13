import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { users } from "./users";
import { documentStatusEnum } from "./enums";

// Documentos Fijos / Programas de Saneamiento (src/app/documentos). Incluye
// flujo de aprobación y control de versiones (checklist "No Conformidades y
// Documentos" > control de versiones + firma electrónica).
export const fixedDocuments = pgTable(
  "fixed_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // Nulo = documento corporativo, aplica a todas las sedes de la company
    sedeId: uuid("sede_id").references(() => sedes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"), // "Plan de Saneamiento", "Tablas de Concentración", "Fichas Técnicas"...
    currentVersion: integer("current_version").notNull().default(1),
    status: documentStatusEnum("status").notNull().default("vigente"),
    fileKey: text("file_key").notNull(),
    fileUrl: text("file_url").notNull(),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("fixed_documents_company_idx").on(table.companyId),
  }),
);

export const fixedDocumentVersions = pgTable("fixed_document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => fixedDocuments.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  fileKey: text("file_key").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FixedDocument = typeof fixedDocuments.$inferSelect;
export type NewFixedDocument = typeof fixedDocuments.$inferInsert;
export type FixedDocumentVersion = typeof fixedDocumentVersions.$inferSelect;
