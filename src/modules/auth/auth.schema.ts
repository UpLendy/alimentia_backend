import { t } from "elysia";

export const loginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

export const registerUserBody = t.Object({
  fullName: t.String({ minLength: 2 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  role: t.Union([t.Literal("admin"), t.Literal("supervisor"), t.Literal("operario")]),
  sedeId: t.Optional(t.String({ format: "uuid" })),
});

export const refreshBody = t.Object({
  refreshToken: t.String({ minLength: 20 }),
});

export const logoutBody = t.Object({
  refreshToken: t.String({ minLength: 20 }),
});

export const changeRoleBody = t.Object({
  role: t.Union([t.Literal("admin"), t.Literal("supervisor"), t.Literal("operario")]),
});
