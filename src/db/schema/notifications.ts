import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { users } from "./users";
import { notificationChannelEnum, notificationStatusEnum } from "./enums";

// Motor de alarmas (checklist "Monitoreo y Alarmas"): vencimiento de carné,
// capacitación, calibración, fumigación, análisis de agua, etc. Un job
// programado (cron) evalúa las reglas y crea filas aquí; un worker de envío
// las despacha por el canal configurado. Fase 2.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id").references(() => sedes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // examen_medico | capacitacion | calibracion | plagas | agua | ...
    referenceTable: text("reference_table"), // ej: "employees", "equipment"
    referenceId: uuid("reference_id"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    dueDate: date("due_date"),
    channel: notificationChannelEnum("channel").notNull().default("push"),
    status: notificationStatusEnum("status").notNull().default("pendiente"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("notifications_company_idx").on(table.companyId),
    statusIdx: index("notifications_status_idx").on(table.status),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
