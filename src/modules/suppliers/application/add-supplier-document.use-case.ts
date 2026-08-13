import { NotFoundError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SupplierRepository } from "../domain/supplier.repository";
import type { SupplierDocument, NewSupplierDocumentInput } from "../domain/supplier.entity";
import { requireSuppliersPlan } from "./require-suppliers-plan";

// Paso 2 del flujo de subida: el front ya pidió una URL prefirmada vía
// POST /attachments/upload-url y subió el archivo directo a S3 (ver
// StoragePort en modules/attachments) — acá solo se registra la
// certificación con el fileKey/fileUrl resultantes, igual que
// AddFixedDocumentVersionUseCase.
export class AddSupplierDocumentUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(companyId: string, supplierId: string, input: NewSupplierDocumentInput): Promise<SupplierDocument> {
    await requireSuppliersPlan(this.companyRepository, companyId);

    // El proveedor debe pertenecer a la empresa del usuario autenticado —
    // si no, se podría colgar un documento de un proveedor ajeno pasando su
    // id a mano (mismo riesgo que sedeId ajeno, ver CreateEmployeeUseCase).
    const supplier = await this.repository.findById(companyId, supplierId);
    if (!supplier) throw new NotFoundError("Proveedor");

    return this.repository.addDocument(supplierId, input);
  }
}
