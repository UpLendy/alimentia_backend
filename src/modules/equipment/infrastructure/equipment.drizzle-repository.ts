import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { equipment } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { EquipmentRepository } from "../domain/equipment.repository";
import type { Equipment, NewEquipmentInput, UpdateEquipmentInput } from "../domain/equipment.entity";

function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(equipment.companyId, scope.companyId), eq(equipment.sedeId, scope.sedeId))!
    : eq(equipment.companyId, scope.companyId);
}

export class DrizzleEquipmentRepository implements EquipmentRepository {
  async findAll(scope: AccessScope, options?: { includeInactive?: boolean }): Promise<Equipment[]> {
    const condition = options?.includeInactive
      ? scopeCondition(scope)
      : and(scopeCondition(scope), eq(equipment.active, true))!;
    return db.select().from(equipment).where(condition);
  }

  async create(companyId: string, input: NewEquipmentInput & { nextCalibrationDate: string }): Promise<Equipment> {
    const [created] = await db
      .insert(equipment)
      .values({ companyId, ...input })
      .returning();
    return created!;
  }

  async update(
    scope: AccessScope,
    id: string,
    input: UpdateEquipmentInput & { nextCalibrationDate?: string },
  ): Promise<Equipment | null> {
    const [updated] = await db
      .update(equipment)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(equipment.id, id), scopeCondition(scope)))
      .returning();
    return updated ?? null;
  }

  async deactivate(scope: AccessScope, id: string): Promise<Equipment | null> {
    const [updated] = await db
      .update(equipment)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(equipment.id, id), scopeCondition(scope)))
      .returning();
    return updated ?? null;
  }
}
