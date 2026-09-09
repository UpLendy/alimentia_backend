import { t } from "elysia";

// DTOs de request (validación HTTP). No confundir con domain/ticket.entity.ts:
// esto describe el shape que acepta la API, no la regla de negocio.
const ticketType = t.Union([t.Literal("bug"), t.Literal("mejora"), t.Literal("duda")]);
const ticketStatus = t.Union([t.Literal("abierto"), t.Literal("en_progreso"), t.Literal("resuelto")]);

export const createTicketBody = t.Object({
  title: t.String({ minLength: 2 }),
  description: t.String({ minLength: 2 }),
  type: ticketType,
  pageContext: t.String({ minLength: 1 }),
});

export const listTicketsQuery = t.Object({
  status: t.Optional(ticketStatus),
  type: t.Optional(ticketType),
});

export const updateTicketStatusBody = t.Object({
  status: ticketStatus,
});
