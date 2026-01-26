"""
Celery tasks for Student Dashboard cache refresh.
"""
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from users.models import User
from .models import StudentDashboardCache, DashboardUpdateQueue
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


@shared_task
def refresh_student_dashboard_cache(user_id: int):
    """
    Refresh student dashboard cache by aggregating data from all services.
    Called every 5 minutes for active users or on-demand for urgent updates.
    """
    try:
        user = User.objects.get(id=user_id)
        cache = StudentDashboardService.get_or_create_cache(user)
        
        # Aggregate data from all services
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
        
        # Update cache
        with transaction.atomic():
            cache.future_you_persona = profiler_data.get('persona', '')
            cache.recommended_track = profiler_data.get('track', '')
            cache.identity_alignment_pct = profiler_data.get('alignment', 0)
            
            cache.habit_streak_current = coaching_data.get('streak', 0)
            cache.goals_active_count = coaching_data.get('goals_active', 0)
            cache.goals_completed_pct = coaching_data.get('goals_completed_pct', 0)
            cache.reflections_last_7d = coaching_data.get('reflections_last_7d', 0)
            
            cache.curriculum_progress_pct = curriculum_data.get('completion', 0)
            
            cache.missions_in_progress = len([m for m in missions_data if m.get('status') == 'in_progress'])
            cache.missions_in_review = len([m for m in missions_data if m.get('status') == 'in_review'])
            cache.missions_completed_total = len([m for m in missions_data if m.get('status') == 'approved'])
            
            cache.portfolio_health_score = portfolio_data.get('health', 0)
            
            cache.readiness_score = talentscope_data.get('score', 0)
            cache.time_to_ready_days = talentscope_data.get('time_to_ready_days', 365)
            cache.top_3_gaps = talentscope_data.get('gaps', [])[:3]
            
            cache.subscription_tier = subscription_data.get('tier', 'free')
            cache.enhanced_access_days_left = subscription_data.get('enhanced_days')
            if subscription_data.get('next_billing'):
                from datetime import datetime
                cache.next_billing_date = datetime.fromisoformat(subscription_data['next_billing']).date()
            
            cache.top_recommendation = ai_recommendations.get('primary', {})
            cache.urgent_nudges = ai_recommendations.get('nudges', [])
            
            cache.cache_updated_at = timezone.now()
            cache.updated_at = timezone.now()
            cache.save()
        
        return {'status': 'success', 'user_id': user_id}
    except User.DoesNotExist:
        return {'status': 'error', 'message': f'User {user_id} not found'}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


@shared_task
def process_dashboard_update_queue():
    """
    Process queued dashboard updates.
    Runs every minute to handle urgent/high priority updates.
    """
    # Get unprocessed updates, prioritizing urgent/high
    updates = DashboardUpdateQueue.objects.filter(
        processed_at__isnull=True
    ).order_by('-priority', 'queued_at')[:100]
    
    for update in updates:
        try:
            refresh_student_dashboard_cache.delay(update.user.id)
            update.processed_at = timezone.now()
            update.save()
        except Exception as e:
            # Log error but continue processing
            print(f"Error processing update {update.id}: {e}")
    
    return {'processed': updates.count()}


@shared_task
def refresh_all_active_student_dashboards():
    """
    Refresh dashboards for all active students.
    Runs every 5 minutes to keep caches fresh.
    """
    from django.db.models import Q
    
    # Get active students (logged in within last 30 days)
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    active_students = User.objects.filter(
        Q(user_roles__role__name='student', user_roles__is_active=True) &
        Q(last_login__gte=thirty_days_ago)
    ).distinct()[:1000]  # Limit to 1000 to avoid overload
    
    for student in active_students:
        refresh_student_dashboard_cache.delay(student.id)
    
    return {'refreshed': active_students.count()}
