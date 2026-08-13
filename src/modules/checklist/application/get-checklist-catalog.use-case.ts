import type { ChecklistCatalogRepository } from "../domain/checklist-catalog.repository";
import type { ChecklistCatalogItem } from "../domain/checklist.entity";

export class GetChecklistCatalogUseCase {
  constructor(private readonly catalogRepository: ChecklistCatalogRepository) {}

  async execute(): Promise<ChecklistCatalogItem[]> {
    return this.catalogRepository.findAll();
  }
}
