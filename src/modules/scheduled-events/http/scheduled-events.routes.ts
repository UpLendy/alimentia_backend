import { Elysia, t } from "elysia";
import { requireAuth } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleScheduledEventRepository } from "../infrastructure/scheduled-event.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import { ListScheduledEventsUseCase, CreateScheduledEventUseCase, UpdateScheduledEventUseCase } from "../application";
import { createScheduledEventBody, updateScheduledEventBody } from "./scheduled-events.schema";

const repository = new DrizzleScheduledEventRepository();
const sedeRepository = new DrizzleSedeRepository();
const listScheduledEvents = new ListScheduledEventsUseCase(repository);
const createScheduledEvent = new CreateScheduledEventUseCase(repository, sedeRepository);
const updateScheduledEvent = new UpdateScheduledEventUseCase(repository, sedeRepository);

// Alertas > Programar evento/análisis (src/app/alertas/programar)
export const scheduledEventsRoutes = new Elysia({ prefix: "/scheduled-events", tags: ["Scheduled Events"] })
  .use(requireAuth)
  .get("/", async ({ user }) => listScheduledEvents.execute(toScope(user!)))
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const scheduledEvent = await createScheduledEvent.execute(toScope(user!).companyId, user!.sub, body);
        return { scheduledEvent };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createScheduledEventBody },
  )
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const scheduledEvent = await updateScheduledEvent.execute(toScope(user!), params.id, body);
        return { scheduledEvent };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: updateScheduledEventBody },
  );
