import type {
  Supplier,
  NewSupplierInput,
  UpdateSupplierInput,
  SupplierDocument,
  NewSupplierDocumentInput,
  SupplierEvaluation,
  NewSupplierEvaluationInput,
} from "./supplier.entity";

// Puerto (interfaz) que define QUÉ se puede hacer con proveedores, sin decir
// CÓMO (eso lo implementa infrastructure/supplier.drizzle-repository.ts).
// Los proveedores no tienen sedeId (son a nivel de empresa, ver
// db/schema/suppliers.ts) — por eso se scopean por companyId directo, igual
// que fixed-documents, y no por AccessScope.
export interface SupplierRepository {
  findAllByCompany(companyId: string): Promise<Supplier[]>;
  findById(companyId: string, id: string): Promise<Supplier | null>;
  create(companyId: string, input: NewSupplierInput): Promise<Supplier>;
  update(companyId: string, id: string, input: UpdateSupplierInput): Promise<Supplier | null>;
  addDocument(supplierId: string, input: NewSupplierDocumentInput): Promise<SupplierDocument>;
  addEvaluation(
    supplierId: string,
    evaluatorId: string | null,
    input: NewSupplierEvaluationInput,
  ): Promise<SupplierEvaluation>;
  listEvaluations(supplierId: string): Promise<SupplierEvaluation[]>;
}
