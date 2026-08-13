import { NotFoundError } from "../../../shared/errors";
import type { FixedDocumentRepository } from "../domain/fixed-document.repository";
import type { FixedDocument } from "../domain/fixed-document.entity";
import type { SignatureRepository } from "../../signatures/domain/signature.repository";
import { computeSignatureHash } from "../../signatures/domain/signature.entity";

export class ApproveFixedDocumentUseCase {
  constructor(
    private readonly repository: FixedDocumentRepository,
    private readonly signatureRepository: SignatureRepository,
  ) {}

  async execute(
    companyId: string,
    id: string,
    approvedBy: string,
    ipAddress: string | null,
  ): Promise<FixedDocument> {
    const updated = await this.repository.approve(companyId, id, approvedBy);
    if (!updated) throw new NotFoundError("Documento");

    // Firma automática al aprobar: deja la auditoría completa (quién, cuándo,
    // desde qué IP) sin depender de que el cliente llame a /signatures por
    // separado. Se llama directo al repositorio (no por HTTP) para poder
    // compartir la misma transacción que el approve — ver fixed-documents.routes.ts.
    const timestamp = new Date().toISOString();
    const hash = computeSignatureHash("fixed_document", updated.id, approvedBy, timestamp);
    await this.signatureRepository.create({
      entityType: "fixed_document",
      entityId: updated.id,
      userId: approvedBy,
      ipAddress,
      hash,
    });

    return updated;
  }
}
