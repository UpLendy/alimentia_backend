import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { lots } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { LotRepository } from "../domain/lot.repository";
import type { Lot, LotStatus, NewLotInput } from "../domain/lot.entity";

// Traduce el AccessScope de dominio a un WHERE de Drizzle. Este es el único
// archivo del módulo que sabe que existe Postgres/Drizzle.
function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(lots.companyId, scope.companyId), eq(lots.sedeId, scope.sedeId))!
    : eq(lots.companyId, scope.companyId);
}

export class DrizzleLotRepository implements LotRepository {
  async findAll(scope: AccessScope): Promise<Lot[]> {
    return db.select().from(lots).where(scopeCondition(scope));
  }

  async findById(scope: AccessScope, id: string): Promise<Lot | null> {
    const [row] = await db
      .select()
      .from(lots)
      .where(and(eq(lots.id, id), scopeCondition(scope)))
      .limit(1);
    return row ?? null;
  }

  async create(companyId: string, input: NewLotInput): Promise<Lot> {
    const [created] = await db
      .insert(lots)
      .values({ companyId, ...input })
      .returning();
    return created!;
  }

  // Sin scope: quien llama (CreateRecallUseCase) ya validó la pertenencia
  // del lote vía findById antes de invocar esto, igual que
  // AddSupplierDocumentUseCase con addDocument.
  async updateStatus(id: string, status: LotStatus): Promise<Lot | null> {
    const [updated] = await db.update(lots).set({ status }).where(eq(lots.id, id)).returning();
    return updated ?? null;
  }
}
