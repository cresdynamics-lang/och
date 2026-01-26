"""
Recommendation API schemas.
"""
from pydantic import BaseModel
from typing import List, Optional


class RecommendationItem(BaseModel):
    """
    Single recommendation item.
    """
    content_id: str
    content_type: str
    title: str
    description: Optional[str] = None
    score: float
    reason: Optional[str] = None


class RecommendationRequest(BaseModel):
    """
    Request schema for recommendations.
    """
    user_id: int
    content_type: Optional[str] = None
    limit: int = 10


class RecommendationResponse(BaseModel):
    """
    Response schema for recommendations.
    """
    user_id: int
    recommendations: List[RecommendationItem]
    total: int


