import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { LotRepository } from "../domain/lot.repository";
import type { Lot, NewLotInput } from "../domain/lot.entity";
import { requireTraceabilityPlan } from "./require-traceability-plan";

export class CreateLotUseCase {
  constructor(
    private readonly repository: LotRepository,
    private readonly sedeRepository: SedeRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, input: NewLotInput): Promise<Lot> {
    await requireTraceabilityPlan(this.companyRepository, companyId);

    // La sede indicada debe pertenecer a la misma empresa del usuario
    // autenticado — si no, un admin de la empresa B podría "colgar" un lote
    // suyo de una sede de la empresa A pasando su sedeId a mano (mismo
    // riesgo que en CreateEmployeeUseCase).
    const sede = await this.sedeRepository.findById(companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    return this.repository.create(companyId, input);
  }
}
