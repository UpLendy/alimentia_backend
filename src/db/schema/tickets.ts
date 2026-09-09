import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { ticketTypeEnum, ticketStatusEnum } from "./enums";

// Herramienta interna: reporte de bugs/mejoras/dudas encontrados durante las
// pruebas de la plataforma. Cualquier usuario autenticado puede crear un
// ticket (no depende de plan/feature-gating); solo bpm_admin los administra.
// companyId es nulo cuando lo crea un bpm_admin (igual que users.companyId).
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: ticketTypeEnum("type").notNull(),
    // Ruta del front desde donde se reportó (ej. "/formatos/higiene"), para
    // dar contexto sin que el usuario tenga que describir dónde estaba.
    pageContext: text("page_context").notNull(),
    status: ticketStatusEnum("status").notNull().default("abierto"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("tickets_company_idx").on(table.companyId),
    createdByIdx: index("tickets_created_by_idx").on(table.createdByUserId),
    statusIdx: index("tickets_status_idx").on(table.status),
  }),
);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
