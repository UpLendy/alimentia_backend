import { t } from "elysia";

export const requestUploadUrlBody = t.Object({
  fileName: t.String(),
  contentType: t.String(),
});

export const createAttachmentBody = t.Object({
  sedeId: t.Optional(t.String({ format: "uuid" })),
  category: t.String(),
  linkedDocumentId: t.Optional(t.String({ format: "uuid" })),
  name: t.String({ minLength: 2 }),
  documentDate: t.Optional(t.String({ format: "date" })),
  fileKey: t.String(),
  fileUrl: t.String(),
  fileType: t.Optional(t.String()),
  fileSizeBytes: t.Optional(t.Number()),
});
