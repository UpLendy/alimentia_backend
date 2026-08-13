import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { users } from "./users";
import { scheduledEventTypeEnum, scheduledEventStatusEnum } from "./enums";

// Alertas > Programar evento/análisis (src/app/alertas/programar)
export const scheduledEvents = pgTable(
  "scheduled_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id")
      .notNull()
      .references(() => sedes.id, { onDelete: "cascade" }),
    serviceType: scheduledEventTypeEnum("service_type").notNull(),
    proposedDate: date("proposed_date").notNull(),
    providerName: text("provider_name"),
    notes: text("notes"),
    status: scheduledEventStatusEnum("status").notNull().default("pendiente"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sedeIdx: index("scheduled_events_sede_idx").on(table.sedeId),
  }),
);

export type ScheduledEvent = typeof scheduledEvents.$inferSelect;
export type NewScheduledEvent = typeof scheduledEvents.$inferInsert;
