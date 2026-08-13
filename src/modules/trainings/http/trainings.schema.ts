import { t } from "elysia";

export const createTrainingBody = t.Object({
  topic: t.String({ minLength: 1 }),
  trainingDate: t.String({ format: "date" }),
  hours: t.Integer({ minimum: 1 }),
  evaluationScore: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
  certificateFileUrl: t.Optional(t.String()),
  expiresAt: t.Optional(t.String({ format: "date" })),
});
