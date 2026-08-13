import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleSedeRepository } from "../infrastructure/sede.drizzle-repository";
import { DrizzleCompanyRepository } from "../../companies/infrastructure/company.drizzle-repository";
import { ListSedesUseCase, CreateSedeUseCase, UpdateSedeUseCase } from "../application";
import { createSedeBody, updateSedeBody } from "./sedes.schema";

const repository = new DrizzleSedeRepository();
const companyRepository = new DrizzleCompanyRepository();
const listSedes = new ListSedesUseCase(repository);
const createSede = new CreateSedeUseCase(repository, companyRepository);
const updateSede = new UpdateSedeUseCase(repository);

// Sedes: plan Básico = 1 sede, Pro/Plus permiten varias (multi-sede).
export const sedesRoutes = new Elysia({ prefix: "/sedes", tags: ["Sedes"] })
  .use(requireAuth)
  .get("/", async ({ user, set }) => {
    try {
      return await listSedes.execute(toScope(user!).companyId);
    } catch (err) {
      return mapError(err, set);
    }
  })
  .use(requireRole(["admin", "bpm_admin"]))
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        return await createSede.execute(toScope(user!).companyId, body);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createSedeBody },
  )
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const sede = await updateSede.execute(toScope(user!).companyId, params.id, body);
        return { sede };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: updateSedeBody },
  );
