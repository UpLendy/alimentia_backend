import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { NonConformityRepository } from "../domain/non-conformity.repository";
import type { NonConformity, NewNonConformityInput } from "../domain/non-conformity.entity";
import { requireQualityPlan } from "./require-quality-plan";

export class CreateNonConformityUseCase {
  constructor(
    private readonly repository: NonConformityRepository,
    private readonly sedeRepository: SedeRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, input: NewNonConformityInput): Promise<NonConformity> {
    await requireQualityPlan(this.companyRepository, companyId);

    // La sede indicada debe pertenecer a la misma empresa del usuario
    // autenticado — si no, un admin de la empresa B podría "colgar" una no
    // conformidad suya de una sede de la empresa A pasando su sedeId a mano
    // (mismo riesgo que en CreateEmployeeUseCase).
    const sede = await this.sedeRepository.findById(companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    return this.repository.create(companyId, input);
  }
}
