FROM python:3.12-slim

WORKDIR /app

# Set pip timeout environment variable (in seconds - 6000 = 100 minutes)
ENV PIP_DEFAULT_TIMEOUT=6000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/django_app/requirements.txt .

# Install critical packages first
RUN pip install --no-cache-dir --timeout=6000 \
    "Django>=5.0,<6.0" \
    "psycopg2-binary>=2.9.9" \
    "djangorestframework>=3.14.0" \
    "django-environ>=0.10.0"

# Then install remaining packages
RUN pip install --no-cache-dir --timeout=6000 -r requirements.txt

# Copy Django application
COPY backend/django_app/ .

# Collect static files (will be run during build or startup)
# RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]


