import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import { computeNextCalibrationDate, toISODate } from "../../../lib/dates";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { EquipmentRepository } from "../domain/equipment.repository";
import type { Equipment, UpdateEquipmentInput } from "../domain/equipment.entity";

export class UpdateEquipmentUseCase {
  constructor(
    private readonly repository: EquipmentRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(scope: AccessScope, id: string, input: UpdateEquipmentInput): Promise<Equipment> {
    if (input.sedeId) {
      const sede = await this.sedeRepository.findById(scope.companyId, input.sedeId);
      if (!sede) throw new NotFoundError("Sede", "f");
    }

    const nextCalibrationDate =
      input.lastCalibrationDate && input.calibrationFrequency
        ? toISODate(computeNextCalibrationDate(input.lastCalibrationDate, input.calibrationFrequency))
        : undefined;

    const updated = await this.repository.update(scope, id, { ...input, nextCalibrationDate });
    if (!updated) throw new NotFoundError("Equipo");
    return updated;
  }
}
