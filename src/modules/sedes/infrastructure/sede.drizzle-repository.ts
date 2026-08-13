import { and, count, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { sedes } from "../../../db/schema";
import type { SedeRepository } from "../domain/sede.repository";
import type { NewSedeInput, Sede, UpdateSedeInput } from "../domain/sede.entity";

export class DrizzleSedeRepository implements SedeRepository {
  async findAllByCompany(companyId: string): Promise<Sede[]> {
    return db.select().from(sedes).where(eq(sedes.companyId, companyId));
  }

  async findById(companyId: string, id: string): Promise<Sede | null> {
    const [row] = await db
      .select()
      .from(sedes)
      .where(and(eq(sedes.id, id), eq(sedes.companyId, companyId)))
      .limit(1);
    return row ?? null;
  }

  async countByCompany(companyId: string): Promise<number> {
    const [row] = await db.select({ value: count() }).from(sedes).where(eq(sedes.companyId, companyId));
    return row!.value;
  }

  async create(companyId: string, input: NewSedeInput): Promise<Sede> {
    const [created] = await db
      .insert(sedes)
      .values({ companyId, ...input })
      .returning();
    return created!;
  }

  async update(companyId: string, id: string, input: UpdateSedeInput): Promise<Sede | null> {
    const [updated] = await db
      .update(sedes)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(sedes.id, id), eq(sedes.companyId, companyId)))
      .returning();
    return updated ?? null;
  }
}
