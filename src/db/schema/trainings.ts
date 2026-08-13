import { pgTable, uuid, text, date, integer, timestamp } from "drizzle-orm/pg-core";
import { employees } from "./employees";

// Detalle de capacitaciones por empleado (checklist "Capacitación": seguimiento
// con evaluación, recordatorios de recertificación). El resumen de horas vive
// en employees.trainingHoursCompleted/Required; esta tabla guarda el detalle.
export const trainings = pgTable("trainings", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  trainingDate: date("training_date").notNull(),
  hours: integer("hours").notNull(),
  evaluationScore: integer("evaluation_score"), // 0-100, opcional
  certificateFileUrl: text("certificate_file_url"),
  expiresAt: date("expires_at"), // recertificación anual
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Training = typeof trainings.$inferSelect;
export type NewTraining = typeof trainings.$inferInsert;
