# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: dependencias de producción (sin devDependencies: drizzle-kit,
# typescript, @types/bun no viajan a la imagen final).
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---------------------------------------------------------------------------
# Stage 2: runtime. Bun ejecuta los .ts directamente (no hace falta paso de
# build/transpile) — esta imagen solo trae node_modules de producción y el
# código fuente.
# ---------------------------------------------------------------------------
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# La imagen oficial de oven/bun ya trae un usuario "bun" (no-root) creado.
USER bun

EXPOSE 3001

CMD ["bun", "run", "start"]
