# Optimized FastAPI Dockerfile with BuildKit cache mounts and better layer caching
# Use: DOCKER_BUILDKIT=1 docker build -f backend/docker/fastapi.Dockerfile -t fastapi .
# Or set in docker-compose.yml: DOCKER_BUILDKIT=1 docker-compose build

FROM python:3.12-slim AS base

WORKDIR /app

# Set environment variables for pip optimization
ENV PIP_DEFAULT_TIMEOUT=600 \
    PIP_NO_CACHE_DIR=0 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_FIND_LINKS="" \
    PIP_INDEX_URL=https://pypi.org/simple \
    PIP_DEFAULT_RESUME_RETRIES=10

# Install system dependencies in one layer (cached unless system deps change)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Upgrade pip, setuptools, wheel (cached layer)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel

# Copy only requirements first for better caching
# This layer is invalidated only when requirements.txt changes
COPY backend/fastapi_app/requirements.txt /tmp/requirements.txt

# Install base/core dependencies first (these change rarely)
# Using BuildKit cache mount to persist pip cache between builds
# Add resume-retries for packages that may have network issues
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --timeout=300 --resume-retries=5 \
    "fastapi>=0.104.0" \
    "uvicorn[standard]>=0.24.0" \
    "pydantic>=2.5.0" \
    "pydantic-settings>=2.1.0" \
    "asyncpg>=0.29.0" \
    "psycopg2-binary>=2.9.9" \
    "httpx>=0.25.0" \
    "python-jose[cryptography]>=3.3.0" \
    "python-dotenv>=1.0.0" \
    "prometheus-client>=0.19.0" \
    "alembic>=1.13.0"

# Install heavy ML dependencies separately (these are the slowest)
# numpy and sentence-transformers can take a long time, so we cache them separately
# Use --resume-retries for large packages that may timeout
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --timeout=600 --resume-retries=10 \
    "numpy>=1.24.0"

# Install sentence-transformers last (it's the heaviest and depends on numpy)
# torch is ~900MB, so we need more retries and longer timeout
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --timeout=1800 --resume-retries=20 \
    "sentence-transformers>=2.2.0"

# Copy application code (this changes frequently, so it's last)
# This layer is invalidated on every code change, but dependencies stay cached
COPY backend/fastapi_app/ .

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
