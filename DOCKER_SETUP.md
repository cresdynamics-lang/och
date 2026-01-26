# Ongoza CyberHub - Docker Compose Setup

This docker-compose.yml orchestrates all services for the Ongoza CyberHub platform.

## Services

- **Django** (Port 8000) - Main backend API
- **FastAPI** (Port 8001) - AI/ML services and vector processing
- **Next.js** (Port 3000) - Frontend application
- **PostgreSQL** (Port 5434) - Relational database for Django
- **PostgreSQL Vector** (Port 5433) - Vector database for FastAPI
- **Redis** (Port 6379) - Caching and async task queue

## Quick Start

1. **Create a `.env` file** in the root directory (optional, uses defaults if not present):

```bash
# Database Configuration
POSTGRES_DB=ongozacyberhub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Django Configuration
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_PORT=8000

# FastAPI Configuration
FASTAPI_PORT=8001
VECTOR_POSTGRES_DB=ongozacyberhub_vector

# Next.js Configuration
NEXTJS_PORT=3000
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Optional: AI Services
USE_PINECONE=false
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=ongozacyberhub
```

2. **Start all services**:

```bash
docker-compose up -d
```

3. **View logs**:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f django
docker-compose logs -f fastapi
docker-compose logs -f nextjs
```

4. **Check service status**:

```bash
docker-compose ps
```

5. **Stop all services**:

```bash
docker-compose down
```

6. **Stop and remove volumes** (⚠️ This will delete all data):

```bash
docker-compose down -v
```

## Service URLs

Once running, access services at:

- **Frontend**: http://localhost:3000
- **Django API**: http://localhost:8000
- **FastAPI API**: http://localhost:8001
- **Django Admin**: http://localhost:8000/admin
- **FastAPI Docs**: http://localhost:8001/docs

## Health Checks

All services include health checks. Check status with:

```bash
docker-compose ps
```

Services will show as "healthy" when ready.

## Development Mode

For development with hot-reload, you may want to override volumes:

```yaml
# docker-compose.override.yml (create this file)
services:
  django:
    volumes:
      - ./backend/django_app:/app
  fastapi:
    volumes:
      - ./backend/fastapi_app:/app
  nextjs:
    volumes:
      - ./frontend/nextjs_app:/app
      - /app/node_modules
      - /app/.next
```

## Troubleshooting

### Services won't start

1. Check logs: `docker-compose logs [service-name]`
2. Verify ports aren't in use: `lsof -i :8000 -i :8001 -i :3000`
3. Check Docker resources: `docker system df`

### Database connection errors

- Ensure PostgreSQL services are healthy: `docker-compose ps`
- Check database credentials in `.env` file
- Verify network connectivity: `docker network inspect ongoza-network`

### Redis connection errors

- Ensure Redis service is healthy: `docker-compose ps redis`
- Check `REDIS_HOST` is set to `redis` (service name) in Django environment

### Next.js build errors

- Ensure `NEXT_PUBLIC_*` environment variables are set correctly
- Check Next.js Dockerfile build context
- Verify `next.config.js` has `output: 'standalone'` for Docker builds

## Rebuilding Services

To rebuild a specific service after code changes:

```bash
docker-compose build django    # Rebuild Django
docker-compose build fastapi   # Rebuild FastAPI
docker-compose build nextjs    # Rebuild Next.js
docker-compose up -d           # Restart with new images
```

To rebuild all services:

```bash
docker-compose build
docker-compose up -d
```

## Production Considerations

For production deployment:

1. **Set strong secrets** in `.env` file
2. **Use external databases** (update connection strings)
3. **Configure SSL/TLS** (use nginx reverse proxy)
4. **Set up backups** for volumes
5. **Configure resource limits** in docker-compose.yml
6. **Use production Dockerfiles** (django.Dockerfile.prod, fastapi.Dockerfile.prod)

## Network

All services are connected via the `ongoza-network` bridge network, allowing them to communicate using service names (e.g., `http://django:8000`).

## Volumes

Data persistence is handled via Docker volumes:

- `postgres_data` - Django database data
- `vector_db_data` - FastAPI vector database data
- `redis_data` - Redis cache data
- `django_static` - Django static files
- `django_media` - Django media files
- `nextjs_cache` - Next.js build cache

