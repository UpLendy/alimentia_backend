import type { JwtPayload } from "../../plugins/auth";
import type { AccessScope } from "./access-scope";
import { ValidationError } from "../errors";

// Traduce el payload del JWT (detalle de infraestructura/auth) al AccessScope
// que entienden los casos de uso (detalle de dominio). Si en el futuro cambia
// cómo se autentica (sesión, API key, etc.), solo este helper se toca.
export function toScope(user: JwtPayload): AccessScope {
  if (!user.companyId) {
    throw new ValidationError("El usuario no está asociado a ninguna empresa.");
  }
  return { companyId: user.companyId, sedeId: user.sedeId };
}
