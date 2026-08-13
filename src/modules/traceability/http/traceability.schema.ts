import { t } from "elysia";

// DTOs de request (validación HTTP). No confundir con domain/lot.entity.ts:
// esto describe el shape que acepta la API, no la regla de negocio.
export const createLotBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  productName: t.String({ minLength: 2 }),
  lotCode: t.String({ minLength: 1 }),
  supplierId: t.Optional(t.String({ format: "uuid" })),
  receivedDate: t.String({ format: "date" }),
  expiryDate: t.Optional(t.String({ format: "date" })),
  quantity: t.Optional(t.String()),
  unit: t.Optional(t.String()),
  allergens: t.Optional(t.Array(t.String())),
});

export const createRecallBody = t.Object({
  reason: t.String({ minLength: 2 }),
  actionsTaken: t.Optional(t.String()),
});
