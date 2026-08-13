import type { AccessScope } from "../../../shared/domain/access-scope";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { RecallRepository } from "../domain/recall.repository";
import type { Recall } from "../domain/recall.entity";
import { requireTraceabilityPlan } from "./require-traceability-plan";

export class ListRecallsUseCase {
  constructor(
    private readonly repository: RecallRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope): Promise<Recall[]> {
    await requireTraceabilityPlan(this.companyRepository, scope.companyId);
    return this.repository.findAllByCompany(scope);
  }
}
