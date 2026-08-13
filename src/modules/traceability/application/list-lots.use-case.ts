import { getVigenciaStatus } from "../../../lib/dates";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { LotRepository } from "../domain/lot.repository";
import type { LotWithStatus } from "../domain/lot.entity";
import { requireTraceabilityPlan } from "./require-traceability-plan";

export class ListLotsUseCase {
  constructor(
    private readonly repository: LotRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(scope: AccessScope, options?: { expiringInDays?: number }): Promise<LotWithStatus[]> {
    await requireTraceabilityPlan(this.companyRepository, scope.companyId);

    const lots = await this.repository.findAll(scope);
    const withStatus: LotWithStatus[] = lots.map((lot) => ({
      ...lot,
      expiryStatus: getVigenciaStatus(lot.expiryDate),
    }));

    if (options?.expiringInDays === undefined) return withStatus;

    // "Por vencer pronto": mismo cálculo de vigencia que expiryStatus, pero
    // con la ventana que pide el cliente en vez del default de 30 días —
    // excluye lo que todavía está "vigente" dentro de esa ventana.
    return withStatus.filter((lot) => getVigenciaStatus(lot.expiryDate, options.expiringInDays) !== "vigente");
  }
}
