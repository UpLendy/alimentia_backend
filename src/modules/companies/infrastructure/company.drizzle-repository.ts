import { eq, ne } from "drizzle-orm";
import { db } from "../../../db/client";
import { companies } from "../../../db/schema";
import type { CompanyRepository } from "../domain/company.repository";
import type { Company, UpdateCompanyInput } from "../domain/company.entity";

export class DrizzleCompanyRepository implements CompanyRepository {
  async findById(id: string): Promise<Company | null> {
    const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return row ?? null;
  }

  async findAllActive(): Promise<Company[]> {
    return db.select().from(companies).where(ne(companies.status, "suspendido"));
  }

  async update(id: string, input: UpdateCompanyInput): Promise<Company | null> {
    const [updated] = await db
      .update(companies)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated ?? null;
  }
}
