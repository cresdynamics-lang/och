"""
Recommendation engine API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationItem,
)
from services.recommendation_service import RecommendationService

router = APIRouter()


@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    service: RecommendationService = Depends(RecommendationService),
):
    """
    Get personalized recommendations based on user profile and progress.
    """
    try:
        recommendations = await service.get_recommendations(
            user_id=request.user_id,
            content_type=request.content_type,
            limit=request.limit,
        )
        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=recommendations,
            total=len(recommendations),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_user_recommendations(
    user_id: int,
    content_type: Optional[str] = None,
    limit: int = 10,
    service: RecommendationService = Depends(RecommendationService),
):
    """
    Get recommendations for a specific user.
    """
    try:
        recommendations = await service.get_recommendations(
            user_id=user_id,
            content_type=content_type,
            limit=limit,
        )
        return RecommendationResponse(
            user_id=user_id,
            recommendations=recommendations,
            total=len(recommendations),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


