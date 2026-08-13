import type { AccessScope } from "../../../shared/domain/access-scope";
import type { Equipment, NewEquipmentInput, UpdateEquipmentInput } from "./equipment.entity";

export interface EquipmentRepository {
  // Por defecto excluye los equipos desactivados (active=false, soft-delete
  // de DeactivateEquipmentUseCase), mismo criterio que EmployeeRepository.
  // includeInactive existe para pantallas futuras que sí necesiten verlos.
  findAll(scope: AccessScope, options?: { includeInactive?: boolean }): Promise<Equipment[]>;
  create(companyId: string, input: NewEquipmentInput & { nextCalibrationDate: string }): Promise<Equipment>;
  update(
    scope: AccessScope,
    id: string,
    input: UpdateEquipmentInput & { nextCalibrationDate?: string },
  ): Promise<Equipment | null>;
  deactivate(scope: AccessScope, id: string): Promise<Equipment | null>;
}
