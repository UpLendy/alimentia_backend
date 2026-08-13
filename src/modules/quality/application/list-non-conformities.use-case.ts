import type { AccessScope } from "../../../shared/domain/access-scope";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { NonConformityRepository } from "../domain/non-conformity.repository";
import type { NonConformity } from "../domain/non-conformity.entity";
import { requireQualityPlan } from "./require-quality-plan";

export class ListNonConformitiesUseCase {
  constructor(
    private readonly repository: NonConformityRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope): Promise<NonConformity[]> {
    await requireQualityPlan(this.companyRepository, scope.companyId);
    return this.repository.findAll(scope);
  }
}
