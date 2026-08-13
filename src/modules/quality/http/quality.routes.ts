import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleNonConformityRepository } from "../infrastructure/non-conformity.drizzle-repository";
import { DrizzleIncidentRepository } from "../infrastructure/incident.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import { DrizzleCompanyRepository } from "../../companies/infrastructure/company.drizzle-repository";
import {
  ListNonConformitiesUseCase,
  GetNonConformityUseCase,
  CreateNonConformityUseCase,
  UpdateNonConformityUseCase,
  CloseNonConformityUseCase,
  ListIncidentsUseCase,
  GetIncidentUseCase,
  CreateIncidentUseCase,
} from "../application";
import { createNonConformityBody, updateNonConformityBody, closeNonConformityBody, createIncidentBody } from "./quality.schema";

// Composition root del módulo: se instancia una sola vez al cargar el
// archivo (ver mismo patrón en traceability.routes.ts).
const nonConformityRepository = new DrizzleNonConformityRepository();
const incidentRepository = new DrizzleIncidentRepository();
const sedeRepository = new DrizzleSedeRepository();
const companyRepository = new DrizzleCompanyRepository();

const listNonConformities = new ListNonConformitiesUseCase(nonConformityRepository, companyRepository);
const getNonConformity = new GetNonConformityUseCase(nonConformityRepository, companyRepository);
const createNonConformity = new CreateNonConformityUseCase(nonConformityRepository, sedeRepository, companyRepository);
const updateNonConformity = new UpdateNonConformityUseCase(nonConformityRepository, sedeRepository, companyRepository);
const closeNonConformity = new CloseNonConformityUseCase(nonConformityRepository, companyRepository);
const listIncidents = new ListIncidentsUseCase(incidentRepository, companyRepository);
const getIncident = new GetIncidentUseCase(incidentRepository, companyRepository);
const createIncident = new CreateIncidentUseCase(incidentRepository, sedeRepository, companyRepository);

// No conformidades (CAPA) e incidentes (feature Pro/Plus, ver
// require-quality-plan.ts). Dos recursos sin prefijo común, por eso no se
// usa la opción `prefix` de Elysia. Este archivo es el "controlador":
// traduce HTTP <-> casos de uso, no tiene lógica de negocio.
export const qualityRoutes = new Elysia({ tags: ["Quality"] })
  .use(requireAuth)
  .get("/non-conformities", async ({ user, set }) => {
    try {
      return await listNonConformities.execute(toScope(user!));
    } catch (err) {
      return mapError(err, set);
    }
  })
  .get(
    "/non-conformities/:id",
    async ({ user, params, set }) => {
      try {
        return await getNonConformity.execute(toScope(user!), params.id);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  )
  .get("/incidents", async ({ user, set }) => {
    try {
      return await listIncidents.execute(toScope(user!));
    } catch (err) {
      return mapError(err, set);
    }
  })
  .get(
    "/incidents/:id",
    async ({ user, params, set }) => {
      try {
        return await getIncident.execute(toScope(user!), params.id);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  )
  .use(requireRole(["admin", "supervisor", "bpm_admin"]))
  .post(
    "/non-conformities",
    async ({ user, body, set }) => {
      try {
        const nonConformity = await createNonConformity.execute(toScope(user!).companyId, body);
        return { nonConformity };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createNonConformityBody },
  )
  .patch(
    "/non-conformities/:id",
    async ({ user, params, body, set }) => {
      try {
        const nonConformity = await updateNonConformity.execute(toScope(user!), params.id, body);
        return { nonConformity };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: updateNonConformityBody },
  )
  .patch(
    "/non-conformities/:id/close",
    async ({ user, params, body, set }) => {
      try {
        const nonConformity = await closeNonConformity.execute(toScope(user!), params.id, body.correctiveAction);
        return { nonConformity };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: closeNonConformityBody },
  )
  .post(
    "/incidents",
    async ({ user, body, set }) => {
      try {
        const incident = await createIncident.execute(toScope(user!).companyId, user!.sub, body);
        return { incident };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createIncidentBody },
  );
