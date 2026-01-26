"""
FastAPI router for student coaching endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date
from uuid import UUID
import httpx
from config import settings

router = APIRouter(prefix="/api/student/coaching", tags=["student-coaching"])


class HabitResponse(BaseModel):
    id: UUID
    name: str
    is_core: bool
    frequency: str
    streak_current: Optional[int] = 0
    streak_longest: Optional[int] = 0
    today_logged: bool = False


class GoalResponse(BaseModel):
    id: UUID
    title: str
    scope: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: str
    progress_percent: Optional[float] = None


class ReflectionResponse(BaseModel):
    id: UUID
    content: str
    ai_sentiment: Optional[str] = None
    ai_tags: List[str] = []
    created_at: datetime


class CoachingOverviewResponse(BaseModel):
    habits: List[HabitResponse]
    active_goals: List[GoalResponse]
    today_reflection_status: Optional[str] = None
    streaks: dict


class HabitLogRequest(BaseModel):
    log_date: date
    status: str


class GoalCreateRequest(BaseModel):
    title: str
    scope: str
    description: Optional[str] = None
    target_date: Optional[date] = None


class GoalUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None


class ReflectionCreateRequest(BaseModel):
    content: str


class AICoachResponse(BaseModel):
    weekly_plan: List[str]
    suggestions: List[str]
    insights: List[str]


async def get_current_user_id() -> UUID:
    """Extract user ID from JWT token - placeholder for actual auth."""
    return UUID("00000000-0000-0000-0000-000000000000")


@router.get("/overview", response_model=CoachingOverviewResponse)
async def get_coaching_overview(user_id: UUID = Depends(get_current_user_id)):
    """Get coaching overview: habits, streaks, active goals, today's reflection status."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/overview",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/habits/core/ensure")
async def ensure_core_habits(user_id: UUID = Depends(get_current_user_id)):
    """Create Learn/Practice/Reflect core habits if missing."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/habits/core/ensure",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/habits/{habit_id}/log")
async def log_habit(
    habit_id: UUID,
    request: HabitLogRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """Log habit completion for a date."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/habits/{habit_id}/log",
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


@router.get("/goals", response_model=List[GoalResponse])
async def list_goals(user_id: UUID = Depends(get_current_user_id)):
    """List user goals."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/goals",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/goals", response_model=GoalResponse)
async def create_goal(
    request: GoalCreateRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """Create a new goal."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/goals",
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


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: UUID,
    request: GoalUpdateRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """Update a goal."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/goals/{goal_id}",
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


@router.post("/reflections", response_model=ReflectionResponse)
async def create_reflection(
    request: ReflectionCreateRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """Create reflection and trigger AI analysis."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/reflections",
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


@router.get("/reflections/recent", response_model=List[ReflectionResponse])
async def get_recent_reflections(user_id: UUID = Depends(get_current_user_id)):
    """Get recent reflections."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/reflections/recent",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )


@router.post("/ai-coach", response_model=AICoachResponse)
async def get_ai_coach_plan(user_id: UUID = Depends(get_current_user_id)):
    """Get AI coach weekly plan based on reflections, habits, and missions."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.DJANGO_API_URL}/api/v1/student/coaching/ai-coach",
                headers={"X-User-ID": str(user_id)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Django API error: {str(e)}"
            )

