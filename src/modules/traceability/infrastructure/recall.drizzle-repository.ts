import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { lots, recalls } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { RecallRepository } from "../domain/recall.repository";
import type { NewRecallInput, Recall } from "../domain/recall.entity";

function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(lots.companyId, scope.companyId), eq(lots.sedeId, scope.sedeId))!
    : eq(lots.companyId, scope.companyId);
}

export class DrizzleRecallRepository implements RecallRepository {
  // Los recalls no tienen companyId/sedeId propios (ver domain/recall.repository.ts):
  // se filtran vía JOIN contra el lote que los originó.
  async findAllByCompany(scope: AccessScope): Promise<Recall[]> {
    const rows = await db
      .select({ recall: recalls })
      .from(recalls)
      .innerJoin(lots, eq(recalls.lotId, lots.id))
      .where(scopeCondition(scope));
    return rows.map((row) => row.recall);
  }

  async create(lotId: string, input: NewRecallInput): Promise<Recall> {
    const [created] = await db
      .insert(recalls)
      .values({ lotId, ...input })
      .returning();
    return created!;
  }
}
