#!/bin/bash
# =============================================================================
# ReportBurster Server - Clean Script
# =============================================================================
# Removes all data directories. Use with caution!
# After running this, the next startServer.sh will extract fresh defaults.
# =============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "This will remove ALL data directories. Are you sure? (y/N)"
read -r CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    echo "Stopping services first..."
    docker compose down 2>/dev/null || true
    
    echo "Removing data directories..."
    rm -rf backup/ config/ logs/ input-files/ output/ poll/ quarantine/ samples/ scripts/ _apps/ db/
    
    echo "Clean complete. Run startServer.sh to extract fresh defaults."
else
    echo "Cancelled."
fi