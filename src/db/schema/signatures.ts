import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

// Firma electrónica con auditoría (checklist: "Firma electrónica con
// auditoría de usuario y fecha"). Genérica: puede firmar un documento fijo,
// un formato diario o el cierre de una no conformidad.
export const signatures = pgTable("signatures", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: text("entity_type").notNull(), // "fixed_document" | "daily_form" | "non_conformity"
  entityId: uuid("entity_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  hash: text("hash").notNull(), // hash del contenido firmado, para verificación de integridad
});

export type Signature = typeof signatures.$inferSelect;
