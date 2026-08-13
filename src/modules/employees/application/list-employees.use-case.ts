import type { AccessScope } from "../../../shared/domain/access-scope";
import { getVigenciaStatus } from "../../../lib/dates";
import type { EmployeeRepository } from "../domain/employee.repository";
import type { EmployeeWithStatus } from "../domain/employee.entity";

export class ListEmployeesUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  async execute(scope: AccessScope, options?: { includeInactive?: boolean }): Promise<EmployeeWithStatus[]> {
    const employees = await this.repository.findAll(scope, options);
    return employees.map((employee) => ({
      ...employee,
      medicalExamStatus: getVigenciaStatus(employee.medicalExamExpiry),
    }));
  }
}
