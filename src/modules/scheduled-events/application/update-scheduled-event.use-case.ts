import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { ScheduledEventRepository } from "../domain/scheduled-event.repository";
import type { ScheduledEvent, UpdateScheduledEventInput } from "../domain/scheduled-event.entity";

export class UpdateScheduledEventUseCase {
  constructor(
    private readonly repository: ScheduledEventRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(scope: AccessScope, id: string, input: UpdateScheduledEventInput): Promise<ScheduledEvent> {
    // Si el body trae sedeId, debe seguir perteneciendo a la empresa del
    // usuario (ver misma validación en UpdateEmployeeUseCase).
    if (input.sedeId) {
      const sede = await this.sedeRepository.findById(scope.companyId, input.sedeId);
      if (!sede) throw new NotFoundError("Sede", "f");
    }

    const updated = await this.repository.update(scope, id, input);
    if (!updated) throw new NotFoundError("Evento");
    return updated;
  }
}
