import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env";
import * as schema from "./schema";

// Exportado (no solo usado internamente) para que los tests de integración
// puedan cerrar el pool al final (`queryClient.end()`) y bun test no quede
// colgado esperando conexiones abiertas.
export const queryClient = postgres(env.databaseUrl);

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;

// Subconjunto de Db que también satisface `tx` dentro de un db.transaction(...)
// (PgTransaction no trae $client, pero sí select/insert/update/delete con la
// misma firma). Los repositorios que necesitan poder correr atómicamente
// junto con otro repositorio (ver TrainingRepository/EmployeeRepository y
// CreateTrainingUseCase) reciben este tipo en el constructor en vez de Db,
// para poder aceptar tanto el `db` global como un `tx` de transacción.
export type DbClient = Pick<Db, "select" | "insert" | "update" | "delete">;
