import type { ChecklistCatalogItem } from "./checklist.entity";

// Puerto: el catálogo maestro es de solo lectura desde la aplicación (se
// siembra una sola vez, ver src/db/seed.ts).
export interface ChecklistCatalogRepository {
  findAll(): Promise<ChecklistCatalogItem[]>;
  findById(id: string): Promise<ChecklistCatalogItem | null>;
}
