import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError, ValidationError } from "../../../shared/errors";
import type { FixedDocumentRepository } from "../../fixed-documents/domain/fixed-document.repository";
import type { NonConformityRepository } from "../../quality/domain/non-conformity.repository";
import type { SignatureRepository } from "../domain/signature.repository";
import type { Signature } from "../domain/signature.entity";

// Misma verificación de pertenencia que CreateSignatureUseCase: sin ella,
// cualquier usuario autenticado con el UUID de una entidad de otra empresa
// podría leer su historial de firmas (quién aprobó, cuándo, con qué IP).
export class ListSignaturesUseCase {
  constructor(
    private readonly repository: SignatureRepository,
    private readonly fixedDocumentRepository: FixedDocumentRepository,
    private readonly nonConformityRepository: NonConformityRepository,
  ) {}

  async execute(scope: AccessScope, entityType: string, entityId: string): Promise<Signature[]> {
    switch (entityType) {
      case "fixed_document": {
        const document = await this.fixedDocumentRepository.findById(scope.companyId, entityId);
        if (!document) throw new NotFoundError("Documento");
        break;
      }
      case "non_conformity": {
        const nonConformity = await this.nonConformityRepository.findById(scope, entityId);
        if (!nonConformity) throw new NotFoundError("No conformidad");
        break;
      }
      default:
        throw new ValidationError(`Tipo de entidad no soportado: ${entityType}.`);
    }

    return this.repository.findAllByEntity(entityType, entityId);
  }
}
