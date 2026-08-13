import type { AccessScope } from "../../../shared/domain/access-scope";
import { getVigenciaStatus } from "../../../lib/dates";
import type { EquipmentRepository } from "../domain/equipment.repository";
import type { EquipmentWithStatus } from "../domain/equipment.entity";

export class ListEquipmentUseCase {
  constructor(private readonly repository: EquipmentRepository) {}

  async execute(scope: AccessScope, options?: { includeInactive?: boolean }): Promise<EquipmentWithStatus[]> {
    const equipment = await this.repository.findAll(scope, options);
    return equipment.map((item) => ({
      ...item,
      calibrationStatus: getVigenciaStatus(item.nextCalibrationDate),
    }));
  }
}
