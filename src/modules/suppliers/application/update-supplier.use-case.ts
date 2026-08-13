import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SupplierRepository } from "../domain/supplier.repository";
import type { Supplier, UpdateSupplierInput } from "../domain/supplier.entity";
import { requireSuppliersPlan } from "./require-suppliers-plan";

export class UpdateSupplierUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, id: string, input: UpdateSupplierInput): Promise<Supplier> {
    await requireSuppliersPlan(this.companyRepository, companyId);
    const updated = await this.repository.update(companyId, id, input);
    if (!updated) throw new NotFoundError("Proveedor");
    return updated;
  }
}
