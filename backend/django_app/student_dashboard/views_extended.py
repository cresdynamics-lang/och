"""
Extended API views for Student Dashboard endpoints.
Implements the complete student dashboard specification.
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User
from programs.models import Enrollment, Track, Cohort
from profiler.models import ProfilerSession
from coaching.models import Habit, HabitLog, Goal, Reflection
from missions.models import MissionSubmission, Mission
from subscriptions.models import UserSubscription
from .models import StudentDashboardCache, StudentMissionProgress
from .services_extended import (
    StudentDashboardService,
    ProfilerService,
    CoachingOSService,
    CurriculumService,
    MissionsService,
    PortfolioService,
    TalentScopeService,
    SubscriptionService,
    AICoachService,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_profile(request):
    """
    GET /api/v1/student/profile
    
    Returns student profile with Future-You persona and consents.
    """
    user = request.user
    
    # Check student role
    if not user.user_roles.filter(role__name='student', is_active=True).exists():
        return Response(
            {'error': 'Access denied. Student role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get Future-You from Profiler
    profiler_data = ProfilerService.get_future_you(user.id)
    
    # Get profiled track from ProfilerSession (AI engine result)
    profiled_track_key = None
    try:
        from profiler.models import ProfilerSession
        profiler_session = ProfilerSession.objects.filter(
            user=user,
            status='finished'
        ).order_by('-completed_at').first()
        
        if profiler_session:
            # Try to get track_key from recommended_track_id
            if profiler_session.recommended_track_id:
                from programs.models import Track
                track = Track.objects.filter(id=profiler_session.recommended_track_id).first()
                if track and hasattr(track, 'key'):
                    profiled_track_key = track.key
                elif track and hasattr(track, 'track_key'):
                    profiled_track_key = track.track_key
            
            # Fallback: Try to extract from futureyou_persona
            if not profiled_track_key and profiler_session.futureyou_persona:
                persona_data = profiler_session.futureyou_persona
                if isinstance(persona_data, dict):
                    profiled_track_key = persona_data.get('track_key') or persona_data.get('track')
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Could not get profiled track: {e}")
        pass
    
    # Get enrollment info
    enrollment = Enrollment.objects.filter(user=user, status='active').first()
    track_name = None
    track_key = None
    cohort_name = None
    mentor_name = None
    
    if enrollment:
        track_name = enrollment.track.name if enrollment.track else None
        track_key = enrollment.track_key if enrollment.track_key else (enrollment.track.key if enrollment.track and hasattr(enrollment.track, 'key') else None)
        cohort_name = enrollment.cohort.name if enrollment.cohort else None
        # Get mentor assignment (mentor is assigned to cohort, not directly to user)
        if enrollment.cohort:
            from programs.models import MentorAssignment
            mentor_assignment = MentorAssignment.objects.filter(
                cohort=enrollment.cohort,
                active=True,
                role='primary'
            ).first()
            mentor_name = mentor_assignment.mentor.get_full_name() if mentor_assignment and mentor_assignment.mentor else None
        else:
            mentor_name = None
    
    # Get consents (mock for now - should come from user profile)
    consents = {
        'share_with_mentor': getattr(user, 'consent_mentor_share', True),
        'employer_share': getattr(user, 'consent_employer_share', False),
        'public_portfolio': getattr(user, 'consent_public_portfolio', False),
    }
    
    response_data = {
        'basic': {
            'name': user.get_full_name() or user.email,
            'track': track_name or 'Not assigned',
            'track_key': track_key,
            'cohort': cohort_name or 'Not assigned',
            'mentor': mentor_name or 'Not assigned',
        },
        'future_you': {
            'persona': profiler_data.get('persona', 'Not assessed'),
            'skills_needed': profiler_data.get('skills_needed', []),
            'alignment': profiler_data.get('alignment', 0),
            'track': profiler_data.get('track', 'Not recommended'),
        },
        'profiled_track': {
            'track_key': profiled_track_key,
            'track_name': profiled_track_key,  # Will be mapped on frontend
        },
        'enrollment': {
            'track_key': track_key,
            'track_name': track_name,
        },
        'consents': consents,
    }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_curriculum_progress(request):
    """
    GET /api/v1/student/curriculum/progress
    
    Returns curriculum progress with module completion and recommended missions.
    """
    user = request.user
    
    # Check student role
    if not user.user_roles.filter(role__name='student', is_active=True).exists():
        return Response(
            {'error': 'Access denied. Student role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get curriculum data
    curriculum_data = CurriculumService.get_track_progress(user.id)
    
    return Response(curriculum_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_missions_funnel(request):
    """
    GET /api/v1/student/missions?status=pending,in_review
    
    Returns student's mission funnel with status, AI feedback, and deadlines.
    """
    user = request.user
    
    # Check student role
    if not user.user_roles.filter(role__name='student', is_active=True).exists():
        return Response(
            {'error': 'Access denied. Student role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get status filter
    status_filter = request.query_params.get('status', '').split(',')
    status_filter = [s.strip() for s in status_filter if s.strip()]
    
    # Get missions data
    missions_data = MissionsService.get_student_funnel(user.id, status_filter=status_filter)
    
    return Response(missions_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_dashboard_extended(request):
    """
    GET /api/v1/student/dashboard
    
    Extended dashboard endpoint with Future-You, AI recommendations, and subscription.
    """
    user = request.user
    
    # Check student role
    if not user.user_roles.filter(role__name='student', is_active=True).exists():
        return Response(
            {'error': 'Access denied. Student role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get or refresh cache
    cache = StudentDashboardService.get_or_create_cache(user)
    
    # Check if cache is stale (>5min) and trigger refresh
    time_since_update = timezone.now() - cache.cache_updated_at
    if time_since_update.total_seconds() > 300:  # 5 minutes
        StudentDashboardService.queue_update(user, 'stale_cache', 'normal')
    
    # Get fresh data from services
    try:
        profiler_data = ProfilerService.get_future_you(user.id)
        coaching_data = CoachingOSService.get_summary(user.id)
        curriculum_data = CurriculumService.get_track_progress(user.id)
        missions_data = MissionsService.get_student_funnel(user.id)
        portfolio_data = PortfolioService.get_health(user.id)
        talentscope_data = TalentScopeService.get_readiness(user.id)
        subscription_data = SubscriptionService.get_entitlements(user.id)
        
        # Generate AI recommendations
        ai_recommendations = AICoachService.generate_next_actions({
            'user_id': user.id,
            'readiness': float(talentscope_data.get('score', 0)),
            'gaps': talentscope_data.get('gaps', []),
            'missions_pending': len([m for m in missions_data if m.get('status') in ['pending', 'in_progress']]),
        })
    except Exception as e:
        # Fallback to cache
        profiler_data = {
            'persona': cache.future_you_persona or 'Not assessed',
            'alignment': float(cache.identity_alignment_pct or 0),
            'track': cache.recommended_track or 'Not recommended',
        }
        coaching_data = {
            'streak': cache.habit_streak_current,
            'goals_active': cache.goals_active_count,
            'goals_completed_pct': float(cache.goals_completed_pct or 0),
            'reflections_last_7d': cache.reflections_last_7d,
        }
        curriculum_data = {
            'completion': float(cache.curriculum_progress_pct or 0),
            'track': cache.recommended_track or 'Not assigned',
        }
        missions_data = []
        portfolio_data = {
            'health': float(cache.portfolio_health_score or 0),
        }
        talentscope_data = {
            'score': float(cache.readiness_score or 0),
            'gaps': cache.top_3_gaps or [],
        }
        subscription_data = {
            'tier': cache.subscription_tier or 'free',
            'enhanced_days': cache.enhanced_access_days_left,
            'next_billing': cache.next_billing_date.isoformat() if cache.next_billing_date else None,
        }
        ai_recommendations = {
            'primary': cache.top_recommendation or {},
            'nudges': cache.urgent_nudges or [],
        }
    
    # Build today summary
    readiness_trend_7d = None  # TODO: Calculate from historical data
    daily_goal_progress = f"{coaching_data.get('goals_completed_today', 0)}/{coaching_data.get('goals_total_today', 5)}"
    
    # Build quick actions
    quick_actions = []
    
    # Primary action from AI recommendations
    if ai_recommendations.get('primary'):
        primary = ai_recommendations['primary']
        quick_actions.append({
            'priority': 'high',
            'type': 'mission',
            'title': primary.get('title', 'Complete next mission'),
            'deadline': primary.get('deadline'),
            'url': f"/missions/{primary.get('mission_id', '')}" if primary.get('mission_id') else '/missions',
        })
    
    # Add urgent nudges
    for nudge in ai_recommendations.get('nudges', []):
        quick_actions.append({
            'priority': 'high' if nudge.get('type') == 'habit_broken' else 'medium',
            'type': nudge.get('type', 'habit'),
            'title': nudge.get('action', ''),
            'url': nudge.get('url', '/habits'),
        })
    
    # Build response
    response_data = {
        'user_id': str(user.id),
        'today_summary': {
            'readiness_score': float(talentscope_data.get('score', 0)),
            'readiness_trend_7d': readiness_trend_7d,
            'habit_streak': coaching_data.get('streak', 0),
            'daily_goal_progress': daily_goal_progress,
        },
        'future_you': {
            'persona': profiler_data.get('persona', 'Not assessed'),
            'alignment': f"{profiler_data.get('alignment', 0):.0f}%",
            'track': profiler_data.get('track', 'Not recommended'),
            'estimated_readiness_window': cache.estimated_readiness_window or 'Not estimated',
        },
        'quick_actions': quick_actions[:5],  # Limit to top 5
        'subscription': {
            'tier': subscription_data.get('tier', 'free'),
            'enhanced_access_days': subscription_data.get('enhanced_days', 0),
            'next_billing': subscription_data.get('next_billing'),
        },
        'cache_updated_at': cache.cache_updated_at.isoformat(),
    }
    
    # Apply entitlement gating
    tier = subscription_data.get('tier', 'free')
    response_data = StudentDashboardService.mask_for_tier(response_data, tier)
    
    return Response(response_data, status=status.HTTP_200_OK)

