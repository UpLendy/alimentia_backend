// Concepto de dominio: a qué datos puede acceder quien hace la petición.
// Es agnóstico de HTTP y de Drizzle a propósito — el JWT y el ORM son
// detalles de infraestructura; el "scope" es una regla de negocio (multi-
// tenant: una empresa, opcionalmente restringido a una sola sede).
export interface AccessScope {
  companyId: string;
  // null = admin de la empresa (o bpm_admin) con acceso a todas sus sedes.
  sedeId: string | null;
}
