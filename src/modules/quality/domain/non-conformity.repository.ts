import type { AccessScope } from "../../../shared/domain/access-scope";
import type { NonConformity, NonConformityStatus, NewNonConformityInput } from "./non-conformity.entity";

// Puerto (interfaz) que define QUÉ se puede hacer con no conformidades, sin
// decir CÓMO (eso lo implementa infrastructure/non-conformity.drizzle-repository.ts).
// Los casos de uso (application/) solo conocen esta interfaz — eso permite
// testearlos con un repositorio falso, sin base de datos.
export interface NonConformityRepository {
  findAll(scope: AccessScope): Promise<NonConformity[]>;
  findById(scope: AccessScope, id: string): Promise<NonConformity | null>;
  create(companyId: string, input: NewNonConformityInput): Promise<NonConformity>;
  // El `status` que puede llegar acá incluye "cerrada" (a diferencia de
  // UpdateNonConformityInput): lo usa tanto UpdateNonConformityUseCase
  // (abierta/en_proceso) como CloseNonConformityUseCase (cerrada + closedAt).
  update(
    scope: AccessScope,
    id: string,
    input: Partial<NewNonConformityInput> & { status?: NonConformityStatus; closedAt?: Date | null },
  ): Promise<NonConformity | null>;
}
