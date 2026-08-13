// Errores de dominio/aplicación: no saben nada de HTTP. La capa http/ (los
// *.routes.ts) los captura y los traduce a status codes (ver
// shared/http/map-error.ts). Así los casos de uso se pueden testear sin
// levantar un servidor ni simular un Response.

export class DomainError extends Error {}

export class NotFoundError extends DomainError {
  // `gender` solo ajusta la concordancia del mensaje ("no encontrado" vs
  // "no encontrada") — el default masculino cubre la mayoría de entidades.
  constructor(entity: string, gender: "m" | "f" = "m") {
    super(`${entity} no encontrad${gender === "f" ? "a" : "o"}.`);
  }
}

export class ValidationError extends DomainError {
  // `details` es opcional: lo usan casos de uso que necesitan reportar
  // errores de validación estructurados (ej. payload de daily-forms contra
  // su schema por tipo), sin forzar ese shape a los demás usos del error.
  constructor(
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
  }
}

export class ForbiddenError extends DomainError {}

export class ConflictError extends DomainError {}
