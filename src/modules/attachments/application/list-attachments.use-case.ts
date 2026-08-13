import type { AttachmentRepository } from "../domain/attachment.repository";
import type { Attachment } from "../domain/attachment.entity";

export class ListAttachmentsUseCase {
  constructor(private readonly repository: AttachmentRepository) {}

  async execute(companyId: string): Promise<Attachment[]> {
    return this.repository.findAllByCompany(companyId);
  }
}
