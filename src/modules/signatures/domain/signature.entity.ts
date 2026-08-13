// Entidad de dominio: firma electrónica con auditoría (checklist: "Firma
// electrónica con auditoría de usuario y fecha"). Genérica por diseño —
// puede firmar un documento fijo, un formato diario o el cierre de una no
// conformidad (ver src/db/schema/signatures.ts).
export interface Signature {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  signedAt: Date;
  ipAddress: string | null;
  hash: string;
}

export interface NewSignatureInput {
  entityType: string;
  entityId: string;
}

// Datos ya resueltos (usuario del JWT, IP de la request, hash calculado) que
// el caso de uso pasa al repositorio para persistir.
export interface CreateSignatureData {
  entityType: string;
  entityId: string;
  userId: string;
  ipAddress: string | null;
  hash: string;
}

// Hash de integridad de la firma: SHA-256 de entityType+entityId+userId+
// timestamp. Cualquier alteración de esos datos (o un intento de reutilizar
// el hash para otra entidad/usuario) produce un hash distinto — sirve para
// verificar después que el registro de la firma no fue manipulado.
export function computeSignatureHash(
  entityType: string,
  entityId: string,
  userId: string,
  timestamp: string,
): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(`${entityType}:${entityId}:${userId}:${timestamp}`);
  return hasher.digest("hex");
}
