export type ChecklistPriority = "baja" | "media" | "alta";
export type ChecklistItemStatusValue = "pendiente" | "en_desarrollo" | "completo";

// Catálogo maestro (src/db/seed-data/checklist-maestro.ts): igual para
// todos los clientes, no cambia por empresa.
export interface ChecklistCatalogItem {
  id: string;
  category: string;
  item: string;
  appliesTo: string | null;
  normReference: string | null;
  priority: ChecklistPriority;
  sortOrder: number;
}

// Fila de company_checklist_status tal cual vive en BD, antes de unirla con
// el catálogo.
export interface ChecklistItemStatus {
  checklistItemId: string;
  status: ChecklistItemStatusValue;
  notes: string | null;
  updatedBy: string | null;
  updatedAt: Date;
}

// Forma que consume el front: cada ítem del catálogo con el avance de una
// empresa cliente puntual superpuesto (status/notes "pendiente"/null cuando
// la empresa todavía no tiene fila propia en company_checklist_status).
export interface CompanyChecklistItem extends ChecklistCatalogItem {
  status: ChecklistItemStatusValue;
  notes: string | null;
  updatedAt: Date | null;
}

export type UpdateChecklistStatusInput = Partial<{
  status: ChecklistItemStatusValue;
  notes: string;
}>;
