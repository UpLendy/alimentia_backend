import type { NewTrainingInput, Training } from "./training.entity";

// Puerto: QUÉ se puede hacer con las capacitaciones, no CÓMO (ver
// infrastructure/training.drizzle-repository.ts).
//
// No recibe AccessScope: `trainings` no tiene companyId/sedeId propios (cuelga
// de employees), así que el aislamiento multi-tenant lo garantiza quien llama
// (los casos de uso, verificando primero con EmployeeRepository.findById(scope, employeeId)
// que el empleado pertenece a la empresa/sede del usuario) antes de tocar esta tabla.
export interface TrainingRepository {
  findAllByEmployee(employeeId: string): Promise<Training[]>;
  create(employeeId: string, input: NewTrainingInput): Promise<Training>;
}
