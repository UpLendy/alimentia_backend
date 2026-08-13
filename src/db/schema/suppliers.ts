import { pgTable, uuid, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { supplierStatusEnum } from "./enums";

// Proveedores (checklist: "Gestión de certificaciones", "Evaluación/scorecard",
// "Registro de recepción con foto/lote"). Fase 2 — plan Pro/Plus.
export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nit: text("nit"),
    category: text("category"), // ej: cárnicos, lácteos, aseo, servicios
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    status: supplierStatusEnum("status").notNull().default("activo"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("suppliers_company_idx").on(table.companyId),
  }),
);

// Documentación / certificaciones del proveedor (INVIMA, fichas técnicas, etc.)
export const supplierDocuments = pgTable("supplier_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  fileKey: text("file_key").notNull(),
  fileUrl: text("file_url").notNull(),
  expiryDate: date("expiry_date"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

// Evaluación / scorecard periódico del proveedor
export const supplierEvaluations = pgTable("supplier_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  evaluatedAt: date("evaluated_at").notNull(),
  score: integer("score").notNull(), // 0-100
  evaluatorId: uuid("evaluator_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type SupplierDocument = typeof supplierDocuments.$inferSelect;
export type SupplierEvaluation = typeof supplierEvaluations.$inferSelect;
