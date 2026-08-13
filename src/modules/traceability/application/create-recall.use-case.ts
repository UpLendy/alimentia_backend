import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { LotRepository } from "../domain/lot.repository";
import type { RecallRepository } from "../domain/recall.repository";
import type { NewRecallInput, Recall } from "../domain/recall.entity";
import { requireTraceabilityPlan } from "./require-traceability-plan";

export class CreateRecallUseCase {
  constructor(
    private readonly lotRepository: LotRepository,
    private readonly recallRepository: RecallRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope, lotId: string, input: NewRecallInput): Promise<Recall> {
    await requireTraceabilityPlan(this.companyRepository, scope.companyId);

    // El lote debe pertenecer a la empresa (y sede, si aplica) del usuario
    // autenticado — si no, se podría iniciar un recall sobre un lote ajeno
    // pasando su id a mano (mismo riesgo que supplierId ajeno en
    // AddSupplierDocumentUseCase).
    const lot = await this.lotRepository.findById(scope, lotId);
    if (!lot) throw new NotFoundError("Lote");

    const recall = await this.recallRepository.create(lotId, input);
    await this.lotRepository.updateStatus(lotId, "retirado");
    return recall;
  }
}
