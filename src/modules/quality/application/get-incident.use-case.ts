import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { IncidentRepository } from "../domain/incident.repository";
import type { Incident } from "../domain/incident.entity";
import { requireQualityPlan } from "./require-quality-plan";

export class GetIncidentUseCase {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope, id: string): Promise<Incident> {
    await requireQualityPlan(this.companyRepository, scope.companyId);
    const incident = await this.repository.findById(scope, id);
    if (!incident) throw new NotFoundError("Incidente");
    return incident;
  }
}
