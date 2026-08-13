import type { SedeRepository } from "../domain/sede.repository";
import type { Sede } from "../domain/sede.entity";

export class ListSedesUseCase {
  constructor(private readonly repository: SedeRepository) {}

  async execute(companyId: string): Promise<Sede[]> {
    return this.repository.findAllByCompany(companyId);
  }
}
