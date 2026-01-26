"""
Personality analysis API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from schemas.personality import (
    PersonalityAnalysisRequest,
    PersonalityAnalysisResponse,
)
from services.personality_service import PersonalityService

router = APIRouter()


@router.post("/personality/analyze", response_model=PersonalityAnalysisResponse)
async def analyze_personality(
    request: PersonalityAnalysisRequest,
    service: PersonalityService = Depends(PersonalityService),
):
    """
    Analyze user personality based on progress data and behavior.
    """
    try:
        analysis = await service.analyze_personality(
            user_id=request.user_id,
            progress_data=request.progress_data,
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/personality/{user_id}", response_model=PersonalityAnalysisResponse)
async def get_personality(
    user_id: int,
    service: PersonalityService = Depends(PersonalityService),
):
    """
    Get cached personality analysis for a user.
    """
    try:
        analysis = await service.get_cached_personality(user_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Personality analysis not found")
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


