import { ForbiddenError, NotFoundError } from "../../../shared/errors";
import { planHasFeature } from "../../../config/plans";
import type { CompanyRepository } from "../../companies/domain/company.repository";

// Proveedores es una feature de plan Pro/Plus (ver src/config/plans.ts,
// FeatureKey "proveedores") — el plan Básico no la incluye. Se valida acá,
// desde cada caso de uso del módulo, y no en la ruta: es una regla de
// negocio, no un detalle de transporte HTTP.
export async function requireSuppliersPlan(companyRepository: CompanyRepository, companyId: string): Promise<void> {
  const company = await companyRepository.findById(companyId);
  if (!company) throw new NotFoundError("Empresa", "f");

  if (!planHasFeature(company.plan, "proveedores")) {
    throw new ForbiddenError(
      "El módulo de Proveedores no está incluido en tu plan actual. Actualiza a Pro o Plus para usarlo.",
    );
  }
}
