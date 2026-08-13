import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { AttachmentRepository } from "../domain/attachment.repository";
import type { Attachment, NewAttachmentInput } from "../domain/attachment.entity";

export class CreateAttachmentUseCase {
  constructor(
    private readonly repository: AttachmentRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(companyId: string, uploadedBy: string, input: NewAttachmentInput): Promise<Attachment> {
    // Si el body trae sedeId, debe seguir perteneciendo a la empresa del
    // usuario (ver misma validación en CreateEmployeeUseCase).
    if (input.sedeId) {
      const sede = await this.sedeRepository.findById(companyId, input.sedeId);
      if (!sede) throw new NotFoundError("Sede", "f");
    }

    return this.repository.create(companyId, uploadedBy, input);
  }
}
