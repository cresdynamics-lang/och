"""
FastAPI router for student missions endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
import httpx
from config import settings

router = APIRouter(prefix="/api/student/missions", tags=["student-missions"])


class MissionSubmissionResponse(BaseModel):
    id: UUID
    mission_id: UUID
    status: str
    ai_score: Optional[float] = None
    mentor_score: Optional[float] = None
    notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    ai_reviewed_at: Optional[datetime] = None
    mentor_reviewed_at: Optional[datetime] = None


class MissionArtifactResponse(BaseModel):
    id: UUID
    kind: str
    url: str
    filename: Optional[str] = None
    size_bytes: Optional[int] = None


class AIFeedbackResponse(BaseModel):
    id: UUID
    score: float
    strengths: List[str]
    gaps: List[str]
    suggestions: List[str]
    competencies_detected: dict
    created_at: datetime


class MissionResponse(BaseModel):
    id: UUID
    code: str
    title: str
    description: str
    difficulty: str
    type: str
    estimated_time_minutes: Optional[int] = None
    track_key: Optional[str] = None
    competencies: List[str]
    created_at: datetime
    submission: Optional[MissionSubmissionResponse] = None
    artifacts: List[MissionArtifactResponse] = []
    ai_feedback: Optional[AIFeedbackResponse] = None


class MissionFunnelResponse(BaseModel):
    not_started: int
    in_progress: int
    draft: int
    submitted: int
    ai_reviewed: int
    mentor_review: int
    approved: int
    failed: int
    approval_rate: float
    priority_missions: List[MissionResponse]


class SubmissionCreateRequest(BaseModel):
    notes: Optional[str] = None


class SubmissionUpdateRequest(BaseModel):
    notes: Optional[str] = None
    status: Optional[str] = None


class ArtifactCreateRequest(BaseModel):
    kind: str
    url: str
    filename: Optional[str] = None
    size_bytes: Optional[int] = None


async def get_current_user_id() -> UUID:
    """Extract user ID from JWT token - placeholder for actual auth."""
    return UUID("00000000-0000-0000-0000-000000000000")


@router.get("/funnel", response_model=MissionFunnelResponse)
async def get_mission_funnel(user_id: UUID = Depends(get_current_user_id)):
    """Get mission funnel with aggregated counts and priority missions."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/missions/funnel",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.get("", response_model=List[MissionResponse])
async def list_missions(
    status: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    track_key: Optional[str] = Query(None),
    user_id: UUID = Depends(get_current_user_id)
):
    """List missions with optional filters."""
    async with httpx.AsyncClient() as client:
        try:
            params = {}
            if status:
                params["status"] = status
            if difficulty:
                params["difficulty"] = difficulty
            if track_key:
                params["track_key"] = track_key
            
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/missions",
                params=params,
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.get("/{mission_id}", response_model=MissionResponse)
async def get_mission_detail(
    mission_id: UUID,
    user_id: UUID = Depends(get_current_user_id)
):
    """Get mission detail with submission, artifacts, and AI feedback."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/missions/{mission_id}",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/{mission_id}/submission", response_model=MissionSubmissionResponse)
async def create_or_resume_submission(
    mission_id: UUID,
    request: SubmissionCreateRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """Create or resume a mission submission."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/missions/{mission_id}/submission",
                json=request.dict(),
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.patch("/submissions/{submission_id}", response_model=MissionSubmissionResponse)
async def update_submission(
    submission_id: UUID,
    request: SubmissionUpdateRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """Update submission notes or status."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(
                f"{settings.DJANGO_API_URL}/api/v1/student/submissions/{submission_id}",
                json=request.dict(),
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/submissions/{submission_id}/artifacts", response_model=List[MissionArtifactResponse])
async def create_artifact(
    submission_id: UUID,
    request: ArtifactCreateRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """Add artifact to submission."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/submissions/{submission_id}/artifacts",
                json=request.dict(),
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/submissions/{submission_id}/submit-ai", response_model=MissionSubmissionResponse)
async def submit_for_ai_review(
    submission_id: UUID,
    user_id: UUID = Depends(get_current_user_id)
):
    """Submit mission for AI review."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/missions/submissions/{submission_id}/submit-ai",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/submissions/{submission_id}/submit-mentor", response_model=MissionSubmissionResponse)
async def submit_for_mentor_review(
    submission_id: UUID,
    user_id: UUID = Depends(get_current_user_id)
):
    """Submit mission for mentor review (tier 7 only)."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/missions/submissions/{submission_id}/submit-mentor",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )

