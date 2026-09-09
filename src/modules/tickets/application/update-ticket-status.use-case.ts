import { NotFoundError } from "../../../shared/errors";
import type { TicketRepository } from "../domain/ticket.repository";
import type { Ticket, TicketStatus } from "../domain/ticket.entity";

// Solo bpm_admin llega aquí — la restricción de rol la aplica requireRole en
// el composition root (http/tickets.routes.ts), igual que en
// checklist/application/update-checklist-status.use-case.ts.
export class UpdateTicketStatusUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(id: string, status: TicketStatus): Promise<Ticket> {
    const updated = await this.repository.updateStatus(id, status);
    if (!updated) throw new NotFoundError("Ticket");
    return updated;
  }
}
