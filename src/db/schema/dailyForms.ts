import { pgTable, uuid, date, timestamp, jsonb, text, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { users } from "./users";
import { dailyFormTypeEnum } from "./enums";

// Los 10 formatos diarios (src/app/formatos/*) comparten esta tabla. El campo
// `payload` guarda los datos propios de cada `formType` (ver
// src/modules/daily-forms/schemas.ts para la validación por tipo). Este diseño
// evita 10 tablas casi idénticas y facilita agregar más formatos sin migrar.
export const dailyForms = pgTable(
  "daily_forms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id")
      .notNull()
      .references(() => sedes.id, { onDelete: "cascade" }),
    formType: dailyFormTypeEnum("form_type").notNull(),
    formDate: date("form_date").notNull(),
    shift: text("shift"), // manana | tarde | noche (solo aplica a algunos formatos)
    submittedBy: uuid("submitted_by").references(() => users.id),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    observations: text("observations"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sedeFormDateIdx: index("daily_forms_sede_type_date_idx").on(table.sedeId, table.formType, table.formDate),
  }),
);

export type DailyForm = typeof dailyForms.$inferSelect;
export type NewDailyForm = typeof dailyForms.$inferInsert;
