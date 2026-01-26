FROM postgres:16-alpine

# Install pgvector extension
RUN apk add --no-cache postgresql-contrib

# Copy initialization scripts
COPY backend/docker/scripts/init_db.sh /docker-entrypoint-initdb.d/

# Set environment variables
ENV POSTGRES_DB=ongozacyberhub
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

EXPOSE 5432


