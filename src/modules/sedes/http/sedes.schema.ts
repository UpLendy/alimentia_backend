import { t } from "elysia";

export const createSedeBody = t.Object({
  name: t.String({ minLength: 2 }),
  address: t.Optional(t.String()),
  city: t.Optional(t.String()),
  isMain: t.Optional(t.Boolean()),
});

export const updateSedeBody = t.Partial(createSedeBody);
