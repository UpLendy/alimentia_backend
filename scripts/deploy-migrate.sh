#!/usr/bin/env bash
# Corre las migraciones de Drizzle contra el Postgres de RDS, usando la
# misma imagen/entorno de producción (DATABASE_URL sale del .env de
# producción vía docker-compose.prod.yml). Pensado para correrse ANTES de
# `docker compose -f docker-compose.prod.yml up -d`.
#
# Uso (desde el EC2, parado en la raíz del repo):
#   ./scripts/deploy-migrate.sh
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE_FILE="docker-compose.prod.yml"

if [[ ! -f .env ]]; then
  echo "Error: no existe .env en $(pwd). Créalo antes de migrar (ver README.md, 'Despliegue en EC2')." >&2
  exit 1
fi

echo "Construyendo imagen (si hace falta) y aplicando migraciones contra RDS..."
docker compose -f "$COMPOSE_FILE" build app
docker compose -f "$COMPOSE_FILE" run --rm --no-deps app bun run db:migrate

echo "Migraciones aplicadas. Ahora puedes levantar la app:"
echo "  docker compose -f $COMPOSE_FILE up -d"
