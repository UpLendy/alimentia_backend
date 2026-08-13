import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../domain/company.repository";
import type { Company, UpdateCompanyInput } from "../domain/company.entity";

export class UpdateCompanyUseCase {
  constructor(private readonly repository: CompanyRepository) {}

  async execute(companyId: string, input: UpdateCompanyInput): Promise<Company> {
    const updated = await this.repository.update(companyId, input);
    if (!updated) throw new NotFoundError("Empresa", "f");
    return updated;
  }
}
