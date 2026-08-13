import { Elysia } from "elysia";
import { mapError } from "../shared/http/map-error";

// Red de seguridad global: handlers que no envuelven toScope()/casos de uso
// en su propio try/catch (p.ej. GET "/" de varios módulos) antes dejaban
// escapar errores de dominio (ValidationError, etc.) como 500 crudo de
// Elysia en vez del 400/403/404 que mapError ya define. No reemplaza el
// try/catch explícito de cada handler — solo atrapa lo que se les escape.
export const errorHandler = new Elysia({ name: "error-handler" }).onError({ as: "global" }, ({ code, error, set }) => {
  // "UNKNOWN" es el código que usa Elysia para cualquier throw plano dentro
  // de un handler (p.ej. nuestros DomainError). Los demás códigos (VALIDATION,
  // NOT_FOUND de ruta inexistente, PARSE, etc.) ya tienen su propio formato
  // nativo de Elysia — no los tocamos devolviendo undefined.
  if (code !== "UNKNOWN") return;

  try {
    return mapError(error, set);
  } catch {
    // mapError volvió a lanzar: es un error no esperado, no uno de dominio
    // conocido. Se loguea completo server-side y se responde genérico.
    console.error("[onError] error no manejado:", error);
    set.status = 500;
    return { error: "Error interno del servidor." };
  }
});
