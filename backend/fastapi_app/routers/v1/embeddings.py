"""
Embedding generation API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from schemas.embedding import (
    EmbeddingRequest,
    EmbeddingResponse,
    EmbeddingItem,
)
from services.embedding_service import EmbeddingService

router = APIRouter()


@router.post("/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(
    request: EmbeddingRequest,
    service: EmbeddingService = Depends(EmbeddingService),
):
    """
    Generate embeddings for given texts.
    """
    try:
        embeddings = await service.generate_embeddings(request.texts)
        embedding_items = [
            EmbeddingItem(text=text, embedding=emb.tolist())
            for text, emb in zip(request.texts, embeddings)
        ]
        return EmbeddingResponse(
            embeddings=embedding_items,
            model=service.model_name,
            dimension=service.dimension,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embeddings/store", response_model=dict)
async def store_embeddings(
    request: EmbeddingRequest,
    content_type: str,
    content_id: str,
    service: EmbeddingService = Depends(EmbeddingService),
):
    """
    Generate and store embeddings in vector database.
    """
    try:
        embeddings = await service.generate_embeddings(request.texts)
        stored_ids = await service.store_embeddings(
            texts=request.texts,
            embeddings=embeddings,
            content_type=content_type,
            content_id=content_id,
        )
        return {
            "status": "success",
            "stored_count": len(stored_ids),
            "ids": stored_ids,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


