import { t } from "elysia";

export const updateChecklistStatusBody = t.Object({
  status: t.Optional(t.Union([t.Literal("pendiente"), t.Literal("en_desarrollo"), t.Literal("completo")])),
  notes: t.Optional(t.String()),
});
