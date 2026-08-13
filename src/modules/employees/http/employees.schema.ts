import { t } from "elysia";

// DTOs de request (validación HTTP). No confundir con domain/employee.entity.ts:
// esto describe el shape que acepta la API, no la regla de negocio.
export const createEmployeeBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  fullName: t.String({ minLength: 2 }),
  documentId: t.String({ minLength: 3 }),
  position: t.String(),
  hireDate: t.String({ format: "date" }),
  medicalExamDate: t.Optional(t.String({ format: "date" })),
  hasFoodHandlerCert: t.Optional(t.Boolean()),
  trainingHoursCompleted: t.Optional(t.Number({ minimum: 0 })),
  trainingHoursRequired: t.Optional(t.Number({ minimum: 0 })),
});

// `active` solo se puede tocar en el update (revertir un soft-delete), no
// al crear — por eso vive aquí y no en createEmployeeBody.
export const updateEmployeeBody = t.Composite([
  t.Partial(createEmployeeBody),
  t.Object({ active: t.Optional(t.Boolean()) }),
]);
