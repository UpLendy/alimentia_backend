import { t } from "elysia";

export const createSignatureBody = t.Object({
  entityType: t.String({ minLength: 1 }),
  entityId: t.String({ format: "uuid" }),
});

export const listSignaturesQuery = t.Object({
  entityType: t.String({ minLength: 1 }),
  entityId: t.String({ format: "uuid" }),
});
