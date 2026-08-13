import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db/client";
import { dailyForms } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { DailyFormRepository } from "../domain/daily-form.repository";
import type { DailyForm, DailyFormFilters, NewDailyFormInput } from "../domain/daily-form.entity";

function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(dailyForms.companyId, scope.companyId), eq(dailyForms.sedeId, scope.sedeId))!
    : eq(dailyForms.companyId, scope.companyId);
}

export class DrizzleDailyFormRepository implements DailyFormRepository {
  async findAll(scope: AccessScope, filters: DailyFormFilters): Promise<DailyForm[]> {
    const conditions = [scopeCondition(scope)];
    if (filters.formType) conditions.push(eq(dailyForms.formType, filters.formType as DailyForm["formType"]));
    if (filters.from) conditions.push(gte(dailyForms.formDate, filters.from));
    if (filters.to) conditions.push(lte(dailyForms.formDate, filters.to));

    return db
      .select()
      .from(dailyForms)
      .where(and(...conditions))
      .orderBy(dailyForms.formDate);
  }

  async findById(scope: AccessScope, id: string): Promise<DailyForm | null> {
    const [row] = await db
      .select()
      .from(dailyForms)
      .where(and(eq(dailyForms.id, id), scopeCondition(scope)))
      .limit(1);
    return row ?? null;
  }

  async create(companyId: string, input: NewDailyFormInput): Promise<DailyForm> {
    const [created] = await db
      .insert(dailyForms)
      .values({ companyId, ...input })
      .returning();
    return created!;
  }

  async findFormTypesOnDate(scope: AccessScope, date: string): Promise<string[]> {
    const rows = await db
      .select({ formType: dailyForms.formType })
      .from(dailyForms)
      .where(and(scopeCondition(scope), eq(dailyForms.formDate, date)));
    return rows.map((r) => r.formType);
  }

  async countInRange(scope: AccessScope, from: string, to: string): Promise<number> {
    const [row] = await db
      .select({ value: sql<number>`count(*)` })
      .from(dailyForms)
      .where(and(scopeCondition(scope), gte(dailyForms.formDate, from), lte(dailyForms.formDate, to)));
    return Number(row!.value);
  }
}
