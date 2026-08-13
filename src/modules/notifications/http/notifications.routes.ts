import { Elysia, t } from "elysia";
import { requireAuth } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleNotificationRepository } from "../infrastructure/notification.drizzle-repository";
import { ListNotificationsUseCase, MarkNotificationReadUseCase } from "../application";

const repository = new DrizzleNotificationRepository();
const listNotifications = new ListNotificationsUseCase(repository);
const markNotificationRead = new MarkNotificationReadUseCase(repository);

// Ninguno de los dos endpoints necesita un body (GET no recibe nada, PATCH
// solo cambia status → "leida"), así que no hay un notifications.schema.ts:
// el único shape HTTP a validar es el :id de la URL, inline abajo.
export const notificationsRoutes = new Elysia({ prefix: "/notifications", tags: ["Notifications"] })
  .use(requireAuth)
  .get("/", async ({ user }) => listNotifications.execute(toScope(user!)))
  .patch(
    "/:id/read",
    async ({ user, params, set }) => {
      try {
        const notification = await markNotificationRead.execute(toScope(user!), params.id);
        return { notification };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  );
