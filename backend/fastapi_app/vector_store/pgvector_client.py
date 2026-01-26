"""
PGVector client for vector database operations.
"""
import asyncpg
from typing import List, Optional
from config import settings
import numpy as np


class PGVectorClient:
    """
    Client for interacting with PostgreSQL with pgvector extension.
    """
    
    def __init__(self):
        self.connection_string = (
            f"postgresql://{settings.VECTOR_DB_USER}:{settings.VECTOR_DB_PASSWORD}"
            f"@{settings.VECTOR_DB_HOST}:{settings.VECTOR_DB_PORT}/{settings.VECTOR_DB_NAME}"
        )
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """
        Create connection pool.
        """
        self.pool = await asyncpg.create_pool(
            self.connection_string,
            min_size=5,
            max_size=20,
        )
    
    async def close(self):
        """
        Close connection pool.
        """
        if self.pool:
            await self.pool.close()
    
    async def initialize_schema(self):
        """
        Initialize pgvector extension and create necessary tables.
        """
        async with self.pool.acquire() as conn:
            # Enable pgvector extension
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            
            # Create embeddings table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS embeddings (
                    id SERIAL PRIMARY KEY,
                    content_id VARCHAR(255) NOT NULL,
                    content_type VARCHAR(100) NOT NULL,
                    text TEXT NOT NULL,
                    embedding vector(384),
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Create index for similarity search
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
                ON embeddings USING ivfflat (embedding vector_cosine_ops)
            """)
    
    async def store_embedding(
        self,
        content_id: str,
        content_type: str,
        text: str,
        embedding: List[float],
        metadata: dict = None,
    ) -> int:
        """
        Store an embedding in the database.
        """
        async with self.pool.acquire() as conn:
            result = await conn.fetchval("""
                INSERT INTO embeddings (content_id, content_type, text, embedding, metadata)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            """, content_id, content_type, text, embedding, metadata or {})
            return result
    
    async def similarity_search(
        self,
        query_embedding: List[float],
        limit: int = 10,
        content_type: Optional[str] = None,
    ) -> List[dict]:
        """
        Perform similarity search using cosine distance.
        """
        async with self.pool.acquire() as conn:
            if content_type:
                results = await conn.fetch("""
                    SELECT id, content_id, content_type, text, metadata,
                           1 - (embedding <=> $1::vector) as similarity
                    FROM embeddings
                    WHERE content_type = $2
                    ORDER BY embedding <=> $1::vector
                    LIMIT $3
                """, query_embedding, content_type, limit)
            else:
                results = await conn.fetch("""
                    SELECT id, content_id, content_type, text, metadata,
                           1 - (embedding <=> $1::vector) as similarity
                    FROM embeddings
                    ORDER BY embedding <=> $1::vector
                    LIMIT $2
                """, query_embedding, limit)
            
            return [dict(row) for row in results]


