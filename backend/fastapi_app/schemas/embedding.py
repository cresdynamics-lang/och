"""
Embedding API schemas.
"""
from pydantic import BaseModel
from typing import List


class EmbeddingItem(BaseModel):
    """
    Single embedding item with text and vector.
    """
    text: str
    embedding: List[float]


class EmbeddingRequest(BaseModel):
    """
    Request schema for embedding generation.
    """
    texts: List[str]


class EmbeddingResponse(BaseModel):
    """
    Response schema for embeddings.
    """
    embeddings: List[EmbeddingItem]
    model: str
    dimension: int


