import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SupplierRepository } from "../domain/supplier.repository";
import type { Supplier } from "../domain/supplier.entity";
import { requireSuppliersPlan } from "./require-suppliers-plan";

export class GetSupplierUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, id: string): Promise<Supplier> {
    await requireSuppliersPlan(this.companyRepository, companyId);
    const supplier = await this.repository.findById(companyId, id);
    if (!supplier) throw new NotFoundError("Proveedor");
    return supplier;
  }
}
