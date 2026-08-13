// Entidad de dominio: plan de retiro (recall) originado en un lote.

export type RecallStatus = "en_proceso" | "cerrado";

export interface Recall {
  id: string;
  lotId: string;
  reason: string;
  initiatedAt: Date;
  status: RecallStatus;
  actionsTaken: string | null;
  closedAt: Date | null;
}

export interface NewRecallInput {
  reason: string;
  actionsTaken?: string;
}
