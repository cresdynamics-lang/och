FROM pgvector/pgvector:pg16

# Set environment variables
ENV POSTGRES_DB=ongozacyberhub_vector
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Copy initialization scripts
COPY backend/docker/scripts/init_vector_db.sh /docker-entrypoint-initdb.d/

EXPOSE 5433


