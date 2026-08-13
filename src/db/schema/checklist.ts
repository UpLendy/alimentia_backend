import { pgTable, uuid, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { checklistStatusEnum, severityEnum } from "./enums";

// Catálogo maestro (seed único, igual a "Alimentia Checklist Maestro.xlsx").
// No es por-cliente: es el listado de referencia de todo lo que la plataforma
// debe cubrir, con su prioridad y a qué aplica (se deja como texto libre tal
// cual el Excel: "Todos", "Cárnicos, Bodega", "Multi-sede", "Cadenas", "B2B2B",
// en vez de forzarlo al enum de perfil de negocio, que es una dimensión distinta).
export const checklistCatalog = pgTable("checklist_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  item: text("item").notNull(),
  appliesTo: text("applies_to"), // null/"Todos" = aplica a todos los perfiles y planes
  normReference: text("norm_reference"),
  priority: severityEnum("priority").notNull().default("media"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Seguimiento de implementación por cliente: permite a BPM Consulting llevar,
// dentro de la misma plataforma, el mismo checklist que hoy vive en Excel.
export const companyChecklistStatus = pgTable(
  "company_checklist_status",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    checklistItemId: uuid("checklist_item_id")
      .notNull()
      .references(() => checklistCatalog.id, { onDelete: "cascade" }),
    status: checklistStatusEnum("status").notNull().default("pendiente"),
    notes: text("notes"),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("company_checklist_status_company_idx").on(table.companyId),
    // Un único estado por (empresa, ítem de catálogo): evita filas duplicadas
    // si dos requests hacen upsert al mismo tiempo (ver DrizzleChecklistStatusRepository.upsert).
    companyItemUnique: uniqueIndex("company_checklist_status_company_item_unique").on(
      table.companyId,
      table.checklistItemId,
    ),
  }),
);

export type ChecklistCatalogItem = typeof checklistCatalog.$inferSelect;
export type CompanyChecklistStatus = typeof companyChecklistStatus.$inferSelect;
