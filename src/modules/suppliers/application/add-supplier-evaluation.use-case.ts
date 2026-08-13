import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SupplierRepository } from "../domain/supplier.repository";
import type { SupplierEvaluation, NewSupplierEvaluationInput } from "../domain/supplier.entity";
import { requireSuppliersPlan } from "./require-suppliers-plan";

export class AddSupplierEvaluationUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(
    companyId: string,
    supplierId: string,
    evaluatorId: string,
    input: NewSupplierEvaluationInput,
  ): Promise<SupplierEvaluation> {
    await requireSuppliersPlan(this.companyRepository, companyId);

    // El proveedor debe pertenecer a la empresa del usuario autenticado
    // (ver misma validación en AddSupplierDocumentUseCase).
    const supplier = await this.repository.findById(companyId, supplierId);
    if (!supplier) throw new NotFoundError("Proveedor");

    return this.repository.addEvaluation(supplierId, evaluatorId, input);
  }
}
