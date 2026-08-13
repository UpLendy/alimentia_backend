import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";
import { companies } from "./companies";
import { sedes } from "./sedes";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Nulo únicamente para role = 'bpm_admin' (staff de BPM Consulting, acceso multi-cliente)
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    // Nulo = acceso a todas las sedes de la company (ej. admin de la empresa cliente)
    sedeId: uuid("sede_id").references(() => sedes.id, { onDelete: "set null" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("operario"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("users_company_idx").on(table.companyId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
