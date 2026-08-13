import { Elysia } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleCompanyRepository } from "../infrastructure/company.drizzle-repository";
import { GetCompanyUseCase, UpdateCompanyUseCase, ListCompaniesUseCase } from "../application";
import { updateCompanyBody } from "./companies.schema";

const repository = new DrizzleCompanyRepository();
const getCompany = new GetCompanyUseCase(repository);
const updateCompany = new UpdateCompanyUseCase(repository);
const listCompanies = new ListCompaniesUseCase(repository);

// Configuración / Información del Negocio (src/app/settings)
export const companiesRoutes = new Elysia({ prefix: "/companies", tags: ["Companies"] })
  .use(requireAuth)
  .get("/me", async ({ user, set }) => {
    try {
      return await getCompany.execute(toScope(user!).companyId);
    } catch (err) {
      return mapError(err, set);
    }
  })
  .use(requireRole(["admin", "bpm_admin"]))
  .patch(
    "/me",
    async ({ user, body, set }) => {
      try {
        const company = await updateCompany.execute(toScope(user!).companyId, body);
        return { company };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: updateCompanyBody },
  )
  // Selector de empresa cliente del panel interno (src/app/admin/checklist):
  // solo bpm_admin puede enumerar todas las empresas, no solo la propia.
  .use(requireRole(["bpm_admin"]))
  .get("/", () => listCompanies.execute());
