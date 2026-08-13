import type { AccessScope } from "../../../shared/domain/access-scope";
import type { Lot, LotStatus, NewLotInput } from "./lot.entity";

// Puerto (interfaz) que define QUÉ se puede hacer con lotes, sin decir CÓMO
// (eso lo implementa infrastructure/lot.drizzle-repository.ts). Los casos de
// uso (application/) solo conocen esta interfaz — eso permite testearlos con
// un repositorio falso, sin base de datos.
export interface LotRepository {
  findAll(scope: AccessScope): Promise<Lot[]>;
  findById(scope: AccessScope, id: string): Promise<Lot | null>;
  create(companyId: string, input: NewLotInput): Promise<Lot>;
  updateStatus(id: string, status: LotStatus): Promise<Lot | null>;
}
