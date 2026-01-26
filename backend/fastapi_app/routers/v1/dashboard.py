"""
FastAPI router for student dashboard endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date
from uuid import UUID
import httpx
from config import settings

router = APIRouter(prefix="/api/student/dashboard", tags=["student-dashboard"])


async def get_current_user_id() -> UUID:
    """Extract user ID from request headers or JWT token."""
    return UUID("00000000-0000-0000-0000-000000000000")


class ReadinessData(BaseModel):
    score: int
    max_score: int = 100
    trend: float
    trend_direction: str
    countdown_days: int
    countdown_label: str


class CohortProgress(BaseModel):
    percentage: float
    current_module: str
    total_modules: int
    completed_modules: int
    estimated_time_remaining: int
    graduation_date: Optional[date] = None


class PortfolioMetrics(BaseModel):
    total: int
    approved: int
    pending: int
    rejected: int
    percentage: float


class MentorshipData(BaseModel):
    next_session_date: date
    next_session_time: str
    mentor_name: str
    mentor_avatar: Optional[str] = None
    session_type: str
    status: str


class GamificationData(BaseModel):
    points: int
    streak: int
    badges: int
    rank: str
    level: str


class QuickStats(BaseModel):
    points: int
    streak: int
    badges: int
    mentor_rating: float


class SubscriptionInfo(BaseModel):
    tier: str
    expiry: Optional[date] = None
    days_left: Optional[int] = None


class DashboardOverviewResponse(BaseModel):
    readiness: ReadinessData
    cohort_progress: CohortProgress
    subscription: SubscriptionInfo
    quick_stats: QuickStats


class DashboardMetricsResponse(BaseModel):
    learning_percentage: float
    portfolio: PortfolioMetrics
    mentorship: MentorshipData
    gamification: GamificationData


class ActionItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str
    urgency: str
    progress: Optional[float] = None
    due_date: Optional[date] = None
    action_url: str


class EventItem(BaseModel):
    id: str
    title: str
    date: date
    time: Optional[str] = None
    type: str
    urgency: str
    rsvp_required: bool
    rsvp_status: Optional[str] = None
    action_url: Optional[str] = None


class TrackMilestone(BaseModel):
    id: str
    code: str
    title: str
    progress: float
    status: str


class TrackOverview(BaseModel):
    track_name: str
    track_key: str
    milestones: List[TrackMilestone]
    completed_milestones: int
    total_milestones: int


class CommunityActivity(BaseModel):
    id: str
    user: str
    action: str
    timestamp: str
    likes: int
    type: str
    action_url: Optional[str] = None


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    user_name: str
    points: int
    avatar: Optional[str] = None
    is_current_user: bool


class HabitStatus(BaseModel):
    id: str
    name: str
    category: str
    completed: bool
    streak: int
    today_logged: bool


class AICoachNudge(BaseModel):
    id: str
    message: str
    recommendation: str
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    dismissible: bool


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(user_id: UUID = Depends(get_current_user_id)):
    """
    Get dashboard overview: readiness, cohort progress, subscription, quick stats.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/overview"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.get("/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(user_id: UUID = Depends(get_current_user_id)):
    """
    Get dashboard metrics: learning %, portfolio, mentorship, gamification.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/metrics"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.get("/next-actions", response_model=List[ActionItem])
async def get_next_actions(user_id: UUID = Depends(get_current_user_id)):
    """
    Get prioritized next actions for the student.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/next-actions"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.get("/events", response_model=List[EventItem])
async def get_dashboard_events(user_id: UUID = Depends(get_current_user_id)):
    """
    Get upcoming events timeline with RSVP status.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/events"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.get("/track-overview", response_model=TrackOverview)
async def get_track_overview(user_id: UUID = Depends(get_current_user_id)):
    """
    Get track progress with milestone completion.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/track-overview"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.get("/community-feed", response_model=List[CommunityActivity])
async def get_community_feed(user_id: UUID = Depends(get_current_user_id)):
    """
    Get latest community activities.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/community-feed"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(user_id: UUID = Depends(get_current_user_id)):
    """
    Get cohort top performers.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/leaderboard"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.get("/habits", response_model=List[HabitStatus])
async def get_dashboard_habits(user_id: UUID = Depends(get_current_user_id)):
    """
    Get daily habit tracking status.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/habits"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )


@router.post("/ai-coach-nudge", response_model=AICoachNudge)
async def get_ai_coach_nudge(user_id: UUID = Depends(get_current_user_id)):
    """
    Get personalized AI recommendations.
    """
    try:
        django_url = f"{settings.DJANGO_API_URL}/api/v1/student/dashboard/ai-coach-nudge"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                django_url,
                headers={"X-User-ID": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Django service unavailable: {str(e)}"
        )

