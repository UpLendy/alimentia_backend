import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";

// Sede / sucursal / punto de venta de una company. El plan Básico trae 1 sede;
// Pro/Plus permiten varias (multi-sede, ver checklist "Escalabilidad / Multi-sede").
export const sedes = pgTable(
  "sedes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    city: text("city"),
    isMain: boolean("is_main").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("sedes_company_idx").on(table.companyId),
  }),
);

export type Sede = typeof sedes.$inferSelect;
export type NewSede = typeof sedes.$inferInsert;
