Nos desviamos: para conseguir un botón "Authorize" clásico forzamos
`provider: "swagger-ui"` en @elysiajs/swagger y luego, para "arreglar" el
CSS roto de esa opción, se creó un plugin casero
(src/plugins/swagger-ui.ts) que sirve su propia página HTML con assets de
swagger-ui-dist servidos localmente, montado aparte del plugin de swagger
oficial (que quedó escondido en /internal/swagger-plugin-page). El
resultado se ve peor que antes y ya no es mantenible.

Quiero volver a Scalar (el provider por defecto de @elysiajs/swagger, que
ya se ve bien pulido out-of-the-box: sidebar agrupado por tags, hero con
info de la API, selector de client libraries, y un campo de Bearer Token
persistente en el panel de Authentication — no necesita un botón
"Authorize" modal para cumplir lo que pedí originalmente).

Hazme esto en src/index.ts:

1. Elimina el plugin casero: borra src/plugins/swagger-ui.ts y su import/
   uso en src/index.ts.
2. En la config de swagger(), quita `provider: "swagger-ui"` y
   `swaggerOptions: { persistAuthorization: true }` (eso era específico de
   swagger-ui). Vuelve a un solo `path: "/docs"` normal (sin el hack de
   specPath separado ni el path escondido en /internal/...).
3. Deja tal cual el resto de la documentation config que sí sirve para
   Scalar: los `tags` (Auth, Companies, Sedes, Employees, Equipment, Daily
   Forms, Fixed Documents, Attachments, Scheduled Events, Dashboard), el
   `components.securitySchemes.bearerAuth`, y el `security: [{ bearerAuth:
   [] }]` global con las excepciones en /auth/login y /health
   (`detail: { security: [] }`) — todo eso Scalar lo respeta igual y es lo
   que hace aparecer el campo de Bearer Token y el candado por ruta.
4. No toques los `tags: [...]` que ya están puestos en el constructor de
   cada módulo (auth.routes.ts, companies.routes.ts, etc.) — esos siguen
   sirviendo para agrupar en el sidebar de Scalar tal cual.

Verifica corriendo `bun run dev` y abriendo /docs: debe verse como Scalar
normal (fondo con gradiente, sidebar a la izquierda agrupado por los 10
módulos en el orden declarado, panel de Authentication con campo Bearer
Token donde pego el JWT una sola vez). Confírmalo con un screenshot o
describiendo lo que ves, y borra cualquier archivo/ruta que haya quedado
huérfano del intento anterior (el /internal/swagger-plugin-page, cualquier
carpeta de assets de swagger-ui-dist copiada a mano, etc.).
