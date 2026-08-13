Mejora la configuración de Swagger de este backend Elysia (src/index.ts usa
@elysiajs/swagger, docs en /docs). Dos problemas:

1. Las rutas no están agrupadas por módulo en la UI de Swagger — todo
   aparece en una sola lista plana. Quiero que cada módulo tenga su propio
   grupo/tag: Auth, Companies, Sedes, Employees, Equipment, Daily Forms,
   Fixed Documents, Attachments, Scheduled Events, Dashboard. Revisa la
   versión instalada de elysia/@elysiajs/swagger (puede soportar un `tags:
   [...]` directo en el constructor de cada Elysia() de módulo, o requerir
   `detail: { tags: [...] }` por ruta agrupado con `.guard()` para no
   repetirlo en cada verbo) y aplica el método correcto según esa versión.
   Declara también la lista de tags con su descripción en
   `documentation.tags` dentro de swagger() en src/index.ts para que
   aparezcan en orden y con nombre bonito en el sidebar de la doc.

2. No hay forma de poner el token Bearer una sola vez en la UI de Swagger
   — hay que pegarlo manualmente en cada request. Agrega un securityScheme
   bearerAuth (type: http, scheme: bearer, bearerFormat: JWT) en
   `documentation.components.securitySchemes` y `documentation.security`
   dentro de la config de swagger(), y marca como protegidas (requieren
   ese security scheme) todas las rutas que pasan por requireAuth/
   requireRole (o sea, todo excepto POST /auth/login y GET /health). Si el
   plugin instalado soporta `persistAuthorization` o equivalente para que
   el botón "Authorize" recuerde el token entre recargas de la página,
   actívalo.

Al final quiero: entrar a /docs y ver las rutas agrupadas por módulo con
un botón "Authorize" arriba donde pego el token una vez y ya funciona en
todos los "Try it out" de rutas protegidas. Verifica corriendo `bun run
dev` y abriendo /docs.
