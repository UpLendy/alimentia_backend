import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { FixedDocumentRepository } from "../domain/fixed-document.repository";
import type { FixedDocument, NewFixedDocumentInput } from "../domain/fixed-document.entity";

export class CreateFixedDocumentUseCase {
  constructor(
    private readonly repository: FixedDocumentRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(companyId: string, input: NewFixedDocumentInput): Promise<FixedDocument> {
    // Si el body trae sedeId, debe seguir perteneciendo a la empresa del
    // usuario (ver misma validación en CreateEmployeeUseCase).
    if (input.sedeId) {
      const sede = await this.sedeRepository.findById(companyId, input.sedeId);
      if (!sede) throw new NotFoundError("Sede", "f");
    }

    return this.repository.create(companyId, input);
  }
}
