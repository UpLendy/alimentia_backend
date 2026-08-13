import { Elysia } from "elysia";

// Cabeceras de seguridad HTTP básicas para TODA la API.
// - X-Content-Type-Options: evita que el navegador "adivine" un tipo de
//   contenido distinto al declarado (mitiga ataques de sniffing/XSS).
// - X-Frame-Options: DENY evita que la API se embeba en un iframe
//   (clickjacking) — esta API no tiene ninguna razón para vivir en un frame.
export const securityHeaders = new Elysia({ name: "security-headers" }).onAfterHandle(
  { as: "global" },
  ({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
  },
);

// Cache-Control: no-store para rutas con datos sensibles (auth, dashboard):
// evita que un proxy/navegador compartido guarde tokens o datos de negocio
// en caché. Úsalo con `.use(noStoreCache)` dentro del módulo, no global —
// las rutas públicas de /docs sí se benefician de cacheo normal.
export const noStoreCache = new Elysia({ name: "no-store-cache" }).onAfterHandle({ as: "scoped" }, ({ set }) => {
  set.headers["Cache-Control"] = "no-store";
});
