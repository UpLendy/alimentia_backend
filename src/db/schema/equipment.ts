import { pgTable, uuid, text, date, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";
import { calibrationFrequencyEnum } from "./enums";

// Infraestructura y Equipos (src/app/infraestructura)
export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id")
      .notNull()
      .references(() => sedes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    brandModel: text("brand_model"),
    locationArea: text("location_area"),
    serial: text("serial"),
    lastCalibrationDate: date("last_calibration_date"),
    calibrationFrequency: calibrationFrequencyEnum("calibration_frequency").notNull().default("anual"),
    nextCalibrationDate: date("next_calibration_date"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("equipment_company_idx").on(table.companyId),
    sedeIdx: index("equipment_sede_idx").on(table.sedeId),
  }),
);

export const equipmentCertificates = pgTable("equipment_certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  fileKey: text("file_key").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
export type EquipmentCertificate = typeof equipmentCertificates.$inferSelect;
