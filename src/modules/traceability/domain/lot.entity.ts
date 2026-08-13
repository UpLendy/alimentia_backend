// Entidad de dominio: la forma "de negocio" de un lote. No importa nada de
// Drizzle ni de Elysia — si mañana cambia el ORM o el framework HTTP, este
// archivo no se toca.

export type LotStatus = "activo" | "agotado" | "retirado";
export type LotExpiryStatus = "vigente" | "por_vencer" | "vencido";

export interface Lot {
  id: string;
  companyId: string;
  sedeId: string;
  productName: string;
  lotCode: string;
  supplierId: string | null;
  receivedDate: string;
  expiryDate: string | null;
  quantity: string | null;
  unit: string | null;
  allergens: string[] | null;
  status: LotStatus;
  createdAt: Date;
}

// Lo que devuelve la API: la entidad + el estado calculado (regla de negocio,
// ver application/list-lots.use-case.ts). El front la consume tal cual.
export interface LotWithStatus extends Lot {
  expiryStatus: LotExpiryStatus;
}

export interface NewLotInput {
  sedeId: string;
  productName: string;
  lotCode: string;
  supplierId?: string;
  receivedDate: string;
  expiryDate?: string;
  quantity?: string;
  unit?: string;
  allergens?: string[];
}
