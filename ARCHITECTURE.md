# Arquitectura del backend

Este backend sigue una arquitectura en capas ("Clean Architecture" simplificada) dentro de cada módulo de negocio en `src/modules/*`. El objetivo es separar **qué hace el negocio** de **cómo se expone por HTTP** y **cómo se persiste en la base de datos**, para que cada pieza se pueda entender, testear y cambiar de forma aislada.

## Las 4 capas

Cada módulo (`src/modules/<nombre>/`) se organiza así:

```
modules/<nombre>/
  domain/           entidades, tipos y "puertos" (interfaces de repositorio)
  application/      casos de uso: la lógica de negocio en sí
  infrastructure/    implementaciones concretas de los puertos (Drizzle, S3, etc.)
  http/              schemas de validación HTTP + rutas Elysia (composition root)
```

### `domain/`

Contiene las entidades del negocio (`*.entity.ts`) y los **puertos**: interfaces que declaran QUÉ operaciones existen sobre esas entidades, sin decir CÓMO se implementan (`*.repository.ts`, y en casos especiales otros puertos como `storage.port.ts` en `attachments`).

- No importa nada de `drizzle-orm`, `elysia`, ni de `db/schema`. Es TypeScript puro.
- Puede definir tipos/schemas de validación que son **reglas de negocio** (no de transporte HTTP) — ver el caso de `daily-forms/domain/daily-form-payload.schema.ts`, donde el schema TypeBox de cada tipo de formato vive en domain porque valida una regla del negocio (qué campos debe tener un formato de "temperatura" vs uno de "agua"), no un detalle de la petición HTTP.
- Puede importar tipos de dominio de **otro módulo** cuando hay una relación real del negocio (ej. `sedes/application/create-sede.use-case.ts` depende de `companies/domain/company.repository.ts` para leer el plan de la empresa). Lo que nunca se importa entre módulos es `infrastructure/` de otro módulo salvo desde `http/` (el composition root).

### `application/`

Contiene los **casos de uso** (`*.use-case.ts`): clases con un método `execute(...)` que implementan la lógica de negocio (validaciones, orquestación, cálculo de campos derivados, control de errores de dominio).

- Reciben sus dependencias (repositorios, otros puertos) por **constructor** — nunca instancian `Drizzle...Repository` ellos mismos. Esto es lo que permite testearlos con un repositorio falso en memoria, sin base de datos.
- Solo conocen las interfaces de `domain/` (del propio módulo o de otro), nunca una clase concreta de `infrastructure/`.
- Lanzan errores de dominio (`NotFoundError`, `ValidationError`, `ForbiddenError`, `ConflictError` de `src/shared/errors.ts`) — nunca hacen `set.status = ...` ni saben que existe HTTP.
- Cada carpeta `application/` tiene un `index.ts` que reexporta todos los casos de uso del módulo, para que `http/*.routes.ts` los importe con una sola línea.

### `infrastructure/`

Implementaciones concretas de los puertos definidos en `domain/`.

- `*.drizzle-repository.ts`: implementa `*Repository` usando Drizzle ORM contra `src/db/schema.ts`. Es el único lugar del módulo que sabe que existe Postgres/Drizzle.
- Otros adaptadores de infraestructura, como `attachments/infrastructure/s3-storage.adapter.ts`, que implementa el puerto `StoragePort` envolviendo `src/lib/s3.ts`.
- Un módulo puede no tener `infrastructure/` propia si no persiste nada nuevo — ver `dashboard`, que reutiliza los repositorios Drizzle de `employees`, `equipment` y `daily-forms` en su composition root en lugar de duplicar queries.

### `http/`

La capa de entrada: rutas de Elysia y validación de la forma de la petición/respuesta HTTP.

- `*.schema.ts`: schemas TypeBox (`t.Object(...)`) que validan el **shape** de la petición HTTP (body/params/query). Distinto de los schemas de `domain/`, que validan **reglas de negocio**.
- `*.routes.ts`: es el **composition root** del módulo (ver más abajo) y el "controlador" — traduce HTTP a llamadas a casos de uso y casos de uso a respuestas/status codes HTTP. No contiene lógica de negocio.

## La regla de dependencia

Las flechas de dependencia solo apuntan "hacia adentro":

```
http  ──depends on──>  application  ──depends on──>  domain
infrastructure ──implements──>  domain
```

- `domain` no depende de nada externo (ni de otras capas, ni de librerías de framework/ORM).
- `application` solo depende de `domain` (del propio módulo o de otros módulos).
- `infrastructure` depende de `domain` (implementa sus interfaces) y de librerías externas (Drizzle, S3, etc.).
- `http` es la única capa que conoce tanto `application` como `infrastructure` — las conecta.

Esto significa que `domain/` y `application/` se pueden leer, entender y testear sin arrancar un servidor ni una base de datos.

## El patrón "composition root"

Cada `http/<modulo>.routes.ts` instancia, a nivel de módulo (una sola vez, al cargar el archivo), la infraestructura concreta y se la inyecta a los casos de uso:

```typescript
// modules/employees/http/employees.routes.ts
const repository = new DrizzleEmployeeRepository();
const listEmployees = new ListEmployeesUseCase(repository);
const getEmployee = new GetEmployeeUseCase(repository);
const createEmployee = new CreateEmployeeUseCase(repository);
// ...

export const employeesRoutes = new Elysia({ prefix: "/employees", tags: ["Employees"] })
  .use(requireAuth)
  .get("/", async ({ user }) => listEmployees.execute(toScope(user!)))
  .get("/:id", async ({ user, params, set }) => {
    try {
      return await getEmployee.execute(toScope(user!), params.id);
    } catch (err) {
      return mapError(err, set);
    }
  }, { params: t.Object({ id: t.String({ format: "uuid" }) }) })
  // ...
```

Si mañana un caso de uso necesita testearse con un repositorio en memoria, o la implementación de persistencia cambia, **solo este archivo cambia** — ninguna otra pieza del módulo se entera.

Piezas compartidas que todo módulo reutiliza (en `src/shared/`), en vez de recrear:

- `shared/domain/access-scope.ts` — `AccessScope { companyId, sedeId }`: a qué datos puede acceder quien hace la petición (multi-tenant).
- `shared/domain/to-scope.ts` — `toScope(user)`: traduce el JWT (`JwtPayload`) al `AccessScope` de dominio; lanza `ValidationError` si el usuario no tiene `companyId`.
- `shared/errors.ts` — jerarquía de errores de dominio (`DomainError`, `NotFoundError`, `ValidationError`, `ForbiddenError`, `ConflictError`).
- `shared/http/map-error.ts` — `mapError(err, set)`: el único lugar donde un error de dominio se traduce a status code HTTP.

El patrón para cada endpoint que puede fallar es siempre:

```typescript
try {
  const result = await someUseCase.execute(toScope(user!), ...);
  return { result };
} catch (err) {
  return mapError(err, set);
}
```

Los endpoints de solo lectura que no lanzan errores propios (p. ej. un `GET /` que simplemente filtra por scope) pueden omitir el `try/catch` — sigue el estilo del endpoint equivalente ya existente en el módulo antes de decidir si hace falta.

## Cómo agregar un módulo nuevo

Para un módulo CRUD estándar (ej. Fase 2: proveedores, trazabilidad, no conformidades):

1. **`domain/<entidad>.entity.ts`**: define la entidad (`interface`), y los tipos de entrada (`New<Entidad>Input`, `Update<Entidad>Input`).
2. **`domain/<entidad>.repository.ts`**: define el puerto `<Entidad>Repository` con los métodos que el negocio necesita (`findAll(scope)`, `findById(scope, id)`, `create(companyId, input)`, `update(scope, id, input)`, etc. — todos reciben `AccessScope` salvo `create`, que recibe `companyId` directamente porque no hay nada que buscar todavía).
3. **`application/<accion>.use-case.ts`** por cada operación (`list-*`, `get-*`, `create-*`, `update-*`, `delete-*`/`deactivate-*`): una clase con constructor que recibe el/los repositorio(s) por interfaz y un método `execute(...)` con la lógica de negocio y validaciones. Lanza `NotFoundError`/`ValidationError`/etc. de `shared/errors.ts` cuando corresponda. Agrega un `application/index.ts` que reexporte todos.
4. **`infrastructure/<entidad>.drizzle-repository.ts`**: implementa el repositorio con Drizzle contra `src/db/schema.ts`, incluyendo un helper `scopeCondition(scope)` que arma el `WHERE` a partir del `AccessScope`.
5. **`http/<modulo>.schema.ts`**: schemas TypeBox para el body/params de cada endpoint (validación de shape HTTP, no de negocio).
6. **`http/<modulo>.routes.ts`**: el composition root — instancia el repositorio y los casos de uso, define las rutas Elysia usando `requireAuth`/`requireRole`, `toScope(user!)` y `mapError(err, set)` en el `catch`.
7. Registra las rutas en `src/index.ts`: importa `{ <modulo>Routes } from "./modules/<modulo>/http/<modulo>.routes"` y agrega `.use(<modulo>Routes)`, más la entrada correspondiente en `tags` del swagger si quieres que aparezca agrupado en `/docs`.

Para un módulo que **no es CRUD** (agregación de solo lectura sobre otros módulos, como `dashboard`), no crees `infrastructure/` propia: el caso de uso recibe por constructor los repositorios ya existentes de los módulos de los que depende, y el composition root en `http/` los instancia y se los inyecta — así se reutiliza la lógica de acceso a datos en vez de duplicar queries.

No cambies el contrato HTTP (rutas, shape de request/response, status codes) al migrar o refactorizar un módulo existente — esa es la garantía que permite que el frontend no note ninguna diferencia.
