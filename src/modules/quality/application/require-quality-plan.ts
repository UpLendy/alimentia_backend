import { planHasFeature } from "../../../config/plans";
import { ForbiddenError, NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";

// No conformidades / CAPA es una feature de plan Pro/Plus (ver
// src/config/plans.ts, FeatureKey "no_conformidades") — el plan Básico no la
// incluye. Se valida acá, desde cada caso de uso del módulo, y no en la
// ruta: es una regla de negocio, no un detalle de transporte HTTP.
export async function requireQualityPlan(companyRepository: CompanyRepository, companyId: string): Promise<void> {
  const company = await companyRepository.findById(companyId);
  if (!company) throw new NotFoundError("Empresa", "f");

  if (!planHasFeature(company.plan, "no_conformidades")) {
    throw new ForbiddenError(
      "El módulo de No Conformidades no está incluido en tu plan actual. Actualiza a Pro o Plus para usarlo.",
    );
  }
}
