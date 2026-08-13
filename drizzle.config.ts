import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("[drizzle.config] DATABASE_URL no está definida. Carga tu archivo .env antes de ejecutar drizzle-kit.");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/plataforma_documentos",
  },
  verbose: true,
  strict: true,
});
