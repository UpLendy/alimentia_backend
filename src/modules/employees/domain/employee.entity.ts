// Entidad de dominio: la forma "de negocio" de un empleado. No importa nada
// de Drizzle ni de Elysia — si mañana cambia el ORM o el framework HTTP,
// este archivo no se toca.

export type MedicalExamStatus = "vigente" | "por_vencer" | "vencido";

export interface Employee {
  id: string;
  companyId: string;
  sedeId: string;
  fullName: string;
  documentId: string;
  position: string;
  hireDate: string;
  medicalExamDate: string | null;
  medicalExamExpiry: string | null;
  hasFoodHandlerCert: boolean;
  trainingHoursCompleted: number;
  trainingHoursRequired: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Lo que devuelve la API: la entidad + el estado calculado (regla de negocio,
// ver application/get-medical-exam-status). El front la consume tal cual.
export interface EmployeeWithStatus extends Employee {
  medicalExamStatus: MedicalExamStatus;
}

export interface NewEmployeeInput {
  sedeId: string;
  fullName: string;
  documentId: string;
  position: string;
  hireDate: string;
  medicalExamDate?: string;
  hasFoodHandlerCert?: boolean;
  trainingHoursCompleted?: number;
  trainingHoursRequired?: number;
}

// `active` no es parte del alta (NewEmployeeInput): solo se puede revertir
// un soft-delete vía PATCH, nunca al crear.
export type UpdateEmployeeInput = Partial<NewEmployeeInput> & { active?: boolean };
