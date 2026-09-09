import type { Ticket, NewTicketInput, TicketFilters, TicketStatus, TicketWithDetails } from "./ticket.entity";

// Puerto (interfaz) que define QUÉ se puede hacer con tickets, sin decir
// CÓMO (eso lo implementa infrastructure/ticket.drizzle-repository.ts).
export interface TicketRepository {
  create(companyId: string | null, createdByUserId: string, input: NewTicketInput): Promise<Ticket>;
  // Vista de un usuario normal: solo los tickets que él mismo creó, sin
  // importar la empresa (ni siquiera otro admin de su misma empresa los ve).
  findAllCreatedBy(userId: string, filters?: TicketFilters): Promise<Ticket[]>;
  // Vista de bpm_admin: todos los tickets de todas las empresas, con
  // empresa/creador ya resueltos (join) para el panel.
  findAll(filters?: TicketFilters): Promise<TicketWithDetails[]>;
  findById(id: string): Promise<Ticket | null>;
  updateStatus(id: string, status: TicketStatus): Promise<Ticket | null>;
}
