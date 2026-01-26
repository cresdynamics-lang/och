#!/bin/bash
# Stop Docker containers and start local Django server

set -e

cd "$(dirname "$0")"

echo "=========================================="
echo "Stopping Docker and Starting Local Server"
echo "=========================================="

# Stop Docker containers
echo "Stopping Docker containers..."
cd ../../backend
docker compose down
cd django_app

echo ""
echo "✅ Docker containers stopped"
echo ""

# Run the start script
bash start_server.sh

