import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { planEnum, companyStatusEnum, businessProfileEnum } from "./enums";

// Cada "company" es un CLIENTE de Alimentia (empresa/cadena contratante).
// Una company puede tener varias "sedes" (ver sedes.ts) según su plan.
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nit: text("nit"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  logoUrl: text("logo_url"),

  // Comercial (ver Alimentia Plan Comercial.xlsx)
  plan: planEnum("plan").notNull().default("basico"),
  status: companyStatusEnum("status").notNull().default("prueba"),
  businessProfile: businessProfileEnum("business_profile").notNull().default("restaurante_general"),
  sedesIncluded: integer("sedes_included").notNull().default(1), // según plan; sedes extra se cobran aparte
  billingAnnualPrepay: integer("billing_annual_prepay").notNull().default(0), // 1 = pago anual con descuento

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
