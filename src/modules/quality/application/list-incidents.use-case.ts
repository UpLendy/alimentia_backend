import type { AccessScope } from "../../../shared/domain/access-scope";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { IncidentRepository } from "../domain/incident.repository";
import type { Incident } from "../domain/incident.entity";
import { requireQualityPlan } from "./require-quality-plan";

export class ListIncidentsUseCase {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope): Promise<Incident[]> {
    await requireQualityPlan(this.companyRepository, scope.companyId);
    return this.repository.findAll(scope);
  }
}
