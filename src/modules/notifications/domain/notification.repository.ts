import type { AccessScope } from "../../../shared/domain/access-scope";
import type { Notification, NewNotificationInput } from "./notification.entity";

// Puerto: QUÉ se puede hacer con las notificaciones, no CÓMO (ver
// infrastructure/notification.drizzle-repository.ts).
export interface NotificationRepository {
  findAll(scope: AccessScope): Promise<Notification[]>;
  markAsRead(scope: AccessScope, id: string): Promise<Notification | null>;
  create(companyId: string, input: NewNotificationInput): Promise<Notification>;
  // Dedup para CheckAlertsUseCase: evita crear una notificación repetida
  // mientras ya exista una pendiente para la misma fila de origen.
  findPendingByReference(
    companyId: string,
    referenceTable: string,
    referenceId: string,
  ): Promise<Notification | null>;
}
