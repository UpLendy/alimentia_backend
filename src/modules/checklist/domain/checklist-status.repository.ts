import type { ChecklistItemStatus, UpdateChecklistStatusInput } from "./checklist.entity";

// Puerto: avance por empresa. No recibe AccessScope porque quien llama
// (bpm_admin) no está limitado a una sola empresa — el companyId viene
// directo de la URL y lo valida el caso de uso contra CompanyRepository.
export interface ChecklistStatusRepository {
  findAllByCompany(companyId: string): Promise<ChecklistItemStatus[]>;
  upsert(
    companyId: string,
    checklistItemId: string,
    input: UpdateChecklistStatusInput,
    updatedBy: string | null,
  ): Promise<ChecklistItemStatus>;
}
