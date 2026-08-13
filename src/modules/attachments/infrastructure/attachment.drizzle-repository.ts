import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { attachments } from "../../../db/schema";
import type { AttachmentRepository } from "../domain/attachment.repository";
import type { Attachment, NewAttachmentInput } from "../domain/attachment.entity";

export class DrizzleAttachmentRepository implements AttachmentRepository {
  async findAllByCompany(companyId: string): Promise<Attachment[]> {
    return db.select().from(attachments).where(eq(attachments.companyId, companyId));
  }

  async create(companyId: string, uploadedBy: string, input: NewAttachmentInput): Promise<Attachment> {
    const [created] = await db
      .insert(attachments)
      .values({ companyId, uploadedBy, ...input })
      .returning();
    return created!;
  }
}
