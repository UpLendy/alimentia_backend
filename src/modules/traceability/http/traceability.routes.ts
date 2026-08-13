import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleLotRepository } from "../infrastructure/lot.drizzle-repository";
import { DrizzleRecallRepository } from "../infrastructure/recall.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import { DrizzleCompanyRepository } from "../../companies/infrastructure/company.drizzle-repository";
import { ListLotsUseCase, CreateLotUseCase, CreateRecallUseCase, ListRecallsUseCase } from "../application";
import { createLotBody, createRecallBody } from "./traceability.schema";

// Composition root del módulo: se instancia una sola vez al cargar el
// archivo. Si mañana hay que testear los casos de uso con un repositorio en
// memoria, esto es lo único que cambia (no las rutas).
const lotRepository = new DrizzleLotRepository();
const recallRepository = new DrizzleRecallRepository();
const sedeRepository = new DrizzleSedeRepository();
const companyRepository = new DrizzleCompanyRepository();
const listLots = new ListLotsUseCase(lotRepository, companyRepository);
const createLot = new CreateLotUseCase(lotRepository, sedeRepository, companyRepository);
const createRecall = new CreateRecallUseCase(lotRepository, recallRepository, companyRepository);
const listRecalls = new ListRecallsUseCase(recallRepository, companyRepository);

// Trazabilidad y Recall (feature Pro/Plus, ver require-traceability-plan.ts).
// Dos recursos (lots, recalls) sin prefijo común, por eso no se usa la
// opción `prefix` de Elysia como en el resto de los módulos. Este archivo es
// el "controlador": traduce HTTP <-> casos de uso. No tiene lógica de
// negocio ni sabe qué ORM se usa — eso vive en application/ e
// infrastructure/ respectivamente.
export const traceabilityRoutes = new Elysia({ tags: ["Traceability"] })
  .use(requireAuth)
  .get(
    "/lots",
    async ({ user, query, set }) => {
      try {
        const expiringInDays = query.expiringInDays !== undefined ? Number(query.expiringInDays) : undefined;
        return await listLots.execute(toScope(user!), { expiringInDays });
      } catch (err) {
        return mapError(err, set);
      }
    },
    { query: t.Object({ expiringInDays: t.Optional(t.Numeric()) }) },
  )
  .get("/recalls", async ({ user, set }) => {
    try {
      return await listRecalls.execute(toScope(user!));
    } catch (err) {
      return mapError(err, set);
    }
  })
  .use(requireRole(["admin", "supervisor", "bpm_admin"]))
  .post(
    "/lots",
    async ({ user, body, set }) => {
      try {
        const lot = await createLot.execute(toScope(user!).companyId, body);
        return { lot };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createLotBody },
  )
  .post(
    "/lots/:id/recall",
    async ({ user, params, body, set }) => {
      try {
        const recall = await createRecall.execute(toScope(user!), params.id, body);
        return { recall };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: createRecallBody },
  );
