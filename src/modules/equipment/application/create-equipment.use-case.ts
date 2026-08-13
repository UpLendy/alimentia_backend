import { computeNextCalibrationDate, toISODate } from "../../../lib/dates";
import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { EquipmentRepository } from "../domain/equipment.repository";
import type { Equipment, NewEquipmentInput } from "../domain/equipment.entity";

export class CreateEquipmentUseCase {
  constructor(
    private readonly repository: EquipmentRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(companyId: string, input: NewEquipmentInput): Promise<Equipment> {
    // La sede indicada debe pertenecer a la misma empresa (ver la misma
    // validación en CreateEmployeeUseCase).
    const sede = await this.sedeRepository.findById(companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    const nextCalibrationDate = toISODate(
      computeNextCalibrationDate(input.lastCalibrationDate, input.calibrationFrequency),
    );
    return this.repository.create(companyId, { ...input, nextCalibrationDate });
  }
}
