import { t } from "elysia";

// DTOs de request (validación HTTP). No confundir con domain/*.entity.ts:
// esto describe el shape que acepta la API, no la regla de negocio.
const severity = t.Union([t.Literal("baja"), t.Literal("media"), t.Literal("alta")]);
const sourceType = t.Union([t.Literal("manual"), t.Literal("formato"), t.Literal("auditoria")]);

export const createNonConformityBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  description: t.String({ minLength: 2 }),
  severity: t.Optional(severity),
  sourceType: t.Optional(sourceType),
  sourceReferenceId: t.Optional(t.String({ format: "uuid" })),
  correctiveAction: t.Optional(t.String()),
  responsibleUserId: t.Optional(t.String({ format: "uuid" })),
  dueDate: t.Optional(t.String({ format: "date" })),
  evidenceFileUrl: t.Optional(t.String()),
});

// No incluye "cerrada": ese estado solo se alcanza vía
// PATCH /non-conformities/:id/close (ver CloseNonConformityUseCase).
export const updateNonConformityBody = t.Composite([
  t.Partial(createNonConformityBody),
  t.Object({ status: t.Optional(t.Union([t.Literal("abierta"), t.Literal("en_proceso")])) }),
]);

export const closeNonConformityBody = t.Object({
  correctiveAction: t.Optional(t.String()),
});

export const createIncidentBody = t.Object({
  sedeId: t.String({ format: "uuid" }),
  description: t.String({ minLength: 2 }),
  occurredAt: t.String({ format: "date-time" }),
  type: t.Optional(t.String()),
  severity: t.Optional(severity),
  resolution: t.Optional(t.String()),
});
