import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleTicketRepository } from "../infrastructure/ticket.drizzle-repository";
import { CreateTicketUseCase, ListMyTicketsUseCase, ListAllTicketsUseCase, UpdateTicketStatusUseCase } from "../application";
import { createTicketBody, listTicketsQuery, updateTicketStatusBody } from "./tickets.schema";

// Composition root del módulo: se instancia una sola vez al cargar el archivo.
const repository = new DrizzleTicketRepository();
const createTicket = new CreateTicketUseCase(repository);
const listMyTickets = new ListMyTicketsUseCase(repository);
const listAllTickets = new ListAllTicketsUseCase(repository);
const updateTicketStatus = new UpdateTicketStatusUseCase(repository);

// Herramienta interna: reportar bugs/mejoras/dudas encontrados durante las
// pruebas de la plataforma. No depende de plan/feature-gating (a propósito:
// no es un módulo del producto que se venda). Panel de administración
// (src/app/admin/tickets o similar) exclusivo de bpm_admin.
export const ticketsRoutes = new Elysia({ prefix: "/tickets", tags: ["Tickets"] })
  .use(requireAuth)
  .get(
    "/",
    async ({ user, query }) => {
      const filters = { status: query.status, type: query.type };
      // bpm_admin (staff de BPM Consulting) ve todos los tickets de todas las
      // empresas; cualquier otro rol solo ve los que él mismo creó — ni
      // siquiera otro admin de su misma empresa ve los ajenos.
      if (user!.role === "bpm_admin") {
        return listAllTickets.execute(filters);
      }
      return listMyTickets.execute(user!.sub, filters);
    },
    { query: listTicketsQuery },
  )
  .post(
    "/",
    async ({ user, body }) => {
      const ticket = await createTicket.execute(user!.companyId, user!.sub, body);
      return { ticket };
    },
    { body: createTicketBody },
  )
  .use(requireRole(["bpm_admin"]))
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const ticket = await updateTicketStatus.execute(params.id, body.status);
        return { ticket };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: updateTicketStatusBody },
  );
