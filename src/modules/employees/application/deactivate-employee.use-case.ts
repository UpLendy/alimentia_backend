import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { EmployeeRepository } from "../domain/employee.repository";

export class DeactivateEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  async execute(scope: AccessScope, id: string): Promise<void> {
    const updated = await this.repository.deactivate(scope, id);
    if (!updated) throw new NotFoundError("Empleado");
  }
}
