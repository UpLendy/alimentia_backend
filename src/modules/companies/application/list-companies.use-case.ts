import type { CompanyRepository } from "../domain/company.repository";
import type { Company } from "../domain/company.entity";

// Solo lo usa el panel interno de BPM Consulting (selector de empresa
// cliente en /admin/checklist) — por eso reusa findAllActive() en vez de
// listar también las suspendidas.
export class ListCompaniesUseCase {
  constructor(private readonly repository: CompanyRepository) {}

  async execute(): Promise<Company[]> {
    return this.repository.findAllActive();
  }
}
