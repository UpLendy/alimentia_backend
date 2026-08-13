import type { AccessScope } from "../../../shared/domain/access-scope";
import type { NotificationRepository } from "../domain/notification.repository";
import type { Notification } from "../domain/notification.entity";

export class ListNotificationsUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(scope: AccessScope): Promise<Notification[]> {
    return this.repository.findAll(scope);
  }
}
