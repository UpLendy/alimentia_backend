import { and, desc, eq } from "drizzle-orm";
import { db as defaultDb } from "../../../db/client";
import type { DbClient } from "../../../db/client";
import { signatures } from "../../../db/schema";
import type { SignatureRepository } from "../domain/signature.repository";
import type { CreateSignatureData, Signature } from "../domain/signature.entity";

export class DrizzleSignatureRepository implements SignatureRepository {
  // Acepta un DbClient distinto del global (un `tx` de db.transaction) para
  // que ApproveFixedDocumentUseCase pueda aprobar el documento y crear la
  // firma en la misma transacción — ver fixed-documents/http/fixed-documents.routes.ts.
  constructor(private readonly conn: DbClient = defaultDb) {}

  async findAllByEntity(entityType: string, entityId: string): Promise<Signature[]> {
    const rows = await this.conn
      .select()
      .from(signatures)
      .where(and(eq(signatures.entityType, entityType), eq(signatures.entityId, entityId)))
      .orderBy(desc(signatures.signedAt));
    return rows as Signature[];
  }

  async create(data: CreateSignatureData): Promise<Signature> {
    const [created] = await this.conn
      .insert(signatures)
      .values({
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        hash: data.hash,
      })
      .returning();
    return created! as Signature;
  }
}
