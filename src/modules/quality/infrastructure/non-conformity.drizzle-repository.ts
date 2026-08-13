import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { nonConformities } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { NonConformityRepository } from "../domain/non-conformity.repository";
import type { NonConformity, NonConformityStatus, NewNonConformityInput } from "../domain/non-conformity.entity";

// Traduce el AccessScope de dominio a un WHERE de Drizzle. Este es el único
// archivo del módulo que sabe que existe Postgres/Drizzle.
function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(nonConformities.companyId, scope.companyId), eq(nonConformities.sedeId, scope.sedeId))!
    : eq(nonConformities.companyId, scope.companyId);
}

export class DrizzleNonConformityRepository implements NonConformityRepository {
  async findAll(scope: AccessScope): Promise<NonConformity[]> {
    const rows = await db.select().from(nonConformities).where(scopeCondition(scope));
    // sourceType es `text` en la tabla (no un pgEnum de Postgres), así que
    // Drizzle lo infiere como string; el valor solo se escribe vía
    // create()/schema TypeBox, que lo restringen a NonConformitySourceType.
    return rows as NonConformity[];
  }

  async findById(scope: AccessScope, id: string): Promise<NonConformity | null> {
    const [row] = await db
      .select()
      .from(nonConformities)
      .where(and(eq(nonConformities.id, id), scopeCondition(scope)))
      .limit(1);
    return (row as NonConformity) ?? null;
  }

  async create(companyId: string, input: NewNonConformityInput): Promise<NonConformity> {
    const [created] = await db
      .insert(nonConformities)
      .values({ companyId, ...input })
      .returning();
    return created! as NonConformity;
  }

  async update(
    scope: AccessScope,
    id: string,
    input: Partial<NewNonConformityInput> & { status?: NonConformityStatus; closedAt?: Date | null },
  ): Promise<NonConformity | null> {
    const [updated] = await db
      .update(nonConformities)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(nonConformities.id, id), scopeCondition(scope)))
      .returning();
    return (updated as NonConformity) ?? null;
  }
}
