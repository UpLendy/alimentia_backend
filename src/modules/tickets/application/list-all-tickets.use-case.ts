import type { TicketRepository } from "../domain/ticket.repository";
import type { TicketFilters, TicketWithDetails } from "../domain/ticket.entity";

// Vista de bpm_admin (panel interno): todos los tickets de todas las
// empresas, con filtros opcionales por status/type.
export class ListAllTicketsUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(filters?: TicketFilters): Promise<TicketWithDetails[]> {
    return this.repository.findAll(filters);
  }
}
