import type { Context } from "elysia";
import { NotFoundError, ValidationError, ForbiddenError, ConflictError, DomainError } from "../errors";

// Único punto donde un error de dominio se traduce a HTTP. Úsalo en el catch
// de cada handler de *.routes.ts: `catch (err) { return mapError(err, set); }`
export function mapError(err: unknown, set: Context["set"]) {
  if (err instanceof NotFoundError) {
    set.status = 404;
    return { error: err.message };
  }
  if (err instanceof ValidationError) {
    set.status = 400;
    return err.details ? { error: err.message, details: err.details } : { error: err.message };
  }
  if (err instanceof ForbiddenError) {
    set.status = 403;
    return { error: err.message };
  }
  if (err instanceof ConflictError) {
    set.status = 409;
    return { error: err.message };
  }
  if (err instanceof DomainError) {
    set.status = 400;
    return { error: err.message };
  }
  // Error no esperado: lo re-lanzamos para que lo capture el manejador
  // global de Elysia (onError en src/index.ts) y quede en logs como bug real.
  throw err;
}
