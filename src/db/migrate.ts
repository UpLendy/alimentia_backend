import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "../config/env";

// Ejecuta las migraciones generadas por `bun run db:generate` (drizzle-kit).
// Uso: bun run db:migrate

const migrationClient = postgres(env.databaseUrl, { max: 1 });
const db = drizzle(migrationClient);

console.log("Aplicando migraciones...");
await migrate(db, { migrationsFolder: "./src/db/migrations" });
console.log("Migraciones aplicadas correctamente.");
await migrationClient.end();
