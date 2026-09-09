import type { TicketRepository } from "../domain/ticket.repository";
import type { Ticket, NewTicketInput } from "../domain/ticket.entity";

// Sin feature-gating ni validación de plan a propósito: es una herramienta
// interna para reportar problemas durante las pruebas, no un módulo del
// producto — cualquier usuario autenticado, de cualquier rol y cualquier
// plan, debe poder crear un ticket.
export class CreateTicketUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(companyId: string | null, createdByUserId: string, input: NewTicketInput): Promise<Ticket> {
    return this.repository.create(companyId, createdByUserId, input);
  }
}
