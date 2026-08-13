import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleChecklistCatalogRepository } from "../infrastructure/checklist-catalog.drizzle-repository";
import { DrizzleChecklistStatusRepository } from "../infrastructure/checklist-status.drizzle-repository";
import { DrizzleCompanyRepository } from "../../companies/infrastructure/company.drizzle-repository";
import {
  GetChecklistCatalogUseCase,
  ListCompanyChecklistStatusUseCase,
  UpdateChecklistStatusUseCase,
} from "../application";
import { updateChecklistStatusBody } from "./checklist.schema";

// Composition root del módulo. Las rutas cuelgan de /checklist (catálogo,
// público para cualquier autenticado) y de /companies/:companyId (avance
// por cliente, solo bpm_admin) — no de un único prefix.
const catalogRepository = new DrizzleChecklistCatalogRepository();
const statusRepository = new DrizzleChecklistStatusRepository();
const companyRepository = new DrizzleCompanyRepository();

const getCatalog = new GetChecklistCatalogUseCase(catalogRepository);
const listCompanyChecklistStatus = new ListCompanyChecklistStatusUseCase(
  catalogRepository,
  statusRepository,
  companyRepository,
);
const updateChecklistStatus = new UpdateChecklistStatusUseCase(catalogRepository, statusRepository, companyRepository);

// Panel interno BPM Consulting (src/app/admin/checklist o similar): avance
// del "Checklist Maestro" por empresa cliente.
export const checklistRoutes = new Elysia({ tags: ["Checklist"] })
  .use(requireAuth)
  .get("/checklist/catalog", () => getCatalog.execute())
  .use(requireRole(["bpm_admin"]))
  .get(
    "/companies/:companyId/checklist-status",
    async ({ params, set }) => {
      try {
        return await listCompanyChecklistStatus.execute(params.companyId);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ companyId: t.String({ format: "uuid" }) }) },
  )
  .patch(
    "/companies/:companyId/checklist-status/:itemId",
    async ({ user, params, body, set }) => {
      try {
        const item = await updateChecklistStatus.execute(params.companyId, params.itemId, body, user!.sub);
        return { item };
      } catch (err) {
        return mapError(err, set);
      }
    },
    {
      params: t.Object({ companyId: t.String({ format: "uuid" }), itemId: t.String({ format: "uuid" }) }),
      body: updateChecklistStatusBody,
    },
  );
