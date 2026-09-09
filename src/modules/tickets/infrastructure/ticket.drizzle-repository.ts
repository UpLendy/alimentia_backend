import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { tickets, companies, users } from "../../../db/schema";
import type { TicketRepository } from "../domain/ticket.repository";
import type { Ticket, NewTicketInput, TicketFilters, TicketStatus, TicketWithDetails } from "../domain/ticket.entity";

// Único archivo del módulo que sabe que existe Postgres/Drizzle.
function filterConditions(filters?: TicketFilters) {
  const conditions = [];
  if (filters?.status) conditions.push(eq(tickets.status, filters.status));
  if (filters?.type) conditions.push(eq(tickets.type, filters.type));
  return conditions;
}

export class DrizzleTicketRepository implements TicketRepository {
  async create(companyId: string | null, createdByUserId: string, input: NewTicketInput): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values({ companyId, createdByUserId, ...input })
      .returning();
    return ticket!;
  }

  async findAllCreatedBy(userId: string, filters?: TicketFilters): Promise<Ticket[]> {
    const conditions = [eq(tickets.createdByUserId, userId), ...filterConditions(filters)];
    return db
      .select()
      .from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt));
  }

  async findAll(filters?: TicketFilters): Promise<TicketWithDetails[]> {
    const conditions = filterConditions(filters);
    // leftJoin en companies porque companyId puede ser null (ticket creado
    // por un bpm_admin); innerJoin en users porque createdByUserId siempre existe.
    const joined = db
      .select({
        ticket: tickets,
        companyName: companies.name,
        creatorName: users.fullName,
      })
      .from(tickets)
      .leftJoin(companies, eq(tickets.companyId, companies.id))
      .innerJoin(users, eq(tickets.createdByUserId, users.id));

    const rows =
      conditions.length === 0
        ? await joined.orderBy(desc(tickets.createdAt))
        : await joined.where(and(...conditions)).orderBy(desc(tickets.createdAt));
    return rows.map((row) => ({ ...row.ticket, companyName: row.companyName, creatorName: row.creatorName }));
  }

  async findById(id: string): Promise<Ticket | null> {
    const [row] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    return row ?? null;
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
    const [updated] = await db
      .update(tickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updated ?? null;
  }
}
