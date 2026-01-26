"""
Schemas for AI profiling system.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .profiling_tracks import TrackInfo
else:
    # Import TrackInfo from profiling_tracks to avoid circular imports
    from .profiling_tracks import TrackInfo


class QuestionOption(BaseModel):
    """An option for a profiling question."""
    value: str
    text: str
    scores: Dict[str, int]  # Track scores like {"defender": 3, "offensive": 2}


class ProfilingQuestion(BaseModel):
    """A profiling question with multiple choice options."""
    id: str
    question: str
    category: str  # technical_aptitude, problem_solving, scenario_preference, work_style, cybersecurity_mindset
    options: List[QuestionOption]


class ProfilingResponse(BaseModel):
    """User's response to a profiling question."""
    question_id: str
    selected_option: str
    response_time_ms: Optional[int] = None


class SubmitResponseRequest(BaseModel):
    """Request model for submitting a profiling question response."""
    question_id: str
    selected_option: str


class ProfilingSession(BaseModel):
    """A complete profiling session."""
    id: str
    user_id: int  # Django uses integer user IDs, not UUIDs
    responses: List[ProfilingResponse]
    started_at: datetime
    completed_at: Optional[datetime] = None
    scores: Optional[Dict[str, float]] = None
    recommended_track: Optional[str] = None


class TrackRecommendation(BaseModel):
    """Recommendation result for a track."""
    track_key: str
    track_name: str
    score: float
    confidence_level: str  # high, medium, low
    reasoning: List[str]
    career_suggestions: List[str]
    strengths_aligned: List[str]  # Strengths that align with this track
    optimal_path: str  # Recommended learning path


class DeepInsights(BaseModel):
    """Deep insights about the user's profile."""
    primary_strengths: List[str]
    learning_preferences: Dict[str, Any]
    career_alignment: Dict[str, Any]
    optimal_learning_path: List[str]
    recommended_foundations: List[str]
    growth_opportunities: List[str]
    personality_traits: Dict[str, Any]


class ProfilingResult(BaseModel):
    """Complete profiling result."""
    user_id: int  # Django uses integer user IDs, not UUIDs
    session_id: str
    recommendations: List[TrackRecommendation]
    primary_track: TrackInfo
    secondary_track: Optional[TrackInfo] = None
    assessment_summary: str
    deep_insights: Optional[DeepInsights] = None
    completed_at: datetime


class ProfilingProgress(BaseModel):
    """Current progress in profiling session."""
    session_id: str
    current_question: int
    total_questions: int
    progress_percentage: float
    estimated_time_remaining: int  # seconds


# Export OCH_TRACKS from profiling_tracks module
# This ensures backward compatibility while using the correct 5 tracks
__all__ = [
    'TrackInfo',
    'QuestionOption',
    'ProfilingQuestion',
    'ProfilingResponse',
    'SubmitResponseRequest',
    'ProfilingSession',
    'TrackRecommendation',
    'DeepInsights',
    'ProfilingResult',
    'ProfilingProgress',
    'OCH_TRACKS',
]
