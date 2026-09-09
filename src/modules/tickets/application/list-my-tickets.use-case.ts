import type { TicketRepository } from "../domain/ticket.repository";
import type { Ticket, TicketFilters } from "../domain/ticket.entity";

// Vista de un usuario normal (admin/supervisor/operario): solo los tickets
// que él mismo creó. Deliberadamente no se filtra por companyId — ni otro
// admin de la misma empresa ve los tickets ajenos, solo bpm_admin ve todo
// (ver ListAllTicketsUseCase).
export class ListMyTicketsUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(userId: string, filters?: TicketFilters): Promise<Ticket[]> {
    return this.repository.findAllCreatedBy(userId, filters);
  }
}
