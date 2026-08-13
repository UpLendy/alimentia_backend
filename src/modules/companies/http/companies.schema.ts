import { t } from "elysia";

export const updateCompanyBody = t.Partial(
  t.Object({
    name: t.String({ minLength: 2 }),
    nit: t.String(),
    email: t.String({ format: "email" }),
    phone: t.String(),
    address: t.String(),
    logoUrl: t.String(),
  }),
);
