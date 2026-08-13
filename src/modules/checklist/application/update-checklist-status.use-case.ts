import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { ChecklistCatalogRepository } from "../domain/checklist-catalog.repository";
import type { ChecklistStatusRepository } from "../domain/checklist-status.repository";
import type { CompanyChecklistItem, UpdateChecklistStatusInput } from "../domain/checklist.entity";

export class UpdateChecklistStatusUseCase {
  constructor(
    private readonly catalogRepository: ChecklistCatalogRepository,
    private readonly statusRepository: ChecklistStatusRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(
    companyId: string,
    checklistItemId: string,
    input: UpdateChecklistStatusInput,
    updatedBy: string | null,
  ): Promise<CompanyChecklistItem> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new NotFoundError("Empresa", "f");

    const catalogItem = await this.catalogRepository.findById(checklistItemId);
    if (!catalogItem) throw new NotFoundError("Ítem de checklist", "m");

    const status = await this.statusRepository.upsert(companyId, checklistItemId, input, updatedBy);

    return {
      ...catalogItem,
      status: status.status,
      notes: status.notes,
      updatedAt: status.updatedAt,
    };
  }
}
