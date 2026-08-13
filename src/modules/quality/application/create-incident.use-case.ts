import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { IncidentRepository } from "../domain/incident.repository";
import type { Incident, NewIncidentInput } from "../domain/incident.entity";
import { requireQualityPlan } from "./require-quality-plan";

export class CreateIncidentUseCase {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly sedeRepository: SedeRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, reportedBy: string, input: NewIncidentInput): Promise<Incident> {
    await requireQualityPlan(this.companyRepository, companyId);

    // Misma validación que CreateNonConformityUseCase: el sedeId debe
    // pertenecer a la empresa del usuario autenticado.
    const sede = await this.sedeRepository.findById(companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    return this.repository.create(companyId, { ...input, reportedBy });
  }
}
