import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { companyChecklistStatus } from "../../../db/schema";
import type { ChecklistStatusRepository } from "../domain/checklist-status.repository";
import type { ChecklistItemStatus, UpdateChecklistStatusInput } from "../domain/checklist.entity";

export class DrizzleChecklistStatusRepository implements ChecklistStatusRepository {
  async findAllByCompany(companyId: string): Promise<ChecklistItemStatus[]> {
    return db.select().from(companyChecklistStatus).where(eq(companyChecklistStatus.companyId, companyId));
  }

  // Upsert: la mayoría de ítems no tienen fila propia todavía (solo se crea
  // al primer cambio de estado), así que el primer PATCH de un ítem es un
  // insert y los siguientes son update — mismo endpoint para ambos casos.
  // onConflictDoUpdate se apoya en el unique index (company_id, checklist_item_id).
  async upsert(
    companyId: string,
    checklistItemId: string,
    input: UpdateChecklistStatusInput,
    updatedBy: string | null,
  ): Promise<ChecklistItemStatus> {
    const patch: Partial<typeof companyChecklistStatus.$inferInsert> = {
      updatedBy,
      updatedAt: new Date(),
    };
    if (input.status !== undefined) patch.status = input.status;
    if (input.notes !== undefined) patch.notes = input.notes;

    const [row] = await db
      .insert(companyChecklistStatus)
      .values({ companyId, checklistItemId, ...patch })
      .onConflictDoUpdate({
        target: [companyChecklistStatus.companyId, companyChecklistStatus.checklistItemId],
        set: patch,
      })
      .returning();
    return row!;
  }
}
