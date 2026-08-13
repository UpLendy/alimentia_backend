import { NotFoundError } from "../../../shared/errors";
import type { FixedDocumentRepository } from "../domain/fixed-document.repository";
import type { FixedDocument, NewVersionInput } from "../domain/fixed-document.entity";

// Sube una nueva versión: incrementa currentVersion y guarda el histórico.
export class AddFixedDocumentVersionUseCase {
  constructor(private readonly repository: FixedDocumentRepository) {}

  async execute(
    companyId: string,
    documentId: string,
    uploadedBy: string,
    input: NewVersionInput,
  ): Promise<FixedDocument> {
    const doc = await this.repository.findById(companyId, documentId);
    if (!doc) throw new NotFoundError("Documento");

    const nextVersion = doc.currentVersion + 1;
    await this.repository.insertVersion(documentId, nextVersion, input, uploadedBy);
    const updated = await this.repository.updateCurrentFile(documentId, nextVersion, input);
    return updated!;
  }
}
