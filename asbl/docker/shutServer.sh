#!/bin/bash
# =============================================================================
# ReportBurster Server - Docker Stop Script
# =============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping ReportBurster Server..."
docker compose down

echo "ReportBurster Server stopped."