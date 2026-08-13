import { t } from "elysia";

// DTOs de request (validación HTTP). No confundir con domain/supplier.entity.ts:
// esto describe el shape que acepta la API, no la regla de negocio.
export const createSupplierBody = t.Object({
  name: t.String({ minLength: 2 }),
  nit: t.Optional(t.String()),
  category: t.Optional(t.String()),
  contactName: t.Optional(t.String()),
  contactPhone: t.Optional(t.String()),
  contactEmail: t.Optional(t.String({ format: "email" })),
});

// `status` solo se puede tocar en el update, no al crear.
export const updateSupplierBody = t.Composite([
  t.Partial(createSupplierBody),
  t.Object({ status: t.Optional(t.Union([t.Literal("activo"), t.Literal("inactivo")])) }),
]);

// fileKey/fileUrl llegan del flujo existente POST /attachments/upload-url +
// PUT directo a S3 — este endpoint no reimplementa esa subida.
export const addSupplierDocumentBody = t.Object({
  label: t.String({ minLength: 2 }),
  fileKey: t.String(),
  fileUrl: t.String(),
  expiryDate: t.Optional(t.String({ format: "date" })),
});

export const addSupplierEvaluationBody = t.Object({
  evaluatedAt: t.String({ format: "date" }),
  score: t.Number({ minimum: 0, maximum: 100 }),
  notes: t.Optional(t.String()),
});
