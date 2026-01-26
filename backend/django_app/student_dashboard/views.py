"""
API views for Student Dashboard endpoints.
"""
import json
from datetime import datetime, timedelta
from django.http import StreamingHttpResponse, JsonResponse
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User
from .models import StudentDashboardCache, DashboardUpdateQueue
from .serializers import (
    StudentDashboardSerializer,
    DashboardActionSerializer,
    ReadinessSerializer,
    PrimaryActionSerializer,
    SecondaryActionSerializer,
    QuickStatsSerializer,
    CohortCardSerializer,
    SubscriptionCardSerializer,
    NotificationsSerializer,
    LeaderboardSerializer,
)
from .services import (
    DashboardAggregationService,
    TalentScopeService,
    CoachingOSService,
    MissionsService,
    PortfolioService,
    CohortService,
    AICoachService,
    NotificationService,
    LeaderboardService,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_dashboard(request):
    """
    GET /api/v1/student/dashboard
    
    Returns aggregated student dashboard data.
    Query params:
    - include_notifications: bool (default: true)
    - include_ai_nudge: bool (default: true)
    """
    user = request.user
    
    # Check if user has student role
    if not user.user_roles.filter(role__name='student', is_active=True).exists():
        return Response(
            {'error': 'Access denied. Student role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    include_notifications = request.query_params.get('include_notifications', 'true').lower() == 'true'
    include_ai_nudge = request.query_params.get('include_ai_nudge', 'true').lower() == 'true'
    
    # Get or refresh cache
    cache = DashboardAggregationService.get_or_create_cache(user)
    
    # Check if cache is stale (>15min) and trigger refresh if needed
    time_since_update = timezone.now() - cache.updated_at
    if time_since_update.total_seconds() > 900:  # 15 minutes
        DashboardAggregationService.queue_update(user, 'stale_cache', 'high')
        # Still return cached data, but refresh in background
    
    # Get fresh data from services (or use cache if services unavailable)
    try:
        readiness_data = TalentScopeService.get_readiness(user.id)
        coaching_data = CoachingOSService.get_week_summary(user.id)
        missions_data = MissionsService.get_status(user.id)
        portfolio_data = PortfolioService.get_health(user.id)
        cohort_data = CohortService.get_student_view(user.id)
        leaderboard_data = LeaderboardService.get_rankings(user.id)
        
        if include_ai_nudge:
            ai_data = AICoachService.get_nudge(user.id)
        else:
            ai_data = {'nudge': None, 'action_plan': []}
        
        if include_notifications:
            notifications_data = NotificationService.get_summary(user.id)
        else:
            notifications_data = {'unread': 0, 'urgent': 0, 'summary': []}
    except Exception as e:
        # Fallback to cache if services are down
        readiness_data = {
            'score': float(cache.readiness_score),
            'time_to_ready_days': cache.time_to_ready_days,
            'trend_7d': None,
            'gaps': cache.top_3_gaps or [],
        }
        coaching_data = {
            'habit_streak': cache.habit_streak_current,
            'habit_completion_pct': float(cache.habit_completion_week),
            'goals_active': cache.goals_active_count,
            'goals_completed_week': cache.goals_completed_week,
        }
        missions_data = {
            'in_progress': cache.missions_in_progress,
            'in_review': cache.missions_in_review,
            'completed_total': cache.missions_completed_total,
            'next_recommended': cache.next_mission_recommended or {},
        }
        portfolio_data = {
            'health_score': float(cache.portfolio_health_score),
            'items_total': cache.portfolio_items_total,
            'items_approved': cache.portfolio_items_approved,
            'public_profile_enabled': cache.public_profile_enabled,
            'public_profile_slug': cache.public_profile_slug,
        }
        cohort_data = {
            'cohort_id': str(cache.cohort_id) if cache.cohort_id else None,
            'cohort_name': cache.cohort_name,
            'mentor_name': cache.mentor_name,
            'next_event': cache.next_cohort_event or {},
            'completion_pct': float(cache.cohort_completion_pct),
        }
        leaderboard_data = {
            'global_rank': cache.leaderboard_rank_global,
            'cohort_rank': cache.leaderboard_rank_cohort,
        }
        ai_data = {
            'nudge': cache.ai_coach_nudge,
            'action_plan': cache.ai_action_plan or [],
        }
        notifications_data = {
            'unread': cache.notifications_unread,
            'urgent': cache.notifications_urgent,
            'summary': [],
        }
    
    # Build response
    next_mission = missions_data.get('next_recommended', {})
    primary_action = {
        'type': 'mission',
        'title': next_mission.get('title', 'No missions available'),
        'priority': 'high',
        'cta': f"/missions/{next_mission.get('id', '')}/start" if next_mission.get('id') else '/missions',
        'est_hours': next_mission.get('est_hours'),
    }
    
    secondary_actions = []
    if coaching_data.get('habit_streak', 0) > 0:
        secondary_actions.append({
            'type': 'habit',
            'title': 'Daily CTF',
            'streak': coaching_data['habit_streak'],
        })
    secondary_actions.append({
        'type': 'reflection',
        'title': "Yesterday's learning",
    })
    
    # Get subscription tier from user (mock for now)
    subscription_tier = getattr(user, 'subscription_tier', 'free') or 'free'
    enhanced_access_expires = getattr(user, 'enhanced_access_expires_at', None)
    days_enhanced_left = None
    if enhanced_access_expires:
        days_enhanced_left = max(0, (enhanced_access_expires - timezone.now()).days)
    
    response_data = {
        'readiness': {
            'score': readiness_data['score'],
            'time_to_ready': readiness_data['time_to_ready_days'],
            'trend_7d': readiness_data.get('trend_7d'),
            'gaps': readiness_data.get('gaps', []),
        },
        'today': {
            'primary_action': primary_action,
            'secondary_actions': secondary_actions,
        },
        'quick_stats': {
            'habits_week': coaching_data.get('habit_completion_pct', 0),
            'missions_in_review': missions_data.get('in_review', 0),
            'portfolio_health': portfolio_data.get('health_score', 0),
            'cohort_progress': cohort_data.get('completion_pct', 0),
        },
        'cards': {
            'cohort': {
                'name': cohort_data.get('cohort_name', 'No cohort assigned'),
                'mentor': cohort_data.get('mentor_name'),
                'next_event': cohort_data.get('next_event'),
            },
            'subscription': {
                'tier': subscription_tier,
                'days_enhanced_left': days_enhanced_left,
                'upgrade_cta': {
                    'title': 'Unlock Mentor Feedback',
                    'url': '/billing/upgrade',
                } if subscription_tier == 'free' else None,
            },
        },
        'notifications': {
            'unread': notifications_data.get('unread', 0),
            'urgent': notifications_data.get('urgent', 0),
            'summary': notifications_data.get('summary', []),
        },
        'leaderboard': {
            'global_rank': leaderboard_data.get('global_rank'),
            'cohort_rank': leaderboard_data.get('cohort_rank'),
        },
        'ai_nudge': ai_data.get('nudge'),
        'last_updated': cache.updated_at.isoformat(),
    }
    
    # Mask premium features for free tier
    if subscription_tier == 'free':
        response_data = DashboardAggregationService.mask_for_tier(response_data, subscription_tier)
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_dashboard_action(request):
    """
    POST /api/v1/student/dashboard/action
    
    Track user actions and trigger dashboard updates.
    """
    user = request.user
    
    serializer = DashboardActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    action = serializer.validated_data['action']
    
    # Determine priority based on action type
    priority_map = {
        'mission_completed': 'high',
        'mission_approved': 'urgent',
        'habit_logged': 'normal',
        'reflection_created': 'low',
        'payment_succeeded': 'urgent',
        'mission_started': 'normal',
    }
    priority = priority_map.get(action, 'normal')
    
    # Queue dashboard update
    DashboardAggregationService.queue_update(user, action, priority)
    
    # Update cache immediately for critical actions
    if priority in ['urgent', 'high']:
        try:
            DashboardAggregationService.refresh_dashboard_cache(user, force=True)
        except Exception:
            pass  # Background worker will handle it
    
    return Response({
        'status': 'queued',
        'action': action,
        'priority': priority,
    }, status=status.HTTP_202_ACCEPTED)


def stream_dashboard_updates(request):
    """
    GET /api/v1/student/dashboard/stream
    
    Server-Sent Events (SSE) stream for real-time dashboard updates.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    user = request.user
    
    def event_stream():
        """Generator for SSE events."""
        last_cache = None
        
        while True:
            try:
                # Get latest cache
                cache = DashboardAggregationService.get_or_create_cache(user)
                
                # Only send if data changed
                if last_cache is None or cache.updated_at > last_cache:
                    data = {
                        'readiness': {
                            'score': float(cache.readiness_score),
                            'time_to_ready': cache.time_to_ready_days,
                        },
                        'missions_in_review': cache.missions_in_review,
                        'habit_streak': cache.habit_streak_current,
                        'notifications': {
                            'unread': cache.notifications_unread,
                            'urgent': cache.notifications_urgent,
                        },
                        'timestamp': cache.updated_at.isoformat(),
                    }
                    
                    yield f"data: {json.dumps(data)}\n\n"
                    last_cache = cache.updated_at
                
                # Sleep for 5 seconds before next check
                import time
                time.sleep(5)
                
            except Exception as e:
                # Send error event
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
    
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response
