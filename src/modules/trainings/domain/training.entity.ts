// Entidad de dominio: el detalle de una capacitación de un empleado. No
// importa nada de Drizzle ni de Elysia. El resumen (horas acumuladas) vive en
// employees.trainingHoursCompleted — ver CreateTrainingUseCase.
export interface Training {
  id: string;
  employeeId: string;
  topic: string;
  trainingDate: string;
  hours: number;
  evaluationScore: number | null;
  certificateFileUrl: string | null;
  expiresAt: string | null;
  createdAt: Date;
}

export interface NewTrainingInput {
  topic: string;
  trainingDate: string;
  hours: number;
  evaluationScore?: number;
  certificateFileUrl?: string;
  expiresAt?: string;
}
