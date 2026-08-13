import { t } from "elysia";

export const createScheduledEventBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  serviceType: t.Union([t.Literal("agua"), t.Literal("superficies"), t.Literal("fumigacion"), t.Literal("trampas")]),
  proposedDate: t.String({ format: "date" }),
  providerName: t.Optional(t.String()),
  notes: t.Optional(t.String()),
});

export const updateScheduledEventBody = t.Partial(
  t.Object({
    sedeId: t.String({ format: "uuid" }),
    serviceType: t.Union([t.Literal("agua"), t.Literal("superficies"), t.Literal("fumigacion"), t.Literal("trampas")]),
    proposedDate: t.String({ format: "date" }),
    providerName: t.String(),
    notes: t.String(),
    status: t.Union([t.Literal("pendiente"), t.Literal("completado"), t.Literal("cancelado")]),
  }),
);
