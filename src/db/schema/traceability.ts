import { pgTable, uuid, text, date, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { suppliers } from "./suppliers";
import { lotStatusEnum, recallStatusEnum } from "./enums";

// Trazabilidad por lote (checklist: "Registro por lote", "Cálculo automático
// de vencimiento", "Plan de retiro/recall"). Fase 2 — plan Pro/Plus,
// prioritario para perfiles Cárnicos y Bodega/Almacenamiento.
export const lots = pgTable(
  "lots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id")
      .notNull()
      .references(() => sedes.id, { onDelete: "cascade" }),
    productName: text("product_name").notNull(),
    lotCode: text("lot_code").notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    receivedDate: date("received_date").notNull(),
    expiryDate: date("expiry_date"),
    quantity: numeric("quantity"),
    unit: text("unit"),
    allergens: text("allergens").array(), // ver checklist "Gestión de alérgenos y etiquetado"
    status: lotStatusEnum("status").notNull().default("activo"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sedeIdx: index("lots_sede_idx").on(table.sedeId),
    lotCodeIdx: index("lots_code_idx").on(table.lotCode),
  }),
);

// Plan de retiro de producto (recall) originado en un lote
export const recalls = pgTable("recalls", {
  id: uuid("id").defaultRandom().primaryKey(),
  lotId: uuid("lot_id")
    .notNull()
    .references(() => lots.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  initiatedAt: timestamp("initiated_at", { withTimezone: true }).defaultNow().notNull(),
  status: recallStatusEnum("status").notNull().default("en_proceso"),
  actionsTaken: text("actions_taken"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export type Lot = typeof lots.$inferSelect;
export type NewLot = typeof lots.$inferInsert;
export type Recall = typeof recalls.$inferSelect;
