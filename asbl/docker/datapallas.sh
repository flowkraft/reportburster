#!/bin/bash
set -euo pipefail

# Minimal CLI forwarder
# Usage: ./reportburster.sh <args...>
# For example: ./reportburster.sh -c config/my-config.xml --testlist entry1

COMPOSE_FILE="docker-compose.yml"
SERVICE_NAME="reportburster-server"

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <reportburster CLI args...>"
  echo "This script forwards the arguments to the 'reportburster' CLI inside the service container."
  exit 2
fi

# Forward args to the service's reportburster.sh CLI using docker compose
exec docker compose -f "$COMPOSE_FILE" run --rm "$SERVICE_NAME" reportburster.sh "$@"
