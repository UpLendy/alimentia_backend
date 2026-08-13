import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError, ValidationError } from "../../../shared/errors";
import type { FixedDocumentRepository } from "../../fixed-documents/domain/fixed-document.repository";
import type { NonConformityRepository } from "../../quality/domain/non-conformity.repository";
import type { SignatureRepository } from "../domain/signature.repository";
import type { NewSignatureInput, Signature } from "../domain/signature.entity";
import { computeSignatureHash } from "../domain/signature.entity";

// `signatures` es genérica (cualquier entityType), pero antes de firmar hay
// que confirmar que la entidad pertenece a la empresa de quien firma — si
// no, cualquiera con el UUID de otra empresa podría forjar una firma sobre
// datos ajenos. Cada entityType soportado necesita su propio repositorio
// "dueño" inyectado aquí; agregar uno nuevo es agregar un constructor param
// y un case, no reescribir esta clase.
export class CreateSignatureUseCase {
  constructor(
    private readonly repository: SignatureRepository,
    private readonly fixedDocumentRepository: FixedDocumentRepository,
    private readonly nonConformityRepository: NonConformityRepository,
  ) {}

  async execute(
    scope: AccessScope,
    input: NewSignatureInput,
    userId: string,
    ipAddress: string | null,
  ): Promise<Signature> {
    switch (input.entityType) {
      case "fixed_document": {
        const document = await this.fixedDocumentRepository.findById(scope.companyId, input.entityId);
        if (!document) throw new NotFoundError("Documento");
        break;
      }
      case "non_conformity": {
        const nonConformity = await this.nonConformityRepository.findById(scope, input.entityId);
        if (!nonConformity) throw new NotFoundError("No conformidad");
        break;
      }
      default:
        throw new ValidationError(`Tipo de entidad no soportado: ${input.entityType}.`);
    }

    const timestamp = new Date().toISOString();
    const hash = computeSignatureHash(input.entityType, input.entityId, userId, timestamp);
    return this.repository.create({
      entityType: input.entityType,
      entityId: input.entityId,
      userId,
      ipAddress,
      hash,
    });
  }
}
