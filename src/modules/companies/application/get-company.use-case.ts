import { NotFoundError } from "../../../shared/errors";
import { PLAN_FEATURES, type FeatureKey } from "../../../config/plans";
import type { CompanyRepository } from "../domain/company.repository";
import type { Company } from "../domain/company.entity";

export class GetCompanyUseCase {
  constructor(private readonly repository: CompanyRepository) {}

  async execute(companyId: string): Promise<{ company: Company; features: FeatureKey[] }> {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundError("Empresa", "f");
    return { company, features: PLAN_FEATURES[company.plan] };
  }
}
