import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SupplierRepository } from "../domain/supplier.repository";
import type { Supplier, NewSupplierInput } from "../domain/supplier.entity";
import { requireSuppliersPlan } from "./require-suppliers-plan";

export class CreateSupplierUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, input: NewSupplierInput): Promise<Supplier> {
    await requireSuppliersPlan(this.companyRepository, companyId);
    return this.repository.create(companyId, input);
  }
}
