import { pgTable, uuid, text, boolean, timestamp, doublePrecision, index } from "drizzle-orm/pg-core";
import { sedes } from "./sedes";
import { equipment } from "./equipment";

// Sensores IoT de monitoreo en tiempo real (checklist "Monitoreo y Alarmas" /
// "Avanzado" — funcionalidad de plan Plus). Fase 2: no se expone API todavía,
// solo se deja la tabla lista para cuando se integren sensores físicos.
export const sensors = pgTable("sensors", {
  id: uuid("id").defaultRandom().primaryKey(),
  sedeId: uuid("sede_id")
    .notNull()
    .references(() => sedes.id, { onDelete: "cascade" }),
  equipmentId: uuid("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  externalId: text("external_id"), // id del dispositivo en la plataforma IoT del proveedor
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sensorReadings = pgTable(
  "sensor_readings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sensorId: uuid("sensor_id")
      .notNull()
      .references(() => sensors.id, { onDelete: "cascade" }),
    value: doublePrecision("value").notNull(),
    unit: text("unit").notNull().default("°C"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    sensorTimeIdx: index("sensor_readings_sensor_time_idx").on(table.sensorId, table.recordedAt),
  }),
);

export type Sensor = typeof sensors.$inferSelect;
export type SensorReading = typeof sensorReadings.$inferSelect;
