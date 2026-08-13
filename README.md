# Alimentia — Backend

API de Alimentia (BPM Consulting): plataforma de cumplimiento sanitario, formatos diarios y documentación para establecimientos de alimentos. Backend con **Elysia + Bun**, PostgreSQL (**Drizzle ORM**) y almacenamiento de archivos S3-compatible.

Este backend sirve al front en `../Plataforma documentos` (Next.js).

## Stack

- **Runtime/Framework:** Bun + Elysia
- **Base de datos:** PostgreSQL vía Drizzle ORM
- **Auth:** JWT (`@elysiajs/jwt`) + hashing nativo de Bun (argon2id)
- **Archivos:** cualquier S3-compatible (AWS S3, Cloudflare R2, MinIO) vía URLs prefirmadas
- **Docs:** Swagger autogenerado en `/docs`

## Puesta en marcha

```bash
bun install
cp .env.example .env   # completa DATABASE_URL, JWT_SECRET y credenciales S3
bun run db:generate     # genera migraciones a partir del schema
bun run db:migrate      # aplica migraciones a tu Postgres
bun run db:seed         # crea catálogo de checklist + usuarios/empresa demo
bun run dev             # http://localhost:3001 (docs en /docs)
```

Tras el seed quedan creados:
- `staff@bpmconsulting.co` / `CambiaEstaClave123!` — rol `bpm_admin` (staff de BPM Consulting, sin empresa fija)
- `admin@lacosecha.demo` / `CambiaEstaClave123!` — admin de la empresa demo "Restaurante La Cosecha S.A.S." (plan Pro)

**Cambia esas contraseñas o bórralas antes de ir a producción.**

## Arquitectura

Alimentia es un **SaaS multi-cliente**, no una app de un solo restaurante (ver `Alimentia Plan Comercial.xlsx`):

```
company (cliente de BPM Consulting)
  └─ plan: basico | pro | plus        (feature-gating, ver src/config/plans.ts)
  └─ businessProfile: restaurante_general | carnicos | bodega_almacenamiento | ambulantes
  └─ sede (sucursal/punto de venta) — Básico=1, Pro=3, Plus=5 incluidas
       └─ employees, equipment, daily_forms, scheduled_events...
```

Los usuarios tienen un `role` (`bpm_admin` | `admin` | `supervisor` | `operario`). `bpm_admin` es staff de BPM Consulting sin `companyId` fijo (soporte/onboarding multi-cliente); `admin` gestiona su empresa completa (`sedeId = null` = acceso a todas sus sedes); `supervisor`/`operario` normalmente están atados a una sede.

Cada request autenticado trae en el JWT `{ sub, companyId, sedeId, role }`. El helper `scopeFilter()` (`src/lib/scope.ts`) filtra automáticamente por sede si el usuario tiene una asignada, o por toda la empresa si no (admins).

### Módulos implementados (Fase 1 — igual al front actual)

| Módulo | Ruta base | Corresponde a (front) |
|---|---|---|
| Auth | `/auth` | login, creación de usuarios |
| Companies | `/companies/me` | `src/app/settings` |
| Sedes | `/sedes` | multi-sede (nuevo, aún sin pantalla en el front) |
| Employees | `/employees` | `src/app/personal` |
| Equipment | `/equipment` | `src/app/infraestructura` |
| Daily Forms | `/daily-forms/:formType` | `src/app/formatos/*` (10 tipos) |
| Fixed Documents | `/fixed-documents` | `src/app/documentos` |
| Attachments | `/attachments` | `src/app/anexos` |
| Scheduled Events | `/scheduled-events` | `src/app/alertas/programar` |
| Dashboard | `/dashboard/summary` | `src/app/page.tsx` |

### Schema ya creado, pendiente de exponer en API (Fase 2 — ver `Alimentia Checklist Maestro.xlsx`)

Las tablas ya existen en `src/db/schema/` para que las migraciones no se rehagan luego, pero **no tienen rutas todavía**. Ver `PROMPTS.md` para construirlas con Claude Code, módulo por módulo:

- `suppliers.ts` — proveedores, certificaciones, evaluación/scorecard
- `traceability.ts` — lotes, vencimientos, recall
- `qualityEvents.ts` — no conformidades (CAPA), incidentes
- `notifications.ts` — motor de alarmas (vencimientos, push/WhatsApp)
- `trainings.ts` — detalle de capacitaciones por empleado
- `checklist.ts` — catálogo maestro (sembrado) + seguimiento por cliente
- `signatures.ts` — firma electrónica con auditoría
- `sensors.ts` — sensores IoT (plan Plus, no prioritario)

## Formatos diarios: por qué una sola tabla

`daily_forms` tiene una columna `payload: jsonb` en vez de 10 tablas separadas para los 10 formatos (temperatura, plagas, agua, residuos, materias primas, higiene, almacenamiento, transporte, instalaciones, equipos). La validación de cada tipo vive en `src/modules/daily-forms/schemas.ts` (un TypeBox schema por tipo) y se aplica en el handler según el `:formType` de la URL. Si un formato nuevo aparece en el checklist, se agrega un schema ahí — no una migración nueva.

## Almacenamiento de archivos (S3/MinIO) para desarrollo local

En producción `S3_*` apunta a un proveedor real (AWS S3, Cloudflare R2). Para desarrollo local, `docker-compose.yml` incluye un servicio MinIO con credenciales fijas de desarrollo, para no depender de un bucket real ni levantar un MinIO temporal cada vez que hay que probar un flujo de S3 de verdad (adjuntos, o el PDF de `reports`):

```bash
docker compose up -d minio minio-init   # minio-init crea el bucket y termina (no es un servicio persistente)
```

Copia el bloque de desarrollo local de `.env.example` en tu `.env`:

```
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=plataforma-documentos
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_PUBLIC_URL=http://localhost:9000/plataforma-documentos
```

- Consola web de MinIO: http://localhost:9001 (login `minioadmin` / `minioadmin`) — útil para ver/borrar archivos subidos a mano.
- El bucket queda con lectura pública (`mc anonymous set download`) porque `publicUrlFor` (`src/lib/s3.ts`) arma URLs públicas directas, no prefirmadas de descarga — igual que tendría que estar configurado el bucket real en producción.
- El volumen `plataforma_documentos_minio_data` persiste los archivos entre reinicios de `docker compose`; bórralo (`docker compose down -v`) si necesitas empezar de cero.

## Feature-gating por plan

`src/config/plans.ts` mapea cada plan a las funcionalidades habilitadas (`PLAN_FEATURES`) y a las sedes incluidas (`PLAN_SEDES_INCLUDED`), reflejando exactamente la tabla de "Alimentia Plan Comercial.xlsx". Cuando se construyan los módulos de Fase 2, cada ruta debe verificar `planHasFeature(company.plan, "trazabilidad_recall")` (por ejemplo) antes de permitir el acceso.

## Despliegue en EC2 (Ubuntu 24.04)

Arquitectura del despliegue: **Nginx nativo** en el EC2 (termina TLS, puertos 80/443) → **contenedor Docker** de la app (puerto interno, solo `127.0.0.1`) → **RDS Postgres** externo (no hay Postgres en el EC2) → **S3** real para archivos. Aún no hay dominio propio: el certificado HTTPS se emite sobre el DNS público que AWS asigna al EC2 (`ec2-x-x-x-x.<región>.compute.amazonaws.com`), y se vuelve a emitir sobre el dominio real cuando esté disponible.

Archivos relevantes:
- `Dockerfile` — build multi-stage (deps de producción + runtime `oven/bun` slim, sin devDependencies).
- `docker-compose.prod.yml` — un solo servicio (`app`), sin Postgres/MinIO locales. Lee variables desde `.env` (no commiteado).
- `deploy/nginx/alimentia-backend.conf` — config de Nginx (reverse proxy).
- `scripts/deploy-migrate.sh` — corre `bun run db:migrate` contra RDS antes de levantar la app.

> `docker-compose.yml` (sin sufijo) sigue siendo el de **desarrollo local** (Postgres + MinIO). No se usa en producción.

### Checklist de variables de entorno de producción (`.env` en el EC2)

Crear a mano en el EC2, nunca commitear. Basado en `.env.example`, con estos valores obligatorios para producción:

| Variable | Valor en producción | Notas |
|---|---|---|
| `NODE_ENV` | `production` | Activa las validaciones estrictas de `src/config/env.ts` (JWT_SECRET, FRONTEND_URLS). |
| `PORT` | `3001` | Debe calzar con el mapeo de puertos en `docker-compose.prod.yml` y con `proxy_pass` en el nginx conf. |
| `FRONTEND_URLS` | `https://<tu-proyecto>.vercel.app` | **Exactamente un** origen, sin `localhost`/`127.0.0.1` — el server rechaza arrancar si no se cumple. Actualizar cuando el front tenga dominio propio. |
| `DATABASE_URL` | `postgres://<usuario>:<password>@<endpoint-rds>.rds.amazonaws.com:5432/<db>` | Apunta a **RDS**, no a un Postgres local. Usa `?sslmode=require` si el RDS lo exige. |
| `JWT_SECRET` | secreto aleatorio ≥32 caracteres (`openssl rand -base64 48`) | No puede ser el placeholder de `.env.example` — el server lo rechaza. |
| `JWT_EXPIRES_IN` | `15m` (o el valor que se use hoy) | Opcional, tiene default. |
| `REFRESH_TOKEN_EXPIRES_IN` | `30d` (o el valor que se use hoy) | Opcional, tiene default. |
| `CHECK_ALERTS_INTERVAL_MS` | `3600000` | Opcional, tiene default de 1 hora. |
| `S3_ENDPOINT` | endpoint real del proveedor (AWS S3, R2, etc.) | Pendiente: crear el bucket de producción. |
| `S3_REGION` | región real del bucket | Pendiente. |
| `S3_BUCKET` | nombre del bucket real | **Pendiente de crear** — hoy `.env.example` trae un placeholder. |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | credenciales de un usuario/rol con permisos mínimos sobre ese bucket | Pendiente. |
| `S3_PUBLIC_URL` | URL pública desde donde se sirven los archivos del bucket | Pendiente — depende del bucket final. |

### 1. Nginx + Certbot (correr una sola vez, nativo en el EC2 — Ubuntu 24.04)

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx

# Certbot vía el paquete de Ubuntu (plugin de nginx incluido)
sudo apt install -y certbot python3-certbot-nginx

# Copia la config del repo al sitio de nginx y reemplaza <EC2_PUBLIC_DNS>
# por el DNS público real (Consola EC2 > instancia > "Public IPv4 DNS").
sudo cp deploy/nginx/alimentia-backend.conf /etc/nginx/sites-available/alimentia-backend
sudo sed -i 's/<EC2_PUBLIC_DNS>/ec2-XX-XX-XX-XX.compute-1.amazonaws.com/' /etc/nginx/sites-available/alimentia-backend
sudo ln -s /etc/nginx/sites-available/alimentia-backend /etc/nginx/sites-enabled/alimentia-backend
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Emite el certificado sobre el DNS público del EC2 (reemplaza el mismo valor de arriba).
# Certbot reescribe el server{} de :80 agregando redirect a HTTPS + bloque :443.
sudo certbot --nginx -d ec2-XX-XX-XX-XX.compute-1.amazonaws.com
```

Verifica antes en el Security Group del EC2 que los puertos **80** y **443** estén abiertos a `0.0.0.0/0` (o al menos a internet), y que el puerto de la app (**3001**) **no** esté expuesto públicamente — solo debe ser alcanzable vía `127.0.0.1` (así está mapeado en `docker-compose.prod.yml`).

> **Gotcha real (nos pasó en el despliegue de julio 2026):** Let's Encrypt **rechaza por política** emitir certificados para el DNS público que asigna AWS (`*.compute.amazonaws.com`, `*.compute-1.amazonaws.com`, etc.) — está en su lista de dominios bloqueados para evitar abuso, ya que cualquiera puede obtener ese hostname al lanzar un EC2. El error es `...forbidden by policy`. No hay forma de evitarlo apuntando a ese hostname.
>
> Mientras no haya dominio propio, la salida es usar un servicio de "wildcard DNS sobre IP" como [sslip.io](https://sslip.io) o [nip.io](https://nip.io): `<ip-con-guiones>.sslip.io` resuelve automáticamente a esa IP (p. ej. la IP `3.19.160.203` → `3-19-160-203.sslip.io`) y **no** está bloqueado por Let's Encrypt, así que sí se puede emitir un certificado válido de verdad:
>
> ```bash
> # server_name en /etc/nginx/sites-available/alimentia-backend debe ser el
> # hostname sslip.io, no el DNS de AWS:
> sudo sed -i 's/server_name .*/server_name <ip-con-guiones>.sslip.io;/' /etc/nginx/sites-available/alimentia-backend
> sudo nginx -t && sudo systemctl reload nginx
>
> sudo certbot --nginx -d <ip-con-guiones>.sslip.io
> ```
>
> Actualiza `FRONTEND_URLS`/CORS y el `NEXT_PUBLIC_API_URL` del front para que apunten a `https://<ip-con-guiones>.sslip.io`. Cuando llegue el dominio real, se reemplaza este hostname siguiendo el mismo procedimiento de abajo ("Cuando llegue el dominio propio").

Cuando llegue el dominio propio: apunta el DNS a la IP del EC2, cambia `server_name` en `/etc/nginx/sites-available/alimentia-backend`, y vuelve a correr `sudo certbot --nginx -d tu-dominio-real.com` (certbot puede manejar múltiples certificados o reemplazar el actual).

#### Verificar que la renovación automática de Certbot quedó activa

El paquete `certbot` de Ubuntu instala un timer de systemd que corre la renovación dos veces al día, pero **no lo des por sentado** — verifícalo explícitamente después de emitir el certificado:

```bash
# Debe listar certbot.timer con estado "active" y una próxima ejecución (NEXT) cercana
sudo systemctl list-timers | grep certbot

# Si no aparece nada, el timer no está habilitado: habilítalo a mano
sudo systemctl enable --now certbot.timer

# Simula una renovación sin emitir un certificado real (no consume el rate
# limit de Let's Encrypt) — debe terminar con "The dry run was successful"
sudo certbot renew --dry-run
```

Si `certbot renew --dry-run` falla, revisa `sudo journalctl -u certbot.service` antes de dar por buena la instalación — un certificado que no se renueva solo expira en 90 días y tumba el HTTPS sin aviso.

### 2. Docker + Docker Compose (correr una sola vez, Ubuntu 24.04)

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Permite correr `docker` sin sudo (requiere cerrar sesión y volver a entrar por SSH)
sudo usermod -aG docker "$USER"
```

### 3. Llevar el código al EC2

Cualquiera de las dos opciones sirve:

```bash
# Opción A: clonar el repo directo en el EC2 (requiere acceso al remoto desde ahí)
git clone <url-del-repo> alimentia-backend
cd alimentia-backend

# Opción B: copiar los archivos desde tu máquina (sin dar acceso al repo al EC2)
rsync -avz --exclude node_modules --exclude .git --exclude .env \
  ./ ubuntu@<EC2_PUBLIC_DNS>:~/alimentia-backend/
```

### 4. Crear el `.env` de producción (a mano, nunca commiteado)

```bash
cd ~/alimentia-backend
nano .env   # completa todas las variables del checklist de arriba
chmod 600 .env
```

### 5. Migrar y levantar

```bash
./scripts/deploy-migrate.sh                       # aplica migraciones contra RDS
docker compose -f docker-compose.prod.yml up -d --build

docker compose -f docker-compose.prod.yml logs -f app   # ver que arrancó bien
curl http://127.0.0.1:3001/health                        # sanity check local
curl https://ec2-XX-XX-XX-XX.compute-1.amazonaws.com/health   # sanity check vía Nginx/HTTPS
```

Para desplegar una actualización más adelante: `git pull` (o volver a copiar archivos) → `./scripts/deploy-migrate.sh` (si hay migraciones nuevas) → `docker compose -f docker-compose.prod.yml up -d --build`.

## Notas

- Este proyecto se generó sin ejecutar `bun install` (el entorno donde se creó no tenía salida a internet). Ejecuta `bun install` y `bun run dev` en tu máquina como primer paso — si alguna versión de dependencia da un error de tipos, es lo primero que Claude Code debe arreglar (ver `PROMPTS.md`, prompt 1).
- Las contraseñas se hashean con `Bun.password` (argon2id nativo), no se agregó `bcrypt`.
- Los archivos (anexos, certificados, formatos firmados) no pasan por el backend: el front pide una URL prefirmada (`POST /attachments/upload-url`), sube directo a S3, y luego registra el archivo (`POST /attachments`). Este mismo patrón debe reutilizarse para adjuntos de `employees` y `equipment`.
