import type { CreateSignatureData, Signature } from "./signature.entity";

// Puerto: QUÉ se puede hacer con las firmas, no CÓMO (ver
// infrastructure/signature.drizzle-repository.ts).
//
// No recibe AccessScope: `signatures` no tiene companyId propio (es
// genérica sobre cualquier entityType), así que el aislamiento multi-tenant
// lo garantiza quien llama — ver ListSignaturesUseCase/CreateSignatureUseCase,
// que verifican primero con el repositorio "dueño" de cada entityType
// (ej. FixedDocumentRepository) que la entidad pertenece a la empresa del
// usuario, antes de tocar esta tabla.
export interface SignatureRepository {
  findAllByEntity(entityType: string, entityId: string): Promise<Signature[]>;
  create(data: CreateSignatureData): Promise<Signature>;
}
