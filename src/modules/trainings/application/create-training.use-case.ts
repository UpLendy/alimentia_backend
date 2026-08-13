import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { EmployeeRepository } from "../../employees/domain/employee.repository";
import type { TrainingRepository } from "../domain/training.repository";
import type { NewTrainingInput, Training } from "../domain/training.entity";

// Al registrar una capacitación hay que sumar sus horas al acumulado
// employees.trainingHoursCompleted (checklist "Capacitación": 10h/año
// obligatorias) — de ahí que este caso de uso dependa tanto de
// TrainingRepository como de EmployeeRepository, no solo del primero.
//
// Este caso de uso no sabe que existe una transacción: solo llama a sus dos
// puertos en orden. La atomicidad real (que el insert de trainings y el
// incremento en employees corran en la misma transacción SQL) la da el
// composition root (trainings.routes.ts), que en el POST construye este
// caso de uso con instancias de ambos repositorios ligadas al mismo `tx` de
// un db.transaction(...) — ver DbClient en src/db/client.ts.
export class CreateTrainingUseCase {
  constructor(
    private readonly trainingRepository: TrainingRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(scope: AccessScope, employeeId: string, input: NewTrainingInput): Promise<Training> {
    const employee = await this.employeeRepository.findById(scope, employeeId);
    if (!employee) throw new NotFoundError("Empleado", "m");

    const training = await this.trainingRepository.create(employeeId, input);
    await this.employeeRepository.incrementTrainingHours(scope, employeeId, input.hours);
    return training;
  }
}
