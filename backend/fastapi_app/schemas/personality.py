"""
Personality analysis API schemas.
"""
from pydantic import BaseModel
from typing import Dict, Optional, List
from schemas.progress import ProgressResponse


class PersonalityAnalysisRequest(BaseModel):
    """
    Request schema for personality analysis.
    """
    user_id: int
    progress_data: Optional[List[ProgressResponse]] = None


class PersonalityTrait(BaseModel):
    """
    Single personality trait.
    """
    name: str
    score: float
    description: Optional[str] = None


class PersonalityAnalysisResponse(BaseModel):
    """
    Response schema for personality analysis.
    """
    user_id: int
    traits: List[PersonalityTrait]
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None


