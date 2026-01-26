"""
Embedding service for generating and managing embeddings.
"""
from typing import List
import numpy as np
from config import settings
from vector_store.pgvector_client import PGVectorClient
from vector_store.pinecone_client import PineconeClient


class EmbeddingService:
    """
    Service for generating embeddings using sentence transformers.
    """
    
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
        self.model = None
        self.vector_store = None
        
        # Initialize vector store based on configuration
        if settings.USE_PINECONE:
            self.vector_store = PineconeClient()
        else:
            self.vector_store = PGVectorClient()
    
    async def initialize(self):
        """
        Initialize the embedding model and vector store.
        """
        # TODO: Load sentence-transformers model
        # from sentence_transformers import SentenceTransformer
        # self.model = SentenceTransformer(self.model_name)
        
        await self.vector_store.connect()
        if not settings.USE_PINECONE:
            await self.vector_store.initialize_schema()
    
    async def generate_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for a list of texts.
        """
        if not self.model:
            raise RuntimeError("Embedding model not initialized")
        
        # TODO: Implement actual embedding generation
        # embeddings = self.model.encode(texts, convert_to_numpy=True)
        # return embeddings
        
        # Placeholder: return random embeddings
        return [np.random.rand(self.dimension) for _ in texts]
    
    async def store_embeddings(
        self,
        texts: List[str],
        embeddings: List[np.ndarray],
        content_type: str,
        content_id: str,
    ) -> List[str]:
        """
        Store embeddings in vector database.
        """
        stored_ids = []
        for i, (text, embedding) in enumerate(zip(texts, embeddings)):
            embedding_list = embedding.tolist()
            stored_id = await self.vector_store.store_embedding(
                content_id=f"{content_id}_{i}",
                content_type=content_type,
                text=text,
                embedding=embedding_list,
            )
            stored_ids.append(str(stored_id))
        return stored_ids


