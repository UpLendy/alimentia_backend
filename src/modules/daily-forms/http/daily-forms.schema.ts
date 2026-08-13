import { t } from "elysia";

export const createDailyFormBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  formDate: t.String({ format: "date" }),
  shift: t.Optional(t.Union([t.Literal("manana"), t.Literal("tarde"), t.Literal("noche")])),
  observations: t.Optional(t.String()),
  // El payload se valida en CreateDailyFormUseCase contra
  // domain/daily-form-payload.schema.ts según el formType de la ruta.
  payload: t.Record(t.String(), t.Unknown()),
});
