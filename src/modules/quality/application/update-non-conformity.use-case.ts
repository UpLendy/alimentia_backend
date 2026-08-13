import { NotFoundError } from "../../../shared/errors";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { NonConformityRepository } from "../domain/non-conformity.repository";
import type { NonConformity, UpdateNonConformityInput } from "../domain/non-conformity.entity";
import { requireQualityPlan } from "./require-quality-plan";

// Actualización genérica: no permite pasar a "cerrada" (ver
// UpdateNonConformityInput y CloseNonConformityUseCase, que exige la acción
// correctiva antes de cerrar).
export class UpdateNonConformityUseCase {
  constructor(
    private readonly repository: NonConformityRepository,
    private readonly sedeRepository: SedeRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope, id: string, input: UpdateNonConformityInput): Promise<NonConformity> {
    await requireQualityPlan(this.companyRepository, scope.companyId);

    // Si el body trae sedeId, debe seguir perteneciendo a la empresa del
    // usuario (ver misma validación en CreateNonConformityUseCase).
    if (input.sedeId) {
      const sede = await this.sedeRepository.findById(scope.companyId, input.sedeId);
      if (!sede) throw new NotFoundError("Sede", "f");
    }

    const updated = await this.repository.update(scope, id, input);
    if (!updated) throw new NotFoundError("No conformidad", "f");
    return updated;
  }
}
