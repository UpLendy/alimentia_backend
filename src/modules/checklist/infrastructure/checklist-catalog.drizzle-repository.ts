import { asc, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { checklistCatalog } from "../../../db/schema";
import type { ChecklistCatalogRepository } from "../domain/checklist-catalog.repository";
import type { ChecklistCatalogItem } from "../domain/checklist.entity";

export class DrizzleChecklistCatalogRepository implements ChecklistCatalogRepository {
  async findAll(): Promise<ChecklistCatalogItem[]> {
    return db.select().from(checklistCatalog).orderBy(asc(checklistCatalog.sortOrder));
  }

  async findById(id: string): Promise<ChecklistCatalogItem | null> {
    const [row] = await db.select().from(checklistCatalog).where(eq(checklistCatalog.id, id)).limit(1);
    return row ?? null;
  }
}
