import { pgTable, uuid, text, date, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sedes } from "./sedes";

// Personal / Capacitaciones (src/app/personal)
export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    sedeId: uuid("sede_id")
      .notNull()
      .references(() => sedes.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    documentId: text("document_id").notNull(),
    position: text("position").notNull(),
    hireDate: date("hire_date").notNull(),

    // Requisitos sanitarios Res. 2674 Art. 11-12
    medicalExamDate: date("medical_exam_date"),
    medicalExamExpiry: date("medical_exam_expiry"), // calculado: medicalExamDate + 1 año
    hasFoodHandlerCert: boolean("has_food_handler_cert").notNull().default(false),

    // Resumen de plan de capacitación continua (10h/año obligatorias). El detalle
    // por curso vive en la tabla `trainings`.
    trainingHoursCompleted: integer("training_hours_completed").notNull().default(0),
    trainingHoursRequired: integer("training_hours_required").notNull().default(10),

    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("employees_company_idx").on(table.companyId),
    sedeIdx: index("employees_sede_idx").on(table.sedeId),
  }),
);

// Certificados adjuntos del empleado (examen médico, manipulación de alimentos, etc.)
export const employeeAttachments = pgTable("employee_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  fileKey: text("file_key").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type EmployeeAttachment = typeof employeeAttachments.$inferSelect;
