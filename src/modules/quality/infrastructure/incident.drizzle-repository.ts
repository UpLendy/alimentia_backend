import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { incidents } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { IncidentRepository } from "../domain/incident.repository";
import type { Incident, NewIncidentInput } from "../domain/incident.entity";

function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(incidents.companyId, scope.companyId), eq(incidents.sedeId, scope.sedeId))!
    : eq(incidents.companyId, scope.companyId);
}

export class DrizzleIncidentRepository implements IncidentRepository {
  async findAll(scope: AccessScope): Promise<Incident[]> {
    return db.select().from(incidents).where(scopeCondition(scope));
  }

  async findById(scope: AccessScope, id: string): Promise<Incident | null> {
    const [row] = await db
      .select()
      .from(incidents)
      .where(and(eq(incidents.id, id), scopeCondition(scope)))
      .limit(1);
    return row ?? null;
  }

  async create(companyId: string, input: NewIncidentInput & { reportedBy: string | null }): Promise<Incident> {
    const [created] = await db
      .insert(incidents)
      .values({ companyId, ...input, occurredAt: new Date(input.occurredAt) })
      .returning();
    return created!;
  }
}
