"""
Celery tasks for student dashboard background jobs.
"""
from celery import shared_task
import logging
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from users.models import User
from .models import StudentDashboardCache, DashboardUpdateQueue
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

logger = logging.getLogger(__name__)


@shared_task(name='student_dashboard.refresh_dashboard')
def refresh_student_dashboard_task(user_id: int):
    """
    Celery task to refresh a student's dashboard cache.
    Aggregates data from all microservices.
    """
    try:
        user = User.objects.get(id=user_id)
        cache = DashboardAggregationService.get_or_create_cache(user)
        
        # Fetch data from all services in parallel (simulated)
        readiness_data = TalentScopeService.get_readiness(user.id)
        coaching_data = CoachingOSService.get_week_summary(user.id)
        missions_data = MissionsService.get_status(user.id)
        portfolio_data = PortfolioService.get_health(user.id)
        cohort_data = CohortService.get_student_view(user.id)
        leaderboard_data = LeaderboardService.get_rankings(user.id)
        ai_data = AICoachService.get_nudge(user.id)
        notifications_data = NotificationService.get_summary(user.id)
        
        # Update cache with fresh data
        with transaction.atomic():
            cache.readiness_score = readiness_data['score']
            cache.time_to_ready_days = readiness_data['time_to_ready_days']
            cache.skill_heatmap = readiness_data.get('skills', {})
            cache.top_3_gaps = readiness_data.get('gaps', [])
            
            cache.habit_streak_current = coaching_data.get('habit_streak', 0)
            cache.habit_completion_week = coaching_data.get('habit_completion_pct', 0)
            cache.goals_active_count = coaching_data.get('goals_active', 0)
            cache.goals_completed_week = coaching_data.get('goals_completed_week', 0)
            
            cache.missions_in_progress = missions_data.get('in_progress', 0)
            cache.missions_in_review = missions_data.get('in_review', 0)
            cache.missions_completed_total = missions_data.get('completed_total', 0)
            cache.next_mission_recommended = missions_data.get('next_recommended', {})
            
            cache.portfolio_health_score = portfolio_data.get('health_score', 0)
            cache.portfolio_items_total = portfolio_data.get('items_total', 0)
            cache.portfolio_items_approved = portfolio_data.get('items_approved', 0)
            cache.public_profile_enabled = portfolio_data.get('public_profile_enabled', False)
            cache.public_profile_slug = portfolio_data.get('public_profile_slug')
            
            if cohort_data.get('cohort_id'):
                cache.cohort_id = cohort_data['cohort_id']
            cache.cohort_name = cohort_data.get('cohort_name', '')
            cache.mentor_name = cohort_data.get('mentor_name', '')
            cache.next_cohort_event = cohort_data.get('next_event', {})
            cache.cohort_completion_pct = cohort_data.get('completion_pct', 0)
            
            cache.leaderboard_rank_global = leaderboard_data.get('global_rank')
            cache.leaderboard_rank_cohort = leaderboard_data.get('cohort_rank')
            
            cache.notifications_unread = notifications_data.get('unread', 0)
            cache.notifications_urgent = notifications_data.get('urgent', 0)
            
            cache.ai_coach_nudge = ai_data.get('nudge', '')
            cache.ai_action_plan = ai_data.get('action_plan', [])
            
            # Compute derived metrics
            cache = DashboardAggregationService._compute_derived_metrics(cache, user)
            
            cache.updated_at = timezone.now()
            cache.last_active_at = timezone.now()
            cache.save()
        
        logger.info(f"Dashboard cache refreshed for user {user.id}")
        return {'status': 'success', 'user_id': user_id}
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return {'status': 'error', 'message': f'User {user_id} not found'}
    except Exception as e:
        logger.error(f"Error refreshing dashboard for user {user_id}: {str(e)}", exc_info=True)
        return {'status': 'error', 'message': str(e)}


@shared_task(name='student_dashboard.process_update_queue')
def process_dashboard_update_queue_task():
    """
    Process queued dashboard updates.
    Runs periodically (every 5 minutes) to refresh dashboards.
    """
    # Process urgent and high priority items first
    urgent_items = DashboardUpdateQueue.objects.filter(
        priority__in=['urgent', 'high'],
        processed_at__isnull=True
    ).select_related('user')[:100]
    
    processed_count = 0
    for item in urgent_items:
        result = refresh_student_dashboard_task.delay(item.user.id)
        item.processed_at = timezone.now()
        item.save()
        processed_count += 1
    
    # Process normal priority items (batch)
    normal_items = DashboardUpdateQueue.objects.filter(
        priority='normal',
        processed_at__isnull=True,
        queued_at__lte=timezone.now() - timedelta(minutes=5)
    ).select_related('user')[:50]
    
    for item in normal_items:
        result = refresh_student_dashboard_task.delay(item.user.id)
        item.processed_at = timezone.now()
        item.save()
        processed_count += 1
    
    # Process low priority items (batch, less frequent)
    low_items = DashboardUpdateQueue.objects.filter(
        priority='low',
        processed_at__isnull=True,
        queued_at__lte=timezone.now() - timedelta(minutes=15)
    ).select_related('user')[:25]
    
    for item in low_items:
        result = refresh_student_dashboard_task.delay(item.user.id)
        item.processed_at = timezone.now()
        item.save()
        processed_count += 1
    
    # Clean up old processed items (older than 7 days)
    deleted_count = DashboardUpdateQueue.objects.filter(
        processed_at__isnull=False,
        processed_at__lt=timezone.now() - timedelta(days=7)
    ).delete()[0]
    
    logger.info(f"Processed {processed_count} dashboard updates, cleaned {deleted_count} old items")
    return {'processed': processed_count, 'cleaned': deleted_count}


@shared_task(name='student_dashboard.refresh_stale_dashboards')
def refresh_all_stale_dashboards_task():
    """
    Refresh all dashboards that are stale (>15 minutes old).
    Runs periodically to ensure data freshness.
    """
    stale_threshold = timezone.now() - timedelta(minutes=15)
    stale_caches = StudentDashboardCache.objects.filter(
        updated_at__lt=stale_threshold
    ).select_related('user')[:100]
    
    refreshed_count = 0
    for cache in stale_caches:
        refresh_student_dashboard_task.delay(cache.user.id)
        refreshed_count += 1
    
    logger.info(f"Queued refresh for {refreshed_count} stale dashboards")
    return {'refreshed': refreshed_count}

