"""
FastAPI router for student curriculum endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
import httpx
from config import settings

router = APIRouter(prefix="/api/student/curriculum", tags=["student-curriculum"])


class LessonResponse(BaseModel):
    id: UUID
    title: str
    description: str
    content_url: str
    order_index: int
    status: Optional[str] = None


class MissionLinkResponse(BaseModel):
    id: UUID
    code: str
    title: str
    difficulty: str


class ModuleResponse(BaseModel):
    id: UUID
    title: str
    description: str
    is_core: bool
    order_index: int
    estimated_time_minutes: Optional[int] = None
    competencies: List[str]
    status: Optional[str] = None
    progress_percent: Optional[float] = None
    is_locked: bool = False
    lessons: List[LessonResponse] = []
    missions: List[MissionLinkResponse] = []


class TrackResponse(BaseModel):
    track_key: str
    track_name: str
    cohort_label: Optional[str] = None
    modules_completed: int
    modules_total: int
    progress_percent: float
    estimated_time_remaining_minutes: Optional[int] = None
    current_module_id: Optional[UUID] = None


class TrackWithModulesResponse(BaseModel):
    track: TrackResponse
    modules: List[ModuleResponse]


async def get_current_user_id() -> UUID:
    """Extract user ID from JWT token - placeholder for actual auth."""
    return UUID("00000000-0000-0000-0000-000000000000")


@router.get("/track", response_model=TrackResponse)
async def get_track(user_id: UUID = Depends(get_current_user_id)):
    """Get current user's track information."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/curriculum/track",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.get("/modules", response_model=List[ModuleResponse])
async def list_modules(user_id: UUID = Depends(get_current_user_id)):
    """List curriculum modules with progress and entitlement flags."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/curriculum/modules",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module_detail(
    module_id: UUID,
    user_id: UUID = Depends(get_current_user_id)
):
    """Get module detail with lessons, missions, and progress."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/curriculum/modules/{module_id}",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: UUID,
    user_id: UUID = Depends(get_current_user_id)
):
    """Mark lesson as completed."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/curriculum/lessons/{lesson_id}/complete",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )

