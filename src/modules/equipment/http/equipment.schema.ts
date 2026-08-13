import { t } from "elysia";

export const createEquipmentBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  name: t.String({ minLength: 2 }),
  brandModel: t.Optional(t.String()),
  locationArea: t.Optional(t.String()),
  serial: t.Optional(t.String()),
  lastCalibrationDate: t.String({ format: "date" }),
  calibrationFrequency: t.Union([t.Literal("semestral"), t.Literal("anual"), t.Literal("bianual")]),
});

// `active` solo se puede tocar en el update (revertir un soft-delete), no
// al crear — por eso vive aquí y no en createEquipmentBody.
export const updateEquipmentBody = t.Composite([
  t.Partial(createEquipmentBody),
  t.Object({ active: t.Optional(t.Boolean()) }),
]);
