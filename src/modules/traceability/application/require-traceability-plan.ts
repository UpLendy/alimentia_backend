import { planHasFeature } from "../../../config/plans";
import { ForbiddenError, NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";

// Trazabilidad y Recall es una feature de plan Pro/Plus (ver
// src/config/plans.ts, FeatureKey "trazabilidad_recall") — el plan Básico no
// la incluye. Se valida acá, desde cada caso de uso del módulo, y no en la
// ruta: es una regla de negocio, no un detalle de transporte HTTP.
export async function requireTraceabilityPlan(companyRepository: CompanyRepository, companyId: string): Promise<void> {
  const company = await companyRepository.findById(companyId);
  if (!company) throw new NotFoundError("Empresa", "f");

  if (!planHasFeature(company.plan, "trazabilidad_recall")) {
    throw new ForbiddenError(
      "El módulo de Trazabilidad y Recall no está incluido en tu plan actual. Actualiza a Pro o Plus para usarlo.",
    );
  }
}
