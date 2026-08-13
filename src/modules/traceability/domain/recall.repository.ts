import type { AccessScope } from "../../../shared/domain/access-scope";
import type { NewRecallInput, Recall } from "./recall.entity";

// Los recalls no tienen companyId/sedeId propios: cuelgan de un lote
// (recalls.lotId -> lots.id), que sí los tiene. La implementación concreta
// (infrastructure/recall.drizzle-repository.ts) resuelve el scope con un
// JOIN contra lots — el resto del módulo solo conoce este puerto.
export interface RecallRepository {
  findAllByCompany(scope: AccessScope): Promise<Recall[]>;
  create(lotId: string, input: NewRecallInput): Promise<Recall>;
}
