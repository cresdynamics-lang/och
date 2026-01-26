#!/bin/bash
# Script to verify all services are healthy and running

echo "=== Checking Docker Services Status ==="
docker ps -a --filter "name=ongozacyberhub" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Checking Django Health ==="
curl -f http://localhost:8000/health/ 2>/dev/null && echo "✅ Django healthy" || echo "❌ Django unhealthy"

echo ""
echo "=== Checking FastAPI Health ==="
curl -f http://localhost:8001/health 2>/dev/null && echo "✅ FastAPI healthy" || echo "❌ FastAPI unhealthy"

echo ""
echo "=== Django Container Logs (last 20 lines) ==="
docker logs ongozacyberhub_django 2>&1 | tail -20

echo ""
echo "=== Checking Database Connection ==="
docker exec ongozacyberhub_postgres psql -U postgres -d ongozacyberhub -c "SELECT 1;" 2>/dev/null && echo "✅ Database accessible" || echo "❌ Database not accessible"

echo ""
echo "=== Checking Redis Connection ==="
docker exec ongozacyberhub_redis redis-cli ping 2>/dev/null && echo "✅ Redis accessible" || echo "❌ Redis not accessible"
