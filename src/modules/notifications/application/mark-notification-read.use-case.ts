import type { AccessScope } from "../../../shared/domain/access-scope";
import { NotFoundError } from "../../../shared/errors";
import type { NotificationRepository } from "../domain/notification.repository";
import type { Notification } from "../domain/notification.entity";

export class MarkNotificationReadUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(scope: AccessScope, id: string): Promise<Notification> {
    const updated = await this.repository.markAsRead(scope, id);
    if (!updated) throw new NotFoundError("Notificación", "f");
    return updated;
  }
}
