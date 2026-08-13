import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError, ValidationError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { NonConformityRepository } from "../domain/non-conformity.repository";
import type { NonConformity } from "../domain/non-conformity.entity";
import { requireQualityPlan } from "./require-quality-plan";

export class CloseNonConformityUseCase {
  constructor(
    private readonly repository: NonConformityRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope, id: string, correctiveAction?: string): Promise<NonConformity> {
    await requireQualityPlan(this.companyRepository, scope.companyId);

    const existing = await this.repository.findById(scope, id);
    if (!existing) throw new NotFoundError("No conformidad", "f");

    // Regla de negocio (no de transporte HTTP, por eso no vive en el schema
    // TypeBox): no se puede cerrar una no conformidad sin acción correctiva
    // documentada. Acepta la que venga en este request o, si ya se había
    // registrado antes vía PATCH /non-conformities/:id, la existente.
    const correctiveActionToSave = (correctiveAction ?? existing.correctiveAction ?? "").trim();
    if (!correctiveActionToSave) {
      throw new ValidationError("Debes registrar la acción correctiva antes de cerrar la no conformidad.");
    }

    const updated = await this.repository.update(scope, id, {
      status: "cerrada",
      correctiveAction: correctiveActionToSave,
      closedAt: new Date(),
    });
    if (!updated) throw new NotFoundError("No conformidad", "f");
    return updated;
  }
}
