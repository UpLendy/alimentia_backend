El /docs (swagger-ui, forzado con provider: "swagger-ui" en src/index.ts)
carga pero se ve totalmente sin estilos: texto enorme, filas apiladas sin
grid/flex, como si el CSS de swagger-ui no cargara y el navegador
renderizara el HTML crudo con sus estilos por defecto.

Diagnostica antes de tocar nada:
1. Abre /docs en el navegador, abre DevTools > Network, recarga, y revisa
   si hay requests a swagger-ui.css / swagger-ui-bundle.js / swagger-ui-
   standalone-preset.js en 404 o bloqueados (CORS, mixed-content, ruta
   incorrecta).
2. Revisa el HTML servido (view-source: o `curl http://localhost:3001/docs`)
   y confirma de dónde está intentando cargar esos assets: ¿de un CDN
   externo, o de una ruta local servida por @elysiajs/swagger? Si es CDN,
   confirma que esa URL responde 200 desde este entorno (podría estar
   bloqueada por firewall/red).
3. Revisa la versión exacta instalada de @elysiajs/swagger (package.json /
   bun.lock) y su documentación/README para swagger-ui: algunas versiones
   requieren pasar `cdn` explícito, o sirven los assets de
   swagger-ui-dist vía una ruta estática que hay que confirmar que está
   montada.

Corrige la causa raíz (no un parche visual): el objetivo es que /docs se
vea como un swagger-ui normal — barra superior compacta, filas de rutas
con su color por método (GET azul, POST verde, etc.), tags colapsables,
sin fuentes gigantes ni bloques sin estilo. Si la causa es que el CDN por
defecto no es alcanzable desde donde corre el servidor, cambia a servir
swagger-ui-dist localmente (viene como dependencia transitiva de
@elysiajs/swagger, o instálalo directo) en vez de depender de un CDN.

Verifica el resultado abriendo /docs y confirmando visualmente (o con un
screenshot) que se ve como un swagger-ui estándar, no como HTML sin estilos.
