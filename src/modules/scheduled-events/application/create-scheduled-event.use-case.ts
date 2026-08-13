import { NotFoundError } from "../../../shared/errors";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { ScheduledEventRepository } from "../domain/scheduled-event.repository";
import type { NewScheduledEventInput, ScheduledEvent } from "../domain/scheduled-event.entity";

export class CreateScheduledEventUseCase {
  constructor(
    private readonly repository: ScheduledEventRepository,
    private readonly sedeRepository: SedeRepository,
  ) {}

  async execute(companyId: string, createdBy: string, input: NewScheduledEventInput): Promise<ScheduledEvent> {
    // La sede indicada debe pertenecer a la misma empresa del usuario
    // autenticado (ver misma validación en CreateEmployeeUseCase).
    const sede = await this.sedeRepository.findById(companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    return this.repository.create(companyId, createdBy, input);
  }
}
