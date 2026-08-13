// Entidad de dominio: la forma "de negocio" de una no conformidad / CAPA. No
// importa nada de Drizzle ni de Elysia — si mañana cambia el ORM o el
// framework HTTP, este archivo no se toca.

export type NonConformitySeverity = "baja" | "media" | "alta";
export type NonConformityStatus = "abierta" | "en_proceso" | "cerrada";
export type NonConformitySourceType = "manual" | "formato" | "auditoria";

export interface NonConformity {
  id: string;
  companyId: string;
  sedeId: string;
  sourceType: NonConformitySourceType;
  sourceReferenceId: string | null;
  description: string;
  severity: NonConformitySeverity;
  correctiveAction: string | null;
  responsibleUserId: string | null;
  dueDate: string | null;
  status: NonConformityStatus;
  evidenceFileUrl: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewNonConformityInput {
  sedeId: string;
  // "formato" = generada desde un hallazgo negativo de un formato diario;
  // "auditoria" = auditoría externa. Ambas guardan el origen en
  // sourceReferenceId. Ver PROMPTS.md / checklist "No conformidades".
  sourceType?: NonConformitySourceType;
  sourceReferenceId?: string;
  description: string;
  severity?: NonConformitySeverity;
  correctiveAction?: string;
  responsibleUserId?: string;
  dueDate?: string;
  evidenceFileUrl?: string;
}

// `status` acá solo cubre abierta/en_proceso: pasar a "cerrada" exige la
// acción correctiva registrada (ver CloseNonConformityUseCase) y no se
// permite por esta vía genérica.
export type UpdateNonConformityInput = Partial<NewNonConformityInput> & {
  status?: "abierta" | "en_proceso";
};
