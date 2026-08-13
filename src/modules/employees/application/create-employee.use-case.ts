import { addYears, toISODate } from "../../../lib/dates";
import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { EmployeeRepository } from "../domain/employee.repository";
import type { Employee, NewEmployeeInput } from "../domain/employee.entity";

export class CreateEmployeeUseCase {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(companyId: string, input: NewEmployeeInput): Promise<Employee> {
    // La sede indicada debe pertenecer a la misma empresa del usuario
    // autenticado — si no, un admin de la empresa B podría "colgar" un
    // empleado suyo de una sede de la empresa A pasando su sedeId a mano.
    const sede = await this.sedeRepository.findById(companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    // Regla de negocio: el examen médico ocupacional vence al año (Res.
    // 2674/2013 Art. 11). Vive aquí, no en la ruta ni en el repositorio.
    const medicalExamExpiry = input.medicalExamDate ? toISODate(addYears(new Date(input.medicalExamDate), 1)) : null;

    return this.repository.create(companyId, { ...input, medicalExamExpiry });
  }
}
