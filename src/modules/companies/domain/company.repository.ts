import type { Company, UpdateCompanyInput } from "./company.entity";

// Puerto: QUÉ se puede hacer con la empresa, no CÓMO (ver
// infrastructure/company.drizzle-repository.ts).
export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  update(id: string, input: UpdateCompanyInput): Promise<Company | null>;
  // Enumera los tenants activos (excluye status="suspendido"). Lo usa
  // CheckAlertsUseCase, el único caso de uso que corre fuera del scope de
  // una sola empresa (es un job, no un request HTTP).
  findAllActive(): Promise<Company[]>;
}
