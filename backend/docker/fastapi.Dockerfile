FROM python:3.12-slim AS base

WORKDIR /app

ENV PIP_DEFAULT_TIMEOUT=600 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Upgrade pip
RUN pip install --upgrade pip setuptools wheel

# Copy requirements
COPY backend/fastapi_app/requirements.txt /tmp/requirements.txt

# Install core dependencies
RUN pip install --timeout=300 \
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

# Install numpy
RUN pip install --timeout=600 "numpy>=1.24.0"

# Install sentence-transformers (heaviest)
RUN pip install --timeout=1800 "sentence-transformers>=2.2.0"

# Install remaining requirements
RUN pip install --timeout=600 -r /tmp/requirements.txt

# Copy application code
COPY backend/fastapi_app/ .

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
