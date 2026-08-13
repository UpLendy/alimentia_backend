export type NotificationChannel = "push" | "whatsapp" | "email";
export type NotificationStatus = "pendiente" | "enviada" | "leida" | "fallida";

// Entidad de dominio: la forma "de negocio" de una alerta/notificación. No
// importa nada de Drizzle ni de Elysia.
export interface Notification {
  id: string;
  companyId: string;
  sedeId: string | null;
  userId: string | null;
  type: string; // examen_medico | capacitacion | calibracion | evento_programado | ...
  referenceTable: string | null; // ej: "employees", "equipment", "scheduled_events"
  referenceId: string | null;
  title: string;
  message: string;
  dueDate: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: Date | null;
  createdAt: Date;
}

export interface NewNotificationInput {
  sedeId?: string | null;
  userId?: string | null;
  type: string;
  referenceTable?: string;
  referenceId?: string;
  title: string;
  message: string;
  dueDate?: string;
  channel?: NotificationChannel;
}
