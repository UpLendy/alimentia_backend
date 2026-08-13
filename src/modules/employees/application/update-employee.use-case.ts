import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import { addYears, toISODate } from "../../../lib/dates";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { EmployeeRepository } from "../domain/employee.repository";
import type { Employee, UpdateEmployeeInput } from "../domain/employee.entity";

export class UpdateEmployeeUseCase {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(scope: AccessScope, id: string, input: UpdateEmployeeInput): Promise<Employee> {
    // Si el body trae sedeId, debe seguir perteneciendo a la empresa del
    // usuario (ver misma validación en CreateEmployeeUseCase).
    if (input.sedeId) {
      const sede = await this.sedeRepository.findById(scope.companyId, input.sedeId);
      if (!sede) throw new NotFoundError("Sede", "f");
    }

    const medicalExamExpiry = input.medicalExamDate
      ? toISODate(addYears(new Date(input.medicalExamDate), 1))
      : undefined;

    const updated = await this.repository.update(scope, id, { ...input, medicalExamExpiry });
    if (!updated) throw new NotFoundError("Empleado");
    return updated;
  }
}
