import type { FixedDocumentRepository } from "../domain/fixed-document.repository";
import type { FixedDocument } from "../domain/fixed-document.entity";

export class ListFixedDocumentsUseCase {
  constructor(private readonly repository: FixedDocumentRepository) {}

  async execute(companyId: string): Promise<FixedDocument[]> {
    return this.repository.findAllByCompany(companyId);
  }
}
