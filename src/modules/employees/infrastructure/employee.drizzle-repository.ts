import { and, eq, sql } from "drizzle-orm";
import { db as defaultDb } from "../../../db/client";
import type { DbClient } from "../../../db/client";
import { employees } from "../../../db/schema";
import type { AccessScope } from "../../../shared/domain/access-scope";
import type { EmployeeRepository } from "../domain/employee.repository";
import type { Employee, NewEmployeeInput, UpdateEmployeeInput } from "../domain/employee.entity";

// Traduce el AccessScope de dominio a un WHERE de Drizzle. Este es el único
// archivo del módulo que sabe que existe Postgres/Drizzle.
function scopeCondition(scope: AccessScope) {
  return scope.sedeId
    ? and(eq(employees.companyId, scope.companyId), eq(employees.sedeId, scope.sedeId))!
    : eq(employees.companyId, scope.companyId);
}

export class DrizzleEmployeeRepository implements EmployeeRepository {
  // Acepta un DbClient distinto del global (un `tx` de db.transaction) para
  // que CreateTrainingUseCase pueda sumar las horas junto con el insert de
  // la capacitación en la misma transacción — ver
  // trainings/http/trainings.routes.ts.
  constructor(private readonly conn: DbClient = defaultDb) {}

  async findAll(scope: AccessScope, options?: { includeInactive?: boolean }): Promise<Employee[]> {
    const condition = options?.includeInactive
      ? scopeCondition(scope)
      : and(scopeCondition(scope), eq(employees.active, true))!;
    return this.conn.select().from(employees).where(condition);
  }

  async findById(scope: AccessScope, id: string): Promise<Employee | null> {
    const [row] = await this.conn
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), scopeCondition(scope)))
      .limit(1);
    return row ?? null;
  }

  async create(
    companyId: string,
    input: NewEmployeeInput & { medicalExamExpiry: string | null },
  ): Promise<Employee> {
    const [created] = await this.conn
      .insert(employees)
      .values({ companyId, ...input })
      .returning();
    return created!;
  }

  async update(
    scope: AccessScope,
    id: string,
    input: UpdateEmployeeInput & { medicalExamExpiry?: string | null },
  ): Promise<Employee | null> {
    const [updated] = await this.conn
      .update(employees)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(employees.id, id), scopeCondition(scope)))
      .returning();
    return updated ?? null;
  }

  async deactivate(scope: AccessScope, id: string): Promise<Employee | null> {
    const [updated] = await this.conn
      .update(employees)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(employees.id, id), scopeCondition(scope)))
      .returning();
    return updated ?? null;
  }

  async incrementTrainingHours(scope: AccessScope, id: string, hours: number): Promise<Employee | null> {
    const [updated] = await this.conn
      .update(employees)
      .set({
        trainingHoursCompleted: sql`${employees.trainingHoursCompleted} + ${hours}`,
        updatedAt: new Date(),
      })
      .where(and(eq(employees.id, id), scopeCondition(scope)))
      .returning();
    return updated ?? null;
  }
}
