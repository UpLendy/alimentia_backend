export type ScheduledEventServiceType = "agua" | "superficies" | "fumigacion" | "trampas";
export type ScheduledEventStatus = "pendiente" | "completado" | "cancelado";

export interface ScheduledEvent {
  id: string;
  companyId: string;
  sedeId: string;
  serviceType: ScheduledEventServiceType;
  proposedDate: string;
  providerName: string | null;
  notes: string | null;
  status: ScheduledEventStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewScheduledEventInput {
  sedeId: string;
  serviceType: ScheduledEventServiceType;
  proposedDate: string;
  providerName?: string;
  notes?: string;
}

export type UpdateScheduledEventInput = Partial<NewScheduledEventInput> & {
  status?: ScheduledEventStatus;
};
