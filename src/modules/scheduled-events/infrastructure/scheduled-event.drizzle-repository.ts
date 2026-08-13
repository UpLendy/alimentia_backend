import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { scheduledEvents } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { ScheduledEventRepository } from "../domain/scheduled-event.repository";
import type { NewScheduledEventInput, ScheduledEvent, UpdateScheduledEventInput } from "../domain/scheduled-event.entity";

function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(scheduledEvents.companyId, scope.companyId), eq(scheduledEvents.sedeId, scope.sedeId))!
    : eq(scheduledEvents.companyId, scope.companyId);
}

export class DrizzleScheduledEventRepository implements ScheduledEventRepository {
  async findAll(scope: AccessScope): Promise<ScheduledEvent[]> {
    return db.select().from(scheduledEvents).where(scopeCondition(scope));
  }

  async create(companyId: string, createdBy: string, input: NewScheduledEventInput): Promise<ScheduledEvent> {
    const [created] = await db
      .insert(scheduledEvents)
      .values({ companyId, createdBy, ...input })
      .returning();
    return created!;
  }

  async update(scope: AccessScope, id: string, input: UpdateScheduledEventInput): Promise<ScheduledEvent | null> {
    const [updated] = await db
      .update(scheduledEvents)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(scheduledEvents.id, id), scopeCondition(scope)))
      .returning();
    return updated ?? null;
  }
}
