import type { Attachment, NewAttachmentInput } from "./attachment.entity";

export interface AttachmentRepository {
  findAllByCompany(companyId: string): Promise<Attachment[]>;
  create(companyId: string, uploadedBy: string, input: NewAttachmentInput): Promise<Attachment>;
}
