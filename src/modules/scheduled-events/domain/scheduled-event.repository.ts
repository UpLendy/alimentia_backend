import type { AccessScope } from "../../../shared/domain/access-scope";
import type { NewScheduledEventInput, ScheduledEvent, UpdateScheduledEventInput } from "./scheduled-event.entity";

export interface ScheduledEventRepository {
  findAll(scope: AccessScope): Promise<ScheduledEvent[]>;
  create(companyId: string, createdBy: string, input: NewScheduledEventInput): Promise<ScheduledEvent>;
  update(scope: AccessScope, id: string, input: UpdateScheduledEventInput): Promise<ScheduledEvent | null>;
}
