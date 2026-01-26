"""
FastAPI router for AI profiling endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
import time
import logging

from schemas.profiling import (
    ProfilingSession, ProfilingResult, ProfilingProgress,
    TrackRecommendation, SubmitResponseRequest
)
from schemas.profiling_tracks import OCH_TRACKS
from services.profiling_service_enhanced import enhanced_profiling_service
from utils.auth import verify_token

logger = logging.getLogger(__name__)

async def get_current_user_id(user_id: int = Depends(verify_token)) -> int:
    """Extract user ID from JWT token."""
    return user_id

router = APIRouter(prefix="/profiling", tags=["ai-profiling"])


# In-memory session storage (in production, use Redis or database)
_active_sessions = {}


@router.post("/session/start", response_model=dict)
async def start_profiling_session(user_id: int = Depends(get_current_user_id)):
    """
    Start a new AI profiling session for a user.

    Returns session ID and initial progress information.
    """
    # Check if user already has an active session
    existing_session = None
    for session in _active_sessions.values():
        if session.user_id == user_id and session.completed_at is None:
            existing_session = session
            break

    if existing_session:
        progress = enhanced_profiling_service.get_progress(existing_session)
        return {
            "session_id": existing_session.id,
            "status": "existing_session_resumed",
            "progress": progress.dict(),
            "message": "Resumed existing profiling session"
        }

    # Create new session
    session = enhanced_profiling_service.create_session(user_id)
    _active_sessions[session.id] = session

    progress = enhanced_profiling_service.get_progress(session)

    return {
        "session_id": session.id,
        "status": "new_session_started",
        "progress": progress.dict(),
        "message": "AI profiling session started successfully"
    }


@router.get("/session/{session_id}/progress", response_model=ProfilingProgress)
async def get_session_progress(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get current progress for a profiling session.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    progress = enhanced_profiling_service.get_progress(session)
    return progress


@router.get("/questions", response_model=List[dict])
async def get_profiling_questions(user_id: int = Depends(get_current_user_id)):
    """
    Get all profiling questions for the assessment.

    This route now returns the enhanced Tier-0 question set
    (all modules flattened into a single list for backward compatibility).
    """
    questions_by_module = enhanced_profiling_service.get_all_questions()
    # Flatten questions from all modules into a single list
    flat_questions: List[dict] = []
    for module_questions in questions_by_module.values():
        flat_questions.extend(module_questions)
    return flat_questions


@router.get("/question/{question_id}")
async def get_specific_question(
    question_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get a specific profiling question.
    """
    question = enhanced_profiling_service.get_question(question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    return question


@router.post("/session/{session_id}/respond")
async def submit_question_response(
    session_id: str,
    request: SubmitResponseRequest,
    user_id: int = Depends(get_current_user_id)
):
    """
    Submit a response to a profiling question.
    """
    question_id = request.question_id
    selected_option = request.selected_option
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profiling session is already completed"
        )

    # Record response time
    start_time = time.time()
    success = enhanced_profiling_service.submit_response(
        session, question_id, selected_option
    )
    response_time_ms = int((time.time() - start_time) * 1000)

    if not success:
        # Enhanced debug information to help diagnose 400s during development
        question = enhanced_profiling_service.question_map.get(question_id)
        if not question:
            logger.warning(
                "Profiling respond failed: unknown question_id '%s' (session_id=%s, user_id=%s)",
                question_id,
                session_id,
                user_id,
            )
            detail = f"Invalid question ID: {question_id}"
        else:
            valid_options = [opt.value for opt in question.options]
            logger.warning(
                "Profiling respond failed: invalid option '%s' for question '%s'. "
                "Valid options: %s (session_id=%s, user_id=%s)",
                selected_option,
                question_id,
                valid_options,
                session_id,
                user_id,
            )
            detail = (
                f"Invalid option '{selected_option}' for question '{question_id}'. "
                f"Valid options are: {', '.join(valid_options)}"
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

    # Update response time
    for response in session.responses:
        if response.question_id == question_id:
            response.response_time_ms = response_time_ms
            break

    progress = enhanced_profiling_service.get_progress(session)

    return {
        "success": True,
        "progress": progress.dict(),
        "message": f"Response recorded for question {question_id}"
    }


@router.post("/session/{session_id}/complete", response_model=ProfilingResult)
async def complete_profiling_session(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Complete a profiling session and generate track recommendations.

    This now uses the enhanced Tier-0 profiling engine under the hood.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is not None:
        # Return existing results if already completed
        result = ProfilingResult(
            user_id=session.user_id,
            session_id=session.id,
            recommendations=[],  # Would load from storage in production
            primary_track=OCH_TRACKS[session.recommended_track],
            assessment_summary="Session already completed",
            completed_at=session.completed_at
        )
        return result

    try:
        result = enhanced_profiling_service.complete_session(session)

        # Mark session as completed
        session.completed_at = result.completed_at

        # Note: Django sync will be handled by the frontend after completion
        # This ensures proper authentication token is passed
        # The frontend will call Django's sync endpoint with user's auth token

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/tracks", response_model=dict)
async def get_available_tracks(user_id: int = Depends(get_current_user_id)):
    """
    Get information about all available OCH tracks.
    """
    tracks = {}
    for key, track in OCH_TRACKS.items():
        tracks[key] = track.dict()

    return {
        "tracks": tracks,
        "total_tracks": len(tracks),
        "description": "Available OCH career tracks for AI-powered matching"
    }


@router.get("/session/{session_id}/results", response_model=ProfilingResult)
async def get_profiling_results(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get profiling results for a completed session.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is None or session.recommended_track is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profiling session is not completed yet"
        )

    # Reconstruct result from session data using enhanced engine
    recommendations = enhanced_profiling_service.generate_recommendations(session.scores)
    primary_track = OCH_TRACKS[session.recommended_track]
    
    # Generate deep insights from session data
    deep_insights = enhanced_profiling_service._generate_deep_insights(
        session, session.scores, recommendations
    )
    
    # Generate assessment summary with recommendations and deep insights
    assessment_summary = enhanced_profiling_service._generate_assessment_summary(
        recommendations, deep_insights
    )

    result = ProfilingResult(
        user_id=session.user_id,
        session_id=session.id,
        recommendations=recommendations,
        primary_track=primary_track,
        assessment_summary=assessment_summary,
        deep_insights=deep_insights,
        completed_at=session.completed_at
    )

    return result


@router.get("/status", response_model=dict)
async def check_profiling_status(user_id: int = Depends(get_current_user_id)):
    """
    Check if user has completed profiling.
    Returns status and session information if available.
    """
    # Check for completed session
    completed_session = None
    active_session = None
    
    # Check for completed or active sessions for this user
    for session in _active_sessions.values():
        if session.user_id == user_id:
            if session.completed_at is not None:
                completed_session = session
            elif session.completed_at is None:
                active_session = session
    
    if completed_session:
        module_progress = enhanced_profiling_service.get_module_progress(completed_session)
        return {
            "completed": True,
            "session_id": str(completed_session.id),
            "completed_at": completed_session.completed_at.isoformat() if completed_session.completed_at else None,
            "has_active_session": False,
            "module_progress": module_progress,
        }
    
    if active_session:
        progress = enhanced_profiling_service.get_progress(active_session)
        module_progress = enhanced_profiling_service.get_module_progress(active_session)
        return {
            "completed": False,
            "session_id": str(active_session.id),
            "has_active_session": True,
            "progress": progress.dict(),
            "module_progress": module_progress,
        }
    
    return {
        "completed": False,
        "session_id": None,
        "has_active_session": False,
        "module_progress": None,
    }


@router.get("/session/{session_id}/modules", response_model=dict)
async def get_session_module_progress(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get per-module progress for a profiling session.

    Useful for UI flows where users complete one category at a time
    and resume later from the next module.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    return enhanced_profiling_service.get_module_progress(session)


@router.delete("/session/{session_id}")
async def delete_profiling_session(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Delete a profiling session (for testing/admin purposes).
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    # Remove session
    del _active_sessions[session_id]

    return {
        "success": True,
        "message": "Profiling session deleted successfully"
    }


# ============================================================================
# Enhanced Tier-0 Profiling Endpoints
# ============================================================================

@router.get("/enhanced/questions", response_model=dict)
async def get_enhanced_profiling_questions(user_id: int = Depends(get_current_user_id)):
    """
    Get all enhanced profiling questions organized by module.
    Returns questions grouped by the 7 modules.
    """
    questions = enhanced_profiling_service.get_all_questions()
    return {
        "modules": {
            "identity_value": "Identity & Value (VIP-based questions)",
            "cyber_aptitude": "Cyber Aptitude (logic, patterns, reasoning)",
            "technical_exposure": "Technical Exposure (experience scoring)",
            "scenario_preference": "Scenario Preferences (choose-your-path)",
            "work_style": "Work Style & Behavioral Profile",
            "difficulty_selection": "Difficulty Level Self-Selection"
        },
        "questions": questions,
        "total_questions": sum(len(qs) for qs in questions.values())
    }


@router.get("/enhanced/module/{module_name}/questions", response_model=List[dict])
async def get_questions_by_module(
    module_name: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get questions for a specific module.
    Module names: identity_value, cyber_aptitude, technical_exposure, 
    scenario_preference, work_style, difficulty_selection
    """
    questions = enhanced_profiling_service.get_questions_by_module(module_name)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module '{module_name}' not found"
        )
    return questions


@router.post("/enhanced/session/{session_id}/reflection")
async def submit_reflection(
    session_id: str,
    why_cyber: str,
    what_achieve: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Submit reflection responses (Module 7: Role Fit Reflection).
    These responses are used for value statement extraction.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    success = enhanced_profiling_service.submit_reflection(
        session, why_cyber, what_achieve
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to submit reflection"
        )

    return {
        "success": True,
        "message": "Reflection submitted successfully"
    }


@router.post("/enhanced/session/{session_id}/verify-difficulty")
async def verify_difficulty_selection(
    session_id: str,
    selected_difficulty: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Verify if user's difficulty self-selection is realistic (Module 6).
    AI engine verifies based on technical exposure responses.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    verification = enhanced_profiling_service.verify_difficulty_selection(
        session, selected_difficulty
    )
    
    # Store verification in session
    session.difficulty_verification = verification

    return verification


@router.post("/enhanced/session/{session_id}/complete", response_model=ProfilingResult)
async def complete_enhanced_profiling_session(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Complete an enhanced profiling session and generate comprehensive results.
    Uses the enhanced 7-module profiling system.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is not None:
        # Return existing results if already completed
        result = ProfilingResult(
            user_id=session.user_id,
            session_id=session.id,
            recommendations=[],
            primary_track=OCH_TRACKS[session.recommended_track],
            assessment_summary="Session already completed",
            completed_at=session.completed_at
        )
        return result

    try:
        result = enhanced_profiling_service.complete_session(session)

        # Mark session as completed
        session.completed_at = result.completed_at

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/enhanced/session/{session_id}/blueprint")
async def get_och_blueprint(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Generate Personalized OCH Blueprint document.
    Includes track recommendation, difficulty level, starting point, and learning strategy.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is None or session.recommended_track is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profiling session must be completed first"
        )

    # Reconstruct result from session
    recommendations = enhanced_profiling_service.generate_recommendations(session.scores)
    primary_track = OCH_TRACKS[session.recommended_track]
    
    # Generate deep insights
    deep_insights = enhanced_profiling_service._generate_deep_insights(
        session, session.scores, recommendations
    )
    
    # Generate assessment summary
    assessment_summary = enhanced_profiling_service._generate_assessment_summary(
        recommendations, deep_insights
    )

    result = ProfilingResult(
        user_id=session.user_id,
        session_id=session.id,
        recommendations=recommendations,
        primary_track=primary_track,
        assessment_summary=assessment_summary,
        deep_insights=deep_insights,
        completed_at=session.completed_at
    )

    # Generate blueprint
    blueprint = enhanced_profiling_service.generate_och_blueprint(session, result)

    return blueprint


@router.get("/enhanced/session/{session_id}/value-statement")
async def get_value_statement(
    session_id: str,
    user_id: int = Depends(get_current_user_id)
):
    """
    Extract and return value statement from profiling session.
    This becomes the first portfolio entry.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    value_statement = enhanced_profiling_service.extract_value_statement(session)

    return {
        "value_statement": value_statement,
        "session_id": session_id,
        "ready_for_portfolio": True
    }
