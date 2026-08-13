import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleEquipmentRepository } from "../infrastructure/equipment.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import {
  ListEquipmentUseCase,
  CreateEquipmentUseCase,
  UpdateEquipmentUseCase,
  DeactivateEquipmentUseCase,
} from "../application";
import { createEquipmentBody, updateEquipmentBody } from "./equipment.schema";

const repository = new DrizzleEquipmentRepository();
const sedeRepository = new DrizzleSedeRepository();
const listEquipment = new ListEquipmentUseCase(repository);
const createEquipment = new CreateEquipmentUseCase(repository, sedeRepository);
const updateEquipment = new UpdateEquipmentUseCase(repository, sedeRepository);
const deactivateEquipment = new DeactivateEquipmentUseCase(repository);

// Infraestructura y Equipos (src/app/infraestructura)
export const equipmentRoutes = new Elysia({ prefix: "/equipment", tags: ["Equipment"] })
  .use(requireAuth)
  .get("/", async ({ user }) => listEquipment.execute(toScope(user!)))
  .use(requireRole(["admin", "supervisor", "bpm_admin"]))
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const equipment = await createEquipment.execute(toScope(user!).companyId, body);
        return { equipment };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createEquipmentBody },
  )
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const equipment = await updateEquipment.execute(toScope(user!), params.id, body);
        return { equipment };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: updateEquipmentBody },
  )
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      try {
        await deactivateEquipment.execute(toScope(user!), params.id);
        return { success: true };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  );
