import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SupplierRepository } from "../domain/supplier.repository";
import type { Supplier } from "../domain/supplier.entity";
import { requireSuppliersPlan } from "./require-suppliers-plan";

export class ListSuppliersUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string): Promise<Supplier[]> {
    await requireSuppliersPlan(this.companyRepository, companyId);
    return this.repository.findAllByCompany(companyId);
  }
}
