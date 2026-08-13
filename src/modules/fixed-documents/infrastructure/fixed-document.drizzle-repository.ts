import { and, eq } from "drizzle-orm";
import { db as defaultDb } from "../../../db/client";
import type { DbClient } from "../../../db/client";
import { fixedDocuments, fixedDocumentVersions } from "../../../db/schema";
import type { FixedDocumentRepository } from "../domain/fixed-document.repository";
import type {
  FixedDocument,
  FixedDocumentVersion,
  NewFixedDocumentInput,
  NewVersionInput,
} from "../domain/fixed-document.entity";

export class DrizzleFixedDocumentRepository implements FixedDocumentRepository {
  // Acepta un DbClient distinto del global (un `tx` de db.transaction) para
  // que aprobar el documento y crear la firma corran atómicamente — ver
  // fixed-documents/http/fixed-documents.routes.ts.
  constructor(private readonly conn: DbClient = defaultDb) {}

  async findAllByCompany(companyId: string): Promise<FixedDocument[]> {
    return this.conn.select().from(fixedDocuments).where(eq(fixedDocuments.companyId, companyId));
  }

  async findById(companyId: string, id: string): Promise<FixedDocument | null> {
    const [doc] = await this.conn
      .select()
      .from(fixedDocuments)
      .where(and(eq(fixedDocuments.id, id), eq(fixedDocuments.companyId, companyId)))
      .limit(1);
    return doc ?? null;
  }

  async listVersions(documentId: string): Promise<FixedDocumentVersion[]> {
    return this.conn.select().from(fixedDocumentVersions).where(eq(fixedDocumentVersions.documentId, documentId));
  }

  async create(companyId: string, input: NewFixedDocumentInput): Promise<FixedDocument> {
    const [created] = await this.conn
      .insert(fixedDocuments)
      .values({ companyId, ...input })
      .returning();
    return created!;
  }

  async insertVersion(
    documentId: string,
    version: number,
    input: NewVersionInput,
    uploadedBy: string,
  ): Promise<void> {
    await this.conn.insert(fixedDocumentVersions).values({
      documentId,
      version,
      fileKey: input.fileKey,
      fileUrl: input.fileUrl,
      uploadedBy,
    });
  }

  async updateCurrentFile(id: string, version: number, input: NewVersionInput): Promise<FixedDocument | null> {
    const [updated] = await this.conn
      .update(fixedDocuments)
      .set({ currentVersion: version, fileKey: input.fileKey, fileUrl: input.fileUrl, updatedAt: new Date() })
      .where(eq(fixedDocuments.id, id))
      .returning();
    return updated ?? null;
  }

  async approve(companyId: string, id: string, approvedBy: string): Promise<FixedDocument | null> {
    const [updated] = await this.conn
      .update(fixedDocuments)
      .set({ status: "vigente", approvedBy, approvedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(fixedDocuments.id, id), eq(fixedDocuments.companyId, companyId)))
      .returning();
    return updated ?? null;
  }
}
