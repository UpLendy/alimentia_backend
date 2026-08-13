import type { AccessScope } from "../../../shared/domain/access-scope";
import type { Employee, NewEmployeeInput, UpdateEmployeeInput } from "./employee.entity";

// Puerto (interfaz) que define QUÉ se puede hacer con empleados, sin decir
// CÓMO (eso lo implementa infrastructure/employee.drizzle-repository.ts).
// Los casos de uso (application/) solo conocen esta interfaz — eso permite
// testearlos con un repositorio falso, sin base de datos.
export interface EmployeeRepository {
  // Por defecto excluye los empleados desactivados (active=false, soft-delete
  // de DeactivateEmployeeUseCase). includeInactive existe para pantallas
  // futuras que sí necesiten verlos (ej. un historial); hoy nada lo pasa en true.
  findAll(scope: AccessScope, options?: { includeInactive?: boolean }): Promise<Employee[]>;
  findById(scope: AccessScope, id: string): Promise<Employee | null>;
  create(companyId: string, input: NewEmployeeInput & { medicalExamExpiry: string | null }): Promise<Employee>;
  update(
    scope: AccessScope,
    id: string,
    input: UpdateEmployeeInput & { medicalExamExpiry?: string | null },
  ): Promise<Employee | null>;
  deactivate(scope: AccessScope, id: string): Promise<Employee | null>;
  // Suma `hours` al acumulado trainingHoursCompleted (checklist "Capacitación").
  // Usado por trainings/application/create-training.use-case.ts al registrar
  // una nueva capacitación — es un incremento atómico (UPDATE ... SET x = x + n),
  // no un read-then-write en JS.
  incrementTrainingHours(scope: AccessScope, id: string, hours: number): Promise<Employee | null>;
}
