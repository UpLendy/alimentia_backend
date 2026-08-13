import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { ChecklistCatalogRepository } from "../domain/checklist-catalog.repository";
import type { ChecklistStatusRepository } from "../domain/checklist-status.repository";
import type { CompanyChecklistItem } from "../domain/checklist.entity";

// Combina el catálogo maestro (igual para todos) con el avance puntual de
// una empresa cliente. Los ítems sin fila propia en company_checklist_status
// todavía quedan "pendiente" (default de la tabla), sin necesidad de
// sembrarlos por adelantado para cada empresa.
export class ListCompanyChecklistStatusUseCase {
  constructor(
    private readonly catalogRepository: ChecklistCatalogRepository,
    private readonly statusRepository: ChecklistStatusRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string): Promise<CompanyChecklistItem[]> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new NotFoundError("Empresa", "f");

    const [catalog, statuses] = await Promise.all([
      this.catalogRepository.findAll(),
      this.statusRepository.findAllByCompany(companyId),
    ]);

    const statusByItem = new Map(statuses.map((s) => [s.checklistItemId, s]));

    return catalog.map((item) => {
      const status = statusByItem.get(item.id);
      return {
        ...item,
        status: status?.status ?? "pendiente",
        notes: status?.notes ?? null,
        updatedAt: status?.updatedAt ?? null,
      };
    });
  }
}
