import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { EquipmentRepository } from "../domain/equipment.repository";

export class DeactivateEquipmentUseCase {
  constructor(private readonly repository: EquipmentRepository) {}

  async execute(scope: AccessScope, id: string): Promise<void> {
    const updated = await this.repository.deactivate(scope, id);
    if (!updated) throw new NotFoundError("Equipo");
  }
}
