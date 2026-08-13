// Entidad de dominio: la forma "de negocio" de un proveedor. No importa nada
// de Drizzle ni de Elysia — si mañana cambia el ORM o el framework HTTP,
// este archivo no se toca.

export type SupplierStatus = "activo" | "inactivo";

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  nit: string | null;
  category: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: SupplierStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSupplierInput {
  name: string;
  nit?: string;
  category?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export type UpdateSupplierInput = Partial<NewSupplierInput> & { status?: SupplierStatus };

// Certificación / documento del proveedor (INVIMA, ficha técnica, etc.). El
// fileKey/fileUrl llegan ya subidos a S3 — ver AddSupplierDocumentUseCase.
export interface SupplierDocument {
  id: string;
  supplierId: string;
  label: string;
  fileKey: string;
  fileUrl: string;
  expiryDate: string | null;
  uploadedAt: Date;
}

export interface NewSupplierDocumentInput {
  label: string;
  fileKey: string;
  fileUrl: string;
  expiryDate?: string;
}

// Evaluación / scorecard periódico del proveedor.
export interface SupplierEvaluation {
  id: string;
  supplierId: string;
  evaluatedAt: string;
  score: number;
  evaluatorId: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface NewSupplierEvaluationInput {
  evaluatedAt: string;
  score: number;
  notes?: string;
}
