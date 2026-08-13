import { pgTable, uuid, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { fixedDocuments } from "./fixedDocuments";
import { users } from "./users";

// Anexos y Soportes (src/app/anexos): certificados, resultados de laboratorio,
// facturas de recolección, etc., vinculados opcionalmente a un programa fijo.
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id").references(() => sedes.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    linkedDocumentId: uuid("linked_document_id").references(() => fixedDocuments.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    documentDate: date("document_date"),
    fileKey: text("file_key").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    fileSizeBytes: integer("file_size_bytes"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("attachments_company_idx").on(table.companyId),
  }),
);

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
