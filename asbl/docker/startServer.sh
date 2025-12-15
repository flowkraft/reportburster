#!/bin/bash
# =============================================================================
# ReportBurster Server - Docker Start Script
# =============================================================================
#
# This script:
# 1. Extracts default config files from the Docker image (first run only)
# 2. Starts the ReportBurster server and MailHog services
#
# =============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Define the image name
IMAGE="flowkraft/reportburster-server:10.2.0"

# Directories to copy from image on first run
DIRECTORIES=("backup" "config" "input-files" "logs" "output" "quarantine" "poll" "samples" "scripts" "_apps" "db")

# Check if config directory exists and is not empty (indicates first run)
if [ ! -d "config" ] || [ -z "$(ls -A config 2>/dev/null)" ]; then
    echo "First run detected - extracting default configuration from image..."
    
    # Create a temporary container to extract files
    CONTAINER_ID=$(docker create "$IMAGE")
    
    # Extract each directory from the container
    for DIR in "${DIRECTORIES[@]}"; do
        echo "  Extracting $DIR..."
        docker cp "$CONTAINER_ID:/app/$DIR" "./$DIR" 2>/dev/null || true
    done
    
    # Remove the temporary container
    docker rm "$CONTAINER_ID" > /dev/null
    
    echo "Configuration extracted successfully."
fi

# Clean up polling directory
if [ -d "poll" ]; then
    find poll -maxdepth 1 -name "*.pdf" -delete 2>/dev/null || true
    find poll -maxdepth 1 -name "*.xlsx" -delete 2>/dev/null || true
    find poll/received -name "*.pdf" -delete 2>/dev/null || true
    find poll/received -name "*.xlsx" -delete 2>/dev/null || true
fi

echo "Starting ReportBurster Server..."
docker compose up -d

echo ""
echo "ReportBurster Server is starting..."
echo "  Web UI:    http://localhost:9090"
echo "  MailHog:   http://localhost:8025"
echo ""
echo "Use 'docker compose logs -f' to view logs"