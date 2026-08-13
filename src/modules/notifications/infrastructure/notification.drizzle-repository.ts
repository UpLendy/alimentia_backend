import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { notifications } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { NotificationRepository } from "../domain/notification.repository";
import type { Notification, NewNotificationInput } from "../domain/notification.entity";

// Traduce el AccessScope de dominio a un WHERE de Drizzle. Este es el único
// archivo del módulo que sabe que existe Postgres/Drizzle.
function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(notifications.companyId, scope.companyId), eq(notifications.sedeId, scope.sedeId))!
    : eq(notifications.companyId, scope.companyId);
}

export class DrizzleNotificationRepository implements NotificationRepository {
  async findAll(scope: AccessScope): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notifications)
      .where(scopeCondition(scope))
      .orderBy(desc(notifications.createdAt));
    return rows as Notification[];
  }

  async markAsRead(scope: AccessScope, id: string): Promise<Notification | null> {
    const [updated] = await db
      .update(notifications)
      .set({ status: "leida" })
      .where(and(eq(notifications.id, id), scopeCondition(scope)))
      .returning();
    return (updated as Notification) ?? null;
  }

  async create(companyId: string, input: NewNotificationInput): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values({ companyId, ...input })
      .returning();
    return created! as Notification;
  }

  async findPendingByReference(
    companyId: string,
    referenceTable: string,
    referenceId: string,
  ): Promise<Notification | null> {
    const [row] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.companyId, companyId),
          eq(notifications.referenceTable, referenceTable),
          eq(notifications.referenceId, referenceId),
          eq(notifications.status, "pendiente"),
        ),
      )
      .limit(1);
    return (row as Notification) ?? null;
  }
}
