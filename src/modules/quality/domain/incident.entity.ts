// Entidad de dominio: la forma "de negocio" de un incidente. Registro simple
// (sin ciclo de vida propio: no tiene status ni updatedAt en la tabla, ver
// db/schema/qualityEvents.ts) — a diferencia de una no conformidad, no se
// "cierra", solo se documenta con su resolución.

export type IncidentSeverity = "baja" | "media" | "alta";

export interface Incident {
  id: string;
  companyId: string;
  sedeId: string;
  description: string;
  occurredAt: Date;
  type: string | null;
  severity: IncidentSeverity;
  resolution: string | null;
  reportedBy: string | null;
  createdAt: Date;
}

export interface NewIncidentInput {
  sedeId: string;
  description: string;
  occurredAt: string;
  type?: string;
  severity?: IncidentSeverity;
  resolution?: string;
}
