# Prompts para Claude Code — Alimentia Backend

Guía de prompts para continuar el proyecto con Claude Code, en orden. Cada uno es autocontenido: pégalo tal cual en la carpeta correspondiente (backend o front). Ejecuta un prompt, revisa el resultado, y pasa al siguiente — no encadenes varios sin revisar.

Convención: **[BACKEND]** = correr con Claude Code apuntando a `plataforma_documentos_backend`. **[FRONT]** = apuntando a `Plataforma documentos`.

## Estado actual (resumen para no perder el hilo)

- **Fase 0 (scaffold) — ✅ completa.**
- **Fase 1 (conectar front) — ✅ completa.** Prompts 3-8 hechos y verificados en vivo. De paso salieron 4 correcciones reales de backend (filtro de inactivos en employees/equipment, reactivación vía PATCH, y una auditoría de seguridad que encontró el bug de sedeId cruzado en 4 casos de uso más — ver Prompt 8b).
- **Fase 2 (Checklist Maestro) — ✅ completa.** Prompts 9-16: proveedores, trazabilidad/recall, no conformidades/CAPA, motor de alarmas, capacitación detallada, checklist interno BPM, firma electrónica, y reporte PDF de inspección. Todos con aislamiento multi-tenant y plan-gating cubiertos por tests (suite completa: 59/59). Se agregó un `.onError` global (`src/plugins/error-handler.ts`) que sanea cualquier error no manejado a 500 genérico en vez de filtrar detalles internos, y MinIO quedó como infraestructura permanente de desarrollo para probar flujos de S3 de verdad.
- **Regla de proceso establecida en Fase 2:** todo prompt de backend nuevo debe incluir sus propios tests de aislamiento multi-tenant/plan-gating en el mismo prompt (no como seguimiento aparte), y todo prompt de front debe verificarse con click-through en navegador real, no solo con curl/tsc — un bug de CORS invisible a curl (ver Prompt 11) hizo que toda la Fase 1 pareciera funcionar cuando en un navegador real fallaba.
- **Arquitectura del backend** — migrado por completo de "schema.ts + routes.ts plano" a Clean Architecture (`domain/application/infrastructure/http`) en los 9 módulos existentes (incluido `auth`). Documentado en `ARCHITECTURE.md`. Cualquier prompt nuevo debe seguir ese patrón — ya está indicado en cada prompt de Fase 2 en adelante.
- **Seguridad — ✅ endurecida** antes de construir pagos: JWT de acceso corto (15 min) + refresh tokens rotables (`refresh_tokens`), rate limiting en login/refresh, cabeceras de seguridad, `audit_log`, test automatizado de aislamiento multi-tenant (que encontró y corrigió un bug real de `sedeId` cruzado entre empresas), y validación de secretos en arranque para producción.
- **Prompt 19 (Fase 4) — ✅ Completo y verificado end-to-end** contra el backend real: cookie `bpm_refresh_token` con `HttpOnly; Secure; SameSite=Strict` confirmada, rotación de refresh token verificada (valor distinto antes/después, el viejo queda inválido del lado del servidor), logout revoca y no se puede revivir la sesión. Único detalle sin observar en vivo (solo revisado por código): el catch-and-retry de un 401 dentro de una pestaña de navegador real — bajo riesgo, no bloquea seguir.
- **CORS — ✅ dinámico.** `FRONTEND_URLS` (lista separada por coma) reemplaza el `FRONTEND_URL` único; en producción se exige exactamente un dominio real (rechaza localhost o múltiples orígenes al arrancar). Ya no hay que reiniciar el backend cuando Next.js cambia de puerto en desarrollo.
- **Despliegue — backend en producción, ✅ EC2 + RDS.** Backend corriendo en una instancia EC2 propia (Ohio), Postgres en RDS (`db.t4g.micro`, gp3, no público, solo alcanzable desde el EC2), Docker Compose de producción (`restart: unless-stopped`), Nginx + Certbot con HTTPS real. Nota importante: Let's Encrypt rechaza por política los dominios `*.amazonaws.com` (verificado con el error real de Certbot) — se usa `sslip.io` como hostname temporal (`3-19-160-203.sslip.io`) hasta que exista un dominio propio; migrar es solo cambiar `server_name` + re-correr `certbot`, documentado en el README. Front ya en Vercel, auditado para build limpio con fail-fast si falta `NEXT_PUBLIC_API_URL`. Pendiente: actualizar `NEXT_PUBLIC_API_URL` en Vercel a `https://3-19-160-203.sslip.io` + forzar redeploy (se inlinea en build-time). Bucket S3 real todavía no existe — `S3_*` quedaron comentadas en el `.env` de producción, `/attachments` no funciona hasta crearlo.
- **Datos de revisión en producción.** Se sembró la RDS real (`src/db/seed-demo-production.ts`, idempotente, contraseñas únicas generadas por usuario — no reutiliza las de desarrollo) con checklist_catalog completo, un `bpm_admin`, y 3 empresas demo (una por plan) para que el equipo de BPM Consulting revise la plataforma desplegada y dé feedback. **Pendiente:** borrar o desactivar estos datos de prueba antes de onboardear el primer cliente real, para no mezclarlos.
- **S3 real — ✅ conectado en producción.** Bucket `alimentia-files-prod` (us-east-2, política de solo lectura pública), backend autentica vía rol IAM del EC2 (`AlimentiaEC2Role`, sin llaves estáticas — se corrigió un bug real en `src/lib/s3.ts` que rompía el fallback a la cadena de credenciales por defecto). Verificado de punta a punta contra el bucket real: upload-url, PUT a S3, GET del archivo. Rol IAM deliberadamente sin `s3:DeleteObject` (principio de menor privilegio — no hay ningún caso de uso real hoy que borre archivos).
- **Pagos:** decidido que será con checkout hospedado de un procesador externo (el backend nunca toca datos de tarjeta). Falta elegir el procesador (Wompi/PayU/MercadoPago/Stripe) antes de poder escribir el prompt del módulo de pagos — ver Fase 5.

---

## Fase 0 — Poner el scaffold a correr ✅ Completo

Prompt 1 (instalar, migrar, sembrar) y Prompt 2 (smoke test de login → employees → equipment → daily-forms → dashboard) ya se ejecutaron y verificaron. `bun run dev`, `/health` y `/docs` funcionan.

---

## Fase 1 — Conectar el front a la API real

### Prompt 3 — Cliente API y autenticación [FRONT] ✅ Completo

Se creó `src/lib/api.ts`, `AuthProvider`/`AuthGate`, la pantalla `/login` y el logout real en Configuración. Verificado end-to-end contra el backend real.

**⚠️ Desactualizado por el endurecimiento de seguridad — no repitas este prompt, corre el Prompt 19 (Fase 4) para ponerlo al día.**

### Prompt 4 — Dashboard con datos reales [FRONT] ✅ Completo

`src/app/page.tsx` conectado a `GET /dashboard/summary`. Tarjetas remapeadas a los 3 stats reales (medicalExamsCritical, dailyFormsFilledToday, equipmentCalibratedPct); se quitó el falso "+4% desde el mes pasado" porque el backend no da históricos. Centro de Alertas mapea `alerts[]` por tipo/severidad con estado vacío. Skeleton en carga, banner con "Reintentar" en error. Verificado contra el backend/Postgres real (3 alertas reales de la seed). "Formatos por llenar hoy" quedó sin tocar (el summary no expone eso todavía).

### Prompt 5 — Personal [FRONT] ✅ Completo

Conectado y verificado en vivo contra el backend real. Encontró un bug real: `GET /employees` devolvía también empleados desactivados — corregido en el Prompt 5b (backend); el parche temporal en el front ya fue revertido.

<details>
<summary>Prompt original (referencia, ya no hace falta repetirlo)</summary>

```
Conecta src/app/personal/page.tsx y src/app/personal/nuevo/page.tsx al
backend:
- Listado: GET /employees (ya incluye medicalExamStatus calculado:
  vigente/por_vencer/vencido — úsalo en vez de la lógica mock actual).
- Alta: POST /employees con el body { sedeId, fullName, documentId,
  position, hireDate, medicalExamDate, hasFoodHandlerCert }. Necesitas
  obtener el sedeId del usuario logueado o de GET /sedes (si el usuario
  admin tiene varias sedes, agrega un selector; si solo tiene una,
  úsala automáticamente sin mostrar el selector). Nota: el backend ahora
  valida que el sedeId pertenezca a la empresa del usuario y devuelve 404
  si no — no debería pasar si usas GET /sedes, pero maneja ese error por
  si acaso.
- El input de archivo (certificado) del formulario "nuevo empleado" debe
  quedar preparado para subir a S3 pero puedes dejarlo como TODO si el
  flujo de adjuntos de employees aún no existe en el backend (ver Fase 2,
  prompt 9) — no bloquees el guardado del empleado por esto.
```

</details>

### Prompt 5b — Filtrar empleados inactivos en el listado [BACKEND] ✅ Completo

`EmployeeRepository.findAll` ahora acepta `options?: { includeInactive?: boolean }` y excluye `active=false` por defecto (no expuesto por query string todavía). Efecto colateral bueno: corrigió también un conteo inflado en `GetDashboardSummaryUseCase`, que llamaba `findAll` sin opciones. Verificado en vivo y revertido el parche del front.

### Prompt 6 — Infraestructura [FRONT] ✅ Completo

Conectado y verificado en vivo. De paso corrigió el typo "al_erta" del mock y reemplazó "Mantenimientos Pendientes" (sin dato real detrás) por "Calibraciones Pendientes". Encontró un hueco real: no existe endpoint para dar de baja un equipo — ver Prompt 6b.

### Prompt 6b — Dar de baja un equipo [BACKEND] ✅ Completo

`DELETE /equipment/:id` agregado, mismo patrón que employees (soft delete, columna `active`, `findAll` excluye inactivos por defecto). Verificado en vivo. Encontró el mismo hueco que 6c corrige: sin forma de reactivar, tuvieron que restaurar un dato demo borrado por accidente con SQL directo.

### Prompt 6c — Reactivar empleados y equipos [BACKEND] ✅ Completo

`active` ahora se puede mandar en PATCH /employees/:id y PATCH /equipment/:id (excluido del POST vía `t.Composite`). Verificado en vivo el ciclo completo delete → reactivate en ambos módulos.

```
Ni employees ni equipment tienen forma de revertir un soft delete por
API — solo DELETE. Corrige ambos módulos: permite que el `active` boolean
se pueda mandar en el body de PATCH /employees/:id y PATCH /equipment/:id
(UpdateEmployeeUseCase / UpdateEquipmentUseCase ya existen, solo agrega
`active` como campo opcional al input y al repository.update). Restringe
el cambio de `active` al mismo requireRole que ya protege esas rutas
(admin/supervisor/bpm_admin). No hace falta un endpoint nuevo — reusa el
PATCH existente.
```

### Prompt 7 — Los 10 Formatos Diarios [FRONT] ✅ Completo

Las 10 páginas conectadas a `POST /daily-forms/:formType` vía un hook compartido (`useDailyFormSubmit`). Verificado en vivo: los 10 tipos devolvieron 201 contra el backend real (incluye el mapeo de carpeta `materias-primas` → `formType: materias_primas`), más un caso de 400 con `details` confirmando que el banner de error los renderiza. Registros de prueba limpiados de la base después.

```
Conecta las 10 páginas de src/app/formatos/* al endpoint genérico
POST /daily-forms/:formType (formType = temperatura|plagas|agua|residuos|
materias_primas|higiene|almacenamiento|transporte|instalaciones|equipos).

Revisa src/modules/daily-forms/domain/daily-form-payload.schema.ts en el
backend (se movió ahí durante la migración a Clean Architecture, ya no
está en schemas.ts en la raíz del módulo): ahí está el shape exacto de
"payload" que espera cada tipo de formato — arma el payload en cada
página del front para que calce con ese schema (por ejemplo, temperatura
espera { equipos: [{ name, time, temp }] }).

Todas comparten { sedeId, formDate, shift?, observations?, payload }.
Reemplaza los `alert("(Mock) ...")` de cada formulario por la llamada real
y muestra el estado de guardado (éxito/error) que ya existe visualmente en
el formulario de temperatura, replicado en los demás. Si el backend
devuelve 400 con `details` (errores de validación del payload por tipo),
muéstralos de forma legible en el formulario.

Hazlo formato por formato si prefieres revisar cada uno por separado en vez
de los 10 de una vez.
```

### Prompt 8 — Documentos Fijos, Anexos y Alertas/Programar [FRONT] ✅ Completo

Las 4 pantallas conectadas y verificadas en vivo, incluyendo el flujo completo de subida a S3 (probado contra un MinIO temporal ya que el `.env` de este entorno tenía un endpoint placeholder). Encontró una vulnerabilidad real: `POST /scheduled-events` no valida que `sedeId` pertenezca a la empresa del usuario — misma clase de bug que ya se corrigió en employees/equipment/daily-forms durante el endurecimiento de seguridad. Ver Prompt 8b: no es solo un parche puntual, es una señal de que ese barrido no cubrió todos los módulos.

### Prompt 8b — Auditoría de validación de sedeId en todos los módulos [BACKEND] ✅ Completo

La auditoría encontró el bug en 4 casos de uso, no solo el reportado: `CreateScheduledEventUseCase`, `UpdateScheduledEventUseCase`, `CreateAttachmentUseCase` y `CreateFixedDocumentUseCase` — todos corregidos inyectando `SedeRepository`. `employees`/`equipment`/`daily-forms` ya estaban protegidos. 4 aserciones de regresión nuevas agregadas al test de aislamiento multi-tenant (18 en total, todos pasando contra DB real). Con esto queda cerrado el pendiente de la aserción explícita de sedeId que había quedado abierto desde el endurecimiento de seguridad original.

```
Durante el endurecimiento de seguridad se corrigió que CreateEmployeeUseCase,
CreateEquipmentUseCase y CreateDailyFormUseCase no validaban que un sedeId
recibido del cliente perteneciera a la empresa del usuario autenticado
(vulnerabilidad de secuestro cross-tenant). Se acaba de encontrar el mismo
bug en CreateScheduledEventUseCase (src/modules/scheduled-events/), que
hoy deja pasar un sedeId ajeno y termina en un 500 sin manejar en vez de un
404 controlado.

Necesito una auditoría completa, no un parche puntual:
1. Revisa cada módulo bajo src/modules/ que tenga un caso de uso de
   creación o actualización que reciba sedeId en el input (grep por
   "sedeId" en application/*.use-case.ts).
2. Para cada uno que NO valide la pertenencia del sedeId vía SedeRepository
   (mismo patrón que CreateEmployeeUseCase), agrégalo: inyecta
   SedeRepository en el constructor, valida con
   sedeRepository.findById(companyId, sedeId) y lanza
   NotFoundError("Sede", "f") si no pertenece.
3. Corrige puntualmente CreateScheduledEventUseCase con ese mismo patrón.
4. Reporta al final la lista completa de módulos auditados: cuáles ya
   estaban protegidos, cuáles tenían el bug y se corrigieron, y cuáles no
   aplican (no reciben sedeId).
5. Si el test de aislamiento multi-tenant existente (el que encontró el bug
   original) no cubre scheduled-events explícitamente, agrégale una
   aserción para este caso específico — no dejes que dependa de que
   alguien lo note por accidente otra vez.
```

```
Conecta:
1. src/app/documentos/page.tsx -> GET /fixed-documents
2. src/app/anexos/page.tsx -> GET /attachments (agrupa por `category` en
   el front tal como se ve hoy con datos mock)
3. src/app/anexos/subir/page.tsx -> flujo de 2 pasos: primero
   POST /attachments/upload-url con { fileName, contentType } para obtener
   una uploadUrl prefirmada, sube el archivo con fetch PUT directo a esa
   URL, y luego POST /attachments con los metadatos + fileKey/fileUrl
   devueltos.
4. src/app/alertas/programar/page.tsx -> POST /scheduled-events

El visor de PDF (src/app/visor) puede quedar mock por ahora; solo actualiza
el link "Ver PDF" / "Descargar" de documentos y anexos para que abra
fileUrl en una pestaña nueva en vez de navegar a /visor con datos falsos.
```

---

## Fase 2 — Funcionalidades del Checklist Maestro (pendientes/en desarrollo)

Cada uno de estos ya tiene su tabla en `src/db/schema/` (backend) — construye la API y luego la pantalla del front. El backend usa una arquitectura en capas (domain/application/infrastructure/http). **Lee `ARCHITECTURE.md` antes de implementar cualquiera de estos prompts** y sigue el mismo patrón de los módulos ya migrados (`src/modules/employees/` como referencia principal; `src/modules/dashboard/` como referencia si el módulo es una agregación de solo lectura en vez de un CRUD). En concreto, cada módulo nuevo debe traer:

- `domain/<entidad>.entity.ts` + `domain/<entidad>.repository.ts` (entidades y puerto de repositorio, sin Drizzle ni Elysia).
- `application/*.use-case.ts` (un caso de uso por operación, recibe el repositorio por constructor, lanza errores de `src/shared/errors.ts`) + `application/index.ts`.
- `infrastructure/<entidad>.drizzle-repository.ts` (implementación Drizzle del puerto).
- `http/<modulo>.schema.ts` (validación TypeBox del shape HTTP) + `http/<modulo>.routes.ts` (composition root: instancia repositorio + casos de uso, usa `toScope(user!)` y `mapError(err, set)`).
- Registro en `src/index.ts` importando desde `./modules/<modulo>/http/<modulo>.routes`.

No repitas el patrón viejo de un único `<modulo>.routes.ts` con lógica de negocio y queries de Drizzle mezcladas en el mismo archivo.

### Prompt 9 — Proveedores [BACKEND] ✅ Completo

Módulo completo (domain/application/infrastructure/http), plan-gating vía `requireSuppliersPlan` en los 7 casos de uso (incluido el listado, no solo escritura), reutiliza el flujo de upload-url de attachments para documentos en vez de reimplementarlo. Aislamiento multi-tenant (supplierId ajeno → 404) y plan-gating (básico → 403) cubiertos con aserciones explícitas en `multi-tenant-isolation.test.ts`. Suite completa: 21/21.

```
Implementa el módulo de Proveedores en src/modules/suppliers/ siguiendo la
arquitectura en capas descrita en ARCHITECTURE.md (domain/application/
infrastructure/http), con src/modules/employees/ como referencia principal.
Usa las tablas suppliers, supplier_documents y supplier_evaluations
(src/db/schema/suppliers.ts). Monta las rutas en src/index.ts importando
desde ./modules/suppliers/http/suppliers.routes, con prefix /suppliers.

Rutas necesarias:
- GET /suppliers, GET /suppliers/:id, POST /suppliers, PATCH /suppliers/:id
- POST /suppliers/:id/documents (registrar certificación con fileKey/fileUrl,
  igual que el flujo de /attachments/upload-url — reutiliza el StoragePort/
  S3StorageAdapter de src/modules/attachments/infrastructure/ en vez de
  reimplementarlo)
- POST /suppliers/:id/evaluations (registrar evaluación/score)
- GET /suppliers/:id/evaluations

Esta es una feature de plan Pro/Plus (ver src/config/plans.ts,
feature "proveedores") — agrega la verificación como parte del caso de uso
correspondiente (no en la ruta): si la company tiene plan "basico", lanza
un ForbiddenError con un mensaje claro de que necesita upgrade (se traduce
a 403 vía mapError).
```

### Prompt 10 — Trazabilidad y Recall [BACKEND] ✅ Completo

Módulo completo, `expiryStatus` calculado en `ListLotsUseCase` reutilizando `getVigenciaStatus`. Plan-gating en los 4 endpoints y aislamiento multi-tenant (recall sobre lote ajeno → 404, resuelto vía JOIN contra `lots` ya que `recalls` no tiene companyId/sedeId propio) cubiertos con tests explícitos. Suite completa: 23/23.

```
Implementa src/modules/traceability/ siguiendo la arquitectura en capas de
ARCHITECTURE.md (domain/application/infrastructure/http, igual que
src/modules/employees/), usando las tablas lots y recalls
(src/db/schema/traceability.ts):
- GET /lots (filtra por vencer pronto con un query param ?expiringInDays=N)
- POST /lots
- POST /lots/:id/recall (crea un recall vinculado y marca el lote como
  "retirado")
- GET /recalls

Es feature de plan Pro/Plus ("trazabilidad_recall"). Prioriza que el caso
de uso ListLotsUseCase calcule un campo `expiryStatus`
(vigente/por_vencer/vencido) igual que ya hacen employees/equipment con
getVigenciaStatus (src/lib/dates.ts) — esa lógica va en application/, no en
la ruta ni en el repositorio.
```

### Prompt 11 — No Conformidades y CAPA [BACKEND + FRONT] ✅ Completo

Backend completo: `CloseNonConformityUseCase` exige `corrective_action` para cerrar (400 sin ella), plan-gating en los 8 endpoints de `/non-conformities` + `/incidents`, aislamiento multi-tenant. Todo cubierto con tests (26/26). Front verificado en navegador real (no solo curl): crear no conformidad, intentar cerrar sin acción correctiva (bloqueado con mensaje claro), cerrar con acción correctiva (`status: "cerrada"` + `closedAt`) — los 3 pasos confirmados en vivo.

**Hallazgo importante en esta verificación:** el cambio de CORS dinámico (ver "Estado actual") no incluía `localhost:3002` (puerto real del front) en el `FRONTEND_URLS` del `.env` en uso, así que **todas** las pantallas de la Fase 1 estuvieron devolviendo error de CORS en un navegador real — invisible hasta ahora porque las verificaciones previas se hicieron con `curl`, que no aplica CORS. Ya corregido (se agregó el puerto y se reinició el backend); como el CORS se aplica globalmente en `src/index.ts`, el fix cubre toda la app, no hace falta repetirlo por módulo. **Lección para el resto del roadmap: los prompts de front necesitan confirmarse con click-through real en navegador, no solo con curl.**

```
Backend: implementa src/modules/quality/ con non_conformities e incidents
(src/db/schema/qualityEvents.ts), siguiendo la arquitectura en capas de
ARCHITECTURE.md. Rutas CRUD estándar + un endpoint
PATCH /non-conformities/:id/close que exija corrective_action no vacío
antes de permitir status=cerrada (esa validación va en
CloseNonConformityUseCase, lanzando ValidationError si falta). Feature de
plan Pro/Plus ("no_conformidades").

Front: crea una página nueva src/app/no-conformidades/page.tsx (agrégala
al Sidebar, src/components/layout/Sidebar.tsx) con una tabla de no
conformidades abiertas/cerradas y un formulario para crear una nueva,
pudiendo originarla manualmente o (más adelante) desde un formato diario
con hallazgos negativos.
```

### Prompt 12 — Motor de alarmas y notificaciones [BACKEND] ✅ Completo

`CheckAlertsUseCase` recorre empresas activas y reutiliza los repositorios existentes de employees/equipment/scheduled-events (sin duplicar queries), con dedup por `referenceTable+referenceId+status=pendiente`. Job en `src/jobs/check-alerts.ts` con intervalo configurable vía `CHECK_ALERTS_INTERVAL_MS` (default 1h). Envío real por WhatsApp/push queda como TODO documentado (pendiente de proveedor/presupuesto). Aislamiento multi-tenant cubierto con test. Suite completa: 27/27.

```
Implementa src/modules/notifications/ siguiendo la arquitectura en capas de
ARCHITECTURE.md para GET /notifications y PATCH /notifications/:id/read
(domain/application/infrastructure/http, igual que los demás módulos).

Además, un CheckAlertsUseCase en application/ (reutilizando
EmployeeRepository, EquipmentRepository y ScheduledEventRepository ya
existentes — no dupliques queries de Drizzle) que:
1. Recorra employees con medicalExamExpiry venciendo en <=30 días o ya
   vencido y cree una fila en `notifications` (src/db/schema/notifications.ts)
   si no existe ya una notificación pendiente para ese employee+fecha.
2. Haga lo mismo para equipment.nextCalibrationDate.
3. Haga lo mismo para scheduled_events con proposedDate próxima.
Evita duplicar notificaciones (verifica si ya existe una con el mismo
referenceTable+referenceId+status=pendiente antes de insertar).

Ejecuta ese caso de uso desde un job programado (setInterval/cron en
src/jobs/check-alerts.ts, corrido desde src/index.ts al iniciar, o
documenta cómo correrlo como proceso aparte con `bun run` + cron del SO) —
el job solo debe instanciar los repositorios y llamar
checkAlerts.execute(), sin lógica de negocio propia.

Deja el envío real por WhatsApp/push como TODO documentado (es integración
con un proveedor externo tipo Twilio/WhatsApp Business API, decidir cuál
cuando haya presupuesto para eso).
```

### Prompt 13 — Capacitación detallada [BACKEND + FRONT] ✅ Completo

`CreateTrainingUseCase` inserta la capacitación y suma `trainingHoursCompleted` en la misma transacción. Front: modal de historial + alta desde `personal/page.tsx`, actualiza horas sin recargar. Aislamiento multi-tenant cubierto (29/29 en la suite). Verificado en navegador real: capacitación creada, horas actualizadas en la tabla sin reload.

```
Backend: agrega src/modules/trainings/ (tabla trainings en
src/db/schema/trainings.ts) siguiendo la arquitectura en capas de
ARCHITECTURE.md: POST /employees/:id/trainings, GET /employees/:id/trainings.
El caso de uso CreateTrainingUseCase debe depender tanto de
TrainingRepository como de EmployeeRepository (del módulo employees) para
actualizar employees.trainingHoursCompleted sumando las horas del nuevo
registro, en la misma transacción si es posible.

Front: en src/app/personal/page.tsx, al hacer clic en un empleado, muestra
(modal o página de detalle nueva) el historial de capacitaciones y un
formulario para agregar una nueva.
```

### Prompt 14 — Checklist Maestro como feature interna (BPM Consulting) [BACKEND + FRONT] ✅ Completo

Backend completo: `GET /checklist/catalog` (público), `GET`/`PATCH /companies/:companyId/checklist-status` (solo bpm_admin), rol bloqueado con tests explícitos. Verificando esto se encontró un bug real y más amplio: 6 endpoints "naked" (`GET /employees`, `/equipment`, `/notifications`, `/scheduled-events`, `/daily-forms`, `/dashboard/summary`) devolvían 500 crudo sin pasar por `mapError` cuando `bpm_admin` (companyId null) los llamaba — filtrando el mensaje interno. Corregido con un `.onError` global (`src/plugins/error-handler.ts`) que reutiliza `mapError`, con logging server-side + 500 sanitizado para errores realmente inesperados. Se detectó y corrigió en el proceso una regresión real (el handler global inicialmente interceptaba también los 422 nativos de validación TypeBox) antes de reportar como terminado. Suite completa: 44/44. Front (`src/app/admin/checklist/page.tsx` + Sidebar condicional) verificado en navegador real: cambio de estado de un ítem guardado correctamente.

```
Esto es para el equipo de BPM Consulting, no para el cliente final: una
pantalla donde el staff (role bpm_admin) vea, para cada empresa cliente,
el avance sobre el catálogo ya sembrado en checklist_catalog (ver
src/db/seed-data/checklist-maestro.ts) usando company_checklist_status
(src/db/schema/checklist.ts).

Backend: src/modules/checklist/ siguiendo la arquitectura en capas de
ARCHITECTURE.md, con:
- GET /checklist/catalog (todo el catálogo, público para cualquier
  usuario autenticado)
- GET /companies/:companyId/checklist-status (requiere role bpm_admin)
- PATCH /companies/:companyId/checklist-status/:itemId (actualiza
  status/notes, solo bpm_admin)

Front: nueva sección solo visible si el usuario logueado tiene
role=bpm_admin (agrega esa condición en el Sidebar), con un selector de
empresa cliente y una tabla del checklist agrupada por categoría, coloreada
por estado, igual a como se ve hoy en el Excel "Checklist Maestro".
```

### Prompt 15 — Firma electrónica [BACKEND] ✅ Completo

Firma con hash SHA-256, usada automáticamente al aprobar un documento fijo (`ApproveFixedDocumentUseCase`, en la misma transacción). El acceso a `/signatures` no es solo `requireAuth` — verifica pertenencia de la entidad por `entityType` (registro explícito con fail-closed: `fixed_document` y `non_conformity` soportados, cualquier otro tipo devuelve 400 en vez de exponer datos por defecto). Aislamiento multi-tenant cubierto. Suite completa: 52/52.

```
Implementa src/modules/signatures/ (tabla signatures en
src/db/schema/signatures.ts) siguiendo la arquitectura en capas de
ARCHITECTURE.md:
- POST /signatures con { entityType, entityId } — toma el usuario del JWT,
  la IP de la request, genera un hash SHA-256 del entityType+entityId+
  userId+timestamp (usa Bun.hash o crypto.subtle), y lo guarda.
- GET /signatures?entityType=X&entityId=Y para listar el historial de
  firmas de una entidad (ej. un fixed_document o un cierre de no
  conformidad).

Úsalo en fixed-documents: al aprobar un documento (PATCH
/fixed-documents/:id/approve, que ya existe), crea también una firma
automáticamente para dejar la auditoría completa — agrega SignatureRepository
como dependencia de ApproveFixedDocumentUseCase (src/modules/fixed-documents/
application/), no llames a /signatures por HTTP desde el propio backend.
```

### Prompt 16 — Reporte estilo acta de inspección (PDF) [BACKEND] ✅ Completo

`GenerateInspectionReportUseCase` agrega companies/sedes/daily-forms/quality/notifications sin duplicar queries. PDF generado con `pdf-lib`, subido vía `StoragePort`/`S3StorageAdapter`. Plan-gating + aislamiento multi-tenant (sedeId ajeno → 404) cubiertos con tests unitarios (fakes) e integración. Verificado de punta a punta contra un MinIO real agregado como infraestructura permanente de desarrollo (`docker-compose.yml`, servicio `minio` + `minio-init`) — PDF real descargado y confirmado válido con contenido coherente (encabezado, formatos diligenciados, no conformidades, alertas, firmas). De paso se encontraron y mataron varios procesos `bun` zombis de sesiones anteriores que interceptaban puertos con `.env` viejo — probable causa del misterio sin resolver del puerto 3000. Suite completa: 59/59.

```
Agrega src/modules/reports/ con POST /reports/inspection-report, que reciba
{ sedeId, from, to }. Este módulo es una agregación de solo lectura sobre
otros módulos (igual que src/modules/dashboard/ — ver ARCHITECTURE.md,
sección "cómo agregar un módulo nuevo" para el caso no-CRUD): el
GenerateInspectionReportUseCase (application/) depende de los repositorios
ya existentes de companies/sedes, daily-forms, quality (no conformidades) y
del CheckAlertsUseCase/repositorios de notifications, en vez de duplicar
queries de Drizzle. La generación del PDF en sí (usa una librería ligera
para Bun, ej. @react-pdf/renderer o pdf-lib) y la subida a S3 (reutiliza
StoragePort/S3StorageAdapter de attachments) van en infrastructure/. Con
los datos de la empresa/sede, resumen de formatos diligenciados en el
rango, no conformidades abiertas y alertas activas, modela el PDF como un
acta de inspección de la Secretaría de Salud de Bogotá (pide el modelo de
referencia si no lo tienes, o genera una estructura razonable con
encabezado, tabla de hallazgos y firma). Devuelve la URL del PDF subido.
Feature de plan Pro/Plus ("reporte_acta_inspeccion").
```

---

## Fase 3 — Multi-sede, planes y despliegue

### Prompt 17 — Panel multi-sede (plan Plus) [FRONT]

```
Agrega un selector de sede en el header/sidebar (src/components/layout/)
visible solo si GET /sedes devuelve más de una sede para la empresa
logueada. Al cambiar de sede, todas las pantallas (personal, infraestructura,
formatos, etc.) deben filtrar por esa sede — hoy el backend ya lo hace
automáticamente vía el JWT si el usuario tiene sedeId fijo, pero un admin
con sedeId=null ve todas las sedes mezcladas; agrega un query param ?sedeId=
que el front mande explícitamente cuando el usuario elige una sede del
selector, y ajusta los endpoints del backend (employees, equipment,
daily-forms, etc.) para aceptar ese query param opcional y refinar el
AccessScope (ver toScope en src/shared/domain/to-scope.ts) cuando venga
presente.
```

### Prompt 18 — Dockerizar y preparar despliegue [BACKEND]

```
Crea un Dockerfile multi-stage para este backend Bun+Elysia (imagen final
basada en oven/bun), un docker-compose.yml con servicios app+postgres para
desarrollo/staging, y un script scripts/deploy-migrate.sh que corra
`bun run db:migrate` antes de levantar la app (para usar en el paso de
release de cualquier plataforma - Railway, Render, Fly.io). Documenta en
el README qué variables de entorno son obligatorias en producción.

Ten en cuenta que el rate limiter de auth (src/plugins/rate-limit.ts o
donde haya quedado) es en memoria — si vas a correr más de una instancia
del backend, anota en el README que hay que moverlo a un store compartido
(ej. Redis) antes de escalar horizontalmente, no lo implementes en este
prompt.
```

---

## Fase 4 — Seguridad

### Prompt 19 — Migrar el front a almacenamiento seguro de refresh tokens [FRONT] ✅ Completo

Implementado con patrón BFF: Route Handlers de Next.js (`/api/auth/{login,refresh,logout}`) son los únicos que ven el refresh token, seteado como cookie `HttpOnly; Secure; SameSite=Strict`. Access token solo en memoria en el cliente, nunca en localStorage. Verificado end-to-end contra el backend real (login, rotación de cookie, revocación en logout). Ya se puede seguir con los Prompts 4-8 sin el riesgo de deslogueo cada 15 min.

<details>
<summary>Prompt original (referencia, ya no hace falta repetirlo)</summary>

```
El backend (Alimentia) cambió su esquema de autenticación como parte de un
endurecimiento de seguridad previo al módulo de pagos:

- POST /auth/login ahora devuelve { token, refreshToken, user }. `token` es
  un access token JWT de vida corta (15 min, ver JWT_EXPIRES_IN) — ya no
  dura 7 días como antes.
- La sesión larga vive en `refreshToken` (opaco, no JWT). Nuevo
  POST /auth/refresh recibe { refreshToken } y devuelve un nuevo
  { token, refreshToken } (rotación: el refresh token recibido queda
  invalidado, hay que guardar el nuevo).
- Nuevo POST /auth/logout recibe { refreshToken } y lo revoca del lado del
  servidor.

Hoy src/lib/api.ts (creado en el Prompt 3 de este mismo archivo) guarda el
token en localStorage indefinidamente y no maneja expiración ni refresh.
Con un access token de 15 minutos eso ya no alcanza. Necesito que:

1. Al hacer login, guardes `token` en memoria (o un store tipo Zustand/
   contexto de React, NO localStorage) y `refreshToken` en el almacenamiento
   más seguro que el front actual permita — idealmente una cookie httpOnly
   seteada por un backend-for-frontend (ej. una API route de Next.js que
   haga de proxy a /auth/login y setee la cookie con `Set-Cookie:
   HttpOnly; Secure; SameSite=Strict`), ya que el Elysia actual no setea
   cookies y el front hoy es 100% cliente. Si implementar ese proxy es
   mucho para este prompt, como mínimo saca el refreshToken de localStorage
   y usa sessionStorage + una advertencia visible en el PR de que sigue
   siendo vulnerable a XSS (es una mejora intermedia, no la solución final).
2. Antes de cada llamada autenticada, si el access token expiró (o al
   recibir un 401), llames a POST /auth/refresh con el refreshToken
   guardado, actualices ambos tokens, y reintentes la request original una
   vez. Si el refresh también falla (refreshToken revocado/expirado),
   redirige a /login y limpia todo el estado de sesión.
3. Al hacer logout, llames a POST /auth/logout con el refreshToken actual
   antes de limpiar el estado local (para que quede revocado en el
   servidor, no solo olvidado en el cliente).

No toques las pantallas ya conectadas (dashboard, personal, etc.) — esto es
únicamente el cliente de autenticación en src/lib/api.ts y el flujo de
login/logout.
```

</details>

---

## Fase 5 — Pagos (bloqueada, falta elegir procesador)

Decidido: checkout hospedado (Stripe/Wompi/PayU/MercadoPago), el backend nunca toca datos de tarjeta. Falta elegir el procesador concreto — cada uno tiene su propio esquema de firma de webhooks y SDK, así que el prompt del módulo de pagos se escribe recién ahí. Cuando lo decidas, dime cuál y armamos:

- Tabla de suscripciones/facturas (vinculada a `companies.plan`).
- Endpoint de webhook con verificación de firma del proveedor + idempotencia.
- Actualización del plan de la empresa cuando el pago se confirma/falla/se cancela.
- Registro en `audit_log` de cada evento de pago.

---

## Notas para priorizar

Del Checklist Maestro, ya cubierto: cumplimiento normativo base (Fase 1), arquitectura limpia y seguridad (JWT corto + refresh, rate limiting, audit log, aislamiento multi-tenant testeado, cabeceras de seguridad, validación de secretos).

Prioridad **Alta** y aún **Pendiente**: trazabilidad/recall (prompt 10), CAPA (prompt 11), alarmas (prompt 12), firma electrónica (prompt 15), reporte de inspección (prompt 16), panel multi-sede (prompt 17), backups automáticos y habeas data (Ley 1581/2012 — sin prompt todavía, pídelo cuando tengas definido el proveedor de hosting/backup), y el módulo de pagos (Fase 5, bloqueado en elegir procesador).
