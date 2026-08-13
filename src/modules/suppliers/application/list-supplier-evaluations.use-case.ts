import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SupplierRepository } from "../domain/supplier.repository";
import type { SupplierEvaluation } from "../domain/supplier.entity";
import { requireSuppliersPlan } from "./require-suppliers-plan";

export class ListSupplierEvaluationsUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, supplierId: string): Promise<SupplierEvaluation[]> {
    await requireSuppliersPlan(this.companyRepository, companyId);

    const supplier = await this.repository.findById(companyId, supplierId);
    if (!supplier) throw new NotFoundError("Proveedor");

    return this.repository.listEvaluations(supplierId);
  }
}
