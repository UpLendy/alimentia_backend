import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { EmployeeRepository } from "../../employees/domain/employee.repository";
import type { TrainingRepository } from "../domain/training.repository";
import type { Training } from "../domain/training.entity";

export class ListTrainingsUseCase {
  constructor(
    private readonly trainingRepository: TrainingRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(scope: AccessScope, employeeId: string): Promise<Training[]> {
    const employee = await this.employeeRepository.findById(scope, employeeId);
    if (!employee) throw new NotFoundError("Empleado", "m");

    return this.trainingRepository.findAllByEmployee(employeeId);
  }
}
