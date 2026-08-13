import { t } from "elysia";

export const createFixedDocumentBody = t.Object({
  sedeId: t.Optional(t.String({ format: "uuid" })),
  name: t.String({ minLength: 2 }),
  category: t.Optional(t.String()),
  fileKey: t.String(),
  fileUrl: t.String(),
});

export const newVersionBody = t.Object({
  fileKey: t.String(),
  fileUrl: t.String(),
});
