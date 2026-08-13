import type { AccessScope } from "../../../shared/domain/access-scope";
import type { ScheduledEventRepository } from "../domain/scheduled-event.repository";
import type { ScheduledEvent } from "../domain/scheduled-event.entity";

export class ListScheduledEventsUseCase {
  constructor(private readonly repository: ScheduledEventRepository) {}

  async execute(scope: AccessScope): Promise<ScheduledEvent[]> {
    return this.repository.findAll(scope);
  }
}
