// Entidad de dominio: la forma "de negocio" de un ticket. No importa nada de
// Drizzle ni de Elysia — herramienta interna para reportar bugs/mejoras/dudas
// durante las pruebas de la plataforma.

export type TicketType = "bug" | "mejora" | "duda";
export type TicketStatus = "abierto" | "en_progreso" | "resuelto";

export interface Ticket {
  id: string;
  // Nulo cuando lo crea un bpm_admin (companyId null, igual que en users).
  companyId: string | null;
  createdByUserId: string;
  title: string;
  description: string;
  type: TicketType;
  // Ruta del front desde donde se reportó (ej. "/formatos/higiene").
  pageContext: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTicketInput {
  title: string;
  description: string;
  type: TicketType;
  pageContext: string;
}

export interface UpdateTicketInput {
  status: TicketStatus;
}

export interface TicketFilters {
  status?: TicketStatus;
  type?: TicketType;
}

// Vista de bpm_admin (panel interno): igual que Ticket pero con el nombre de
// empresa/creador ya resueltos, para no obligar al panel a resolver IDs.
export interface TicketWithDetails extends Ticket {
  companyName: string | null;
  creatorName: string;
}
