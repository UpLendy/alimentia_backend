import { NotFoundError } from "../../../shared/errors";
import type { FixedDocumentRepository } from "../domain/fixed-document.repository";
import type { FixedDocumentVersion } from "../domain/fixed-document.entity";

export class ListFixedDocumentVersionsUseCase {
  constructor(private readonly repository: FixedDocumentRepository) {}

  async execute(companyId: string, documentId: string): Promise<FixedDocumentVersion[]> {
    const doc = await this.repository.findById(companyId, documentId);
    if (!doc) throw new NotFoundError("Documento");
    return this.repository.listVersions(documentId);
  }
}
