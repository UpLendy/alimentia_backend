import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import { getVigenciaStatus } from "../../../lib/dates";
import type { EmployeeRepository } from "../domain/employee.repository";
import type { EmployeeWithStatus } from "../domain/employee.entity";

export class GetEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  async execute(scope: AccessScope, id: string): Promise<EmployeeWithStatus> {
    const employee = await this.repository.findById(scope, id);
    if (!employee) throw new NotFoundError("Empleado");
    return { ...employee, medicalExamStatus: getVigenciaStatus(employee.medicalExamExpiry) };
  }
}
