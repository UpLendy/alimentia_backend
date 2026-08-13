import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { NonConformityRepository } from "../domain/non-conformity.repository";
import type { NonConformity } from "../domain/non-conformity.entity";
import { requireQualityPlan } from "./require-quality-plan";

export class GetNonConformityUseCase {
  constructor(
    private readonly repository: NonConformityRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope, id: string): Promise<NonConformity> {
    await requireQualityPlan(this.companyRepository, scope.companyId);
    const nonConformity = await this.repository.findById(scope, id);
    if (!nonConformity) throw new NotFoundError("No conformidad", "f");
    return nonConformity;
  }
}
