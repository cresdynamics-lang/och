"""
Coaching OS Services - Business logic and integrations.
"""
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg, Max
from django.db import transaction
from .models import Habit, HabitLog, Goal, Reflection, AICoachSession
from talentscope.models import BehaviorSignal
from subscriptions.utils import get_user_tier
from subscriptions.models import UserSubscription
import logging

logger = logging.getLogger(__name__)


def update_habit_streak(habit_id):
    """
    Recalculate habit streak from logs.
    Called after each habit log update.
    """
    try:
        habit = Habit.objects.get(id=habit_id)
    except Habit.DoesNotExist:
        return
    
    logs = HabitLog.objects.filter(
        habit=habit
    ).order_by('-date')
    
    if not logs.exists():
        habit.streak = 0
        habit.save()
        return
    
    # Calculate current streak
    today = date.today()
    current_streak = 0
    check_date = today
    
    # Check today first
    today_log = logs.filter(date=today).first()
    if today_log and today_log.status == 'completed':
        current_streak = 1
        check_date = today - timedelta(days=1)
    elif today_log and today_log.status == 'skipped':
        # Skipped doesn't break streak but doesn't count
        check_date = today - timedelta(days=1)
    
    # Count backwards
    while True:
        log = logs.filter(date=check_date).first()
        
        if log and log.status == 'completed':
            current_streak += 1
            check_date -= timedelta(days=1)
        elif log and log.status == 'skipped':
            # Skipped doesn't break streak
            check_date -= timedelta(days=1)
        else:
            # Missed or no log breaks streak
            break
        
        # Safety limit
        if current_streak > 365:
            break
    
    # Update streak
    habit.streak = current_streak
    if current_streak > habit.longest_streak:
        habit.longest_streak = current_streak
    habit.save()


def calculate_coaching_metrics(user):
    """
    Calculate comprehensive coaching metrics:
    - Alignment score (Future-You alignment)
    - Total streak days
    - Active habits count
    - Completed goals count
    - Reflection count
    """
    # Get active habits
    active_habits = Habit.objects.filter(user=user, is_active=True)
    
    # Calculate total streak days (sum of all habit streaks)
    total_streak_days = active_habits.aggregate(
        total=Sum('streak')
    )['total'] or 0
    
    # Get completed goals
    completed_goals = Goal.objects.filter(
        user=user,
        status='completed'
    ).count()
    
    # Get reflection count
    reflection_count = Reflection.objects.filter(user=user).count()
    
    # Calculate alignment score (0-100)
    # Formula: (habit_streak_weight * 40) + (goal_completion_weight * 30) + (reflection_weight * 30)
    habit_score = min(40, (total_streak_days / 30) * 40)  # Max 40 points for 30+ day streak
    goal_score = min(30, (completed_goals / 10) * 30)  # Max 30 points for 10+ goals
    reflection_score = min(30, (reflection_count / 20) * 30)  # Max 30 points for 20+ reflections
    
    alignment_score = round(habit_score + goal_score + reflection_score)
    alignment_score = min(100, max(0, alignment_score))
    
    # Get last reflection date
    last_reflection = Reflection.objects.filter(user=user).order_by('-date').first()
    last_reflection_date = last_reflection.date.isoformat() if last_reflection else None
    
    return {
        'alignmentScore': alignment_score,
        'totalStreakDays': total_streak_days,
        'activeHabits': active_habits.count(),
        'completedGoals': completed_goals,
        'reflectionCount': reflection_count,
        'lastReflectionDate': last_reflection_date,
    }


def check_coaching_entitlement(user, feature):
    """
    Check if user has entitlement for a coaching feature.
    
    Features:
    - 'ai_coach_full': Full AI Coach access (premium only)
    - 'mentor_feedback': Mentor feedback on goals (premium only)
    - 'unlimited_reflections': Unlimited reflections (all tiers)
    - 'custom_habits': Custom habits (starter+)
    """
    try:
        subscription = UserSubscription.objects.get(user=user, status='active')
        tier = subscription.plan.tier
        # Check enhanced access
        has_enhanced = subscription.enhanced_access_expires_at and \
                       subscription.enhanced_access_expires_at > timezone.now() if hasattr(subscription, 'enhanced_access_expires_at') else False
    except UserSubscription.DoesNotExist:
        tier = 'free'
        has_enhanced = False
    
        # TEMP: Allow AI coach for testing
    if user.email == 'coaching-test@example.com':
        return feature == 'ai_coach_full'
    
    entitlements = {
        'ai_coach_full': tier in ['premium'] or has_enhanced,
        'mentor_feedback': tier in ['premium'] or has_enhanced,
        'unlimited_reflections': True,  # All tiers
        'custom_habits': tier in ['starter', 'premium'] or has_enhanced,
    }
    
    return entitlements.get(feature, False)


def check_ai_coach_rate_limit(user, session):
    """
    Check if user has exceeded AI Coach rate limit.
    Returns True if within limit, False if exceeded.
    """
    try:
        subscription = UserSubscription.objects.get(user=user, status='active')
        tier = subscription.plan.tier
        daily_limit = subscription.plan.ai_coach_daily_limit
        # Check enhanced access
        has_enhanced = hasattr(subscription, 'enhanced_access_expires_at') and \
                       subscription.enhanced_access_expires_at and \
                       subscription.enhanced_access_expires_at > timezone.now()
    except UserSubscription.DoesNotExist:
        subscription = None
        tier = 'free'
        daily_limit = 5  # Free tier: 5 per day
        has_enhanced = False

    # Premium or enhanced = unlimited
    if tier == 'premium' or has_enhanced:
        return True
    
    # Check today's usage
    today = timezone.now().date()
    today_sessions = AICoachSession.objects.filter(
        user=user,
        created_at__date=today
    )
    
    total_prompts = sum(s.prompt_count for s in today_sessions)
    
    return total_prompts < (daily_limit or 999999)


def emit_coaching_event(event_type, data):
    """
    Emit coaching event for cross-system coordination.
    Events:
    - habit.logged
    - goal.completed
    - reflection.saved
    - ai_coach.session
    - habit.created
    - goal.created
    """
    # Log event
    logger.info(f"Coaching event: {event_type}", extra=data)
    
    # TODO: Integrate with event bus (Redis pub/sub, Celery, etc.)
    # For now, we'll use Django signals or direct function calls
    
    # Trigger platform integrations
    if event_type == 'habit.logged':
        _on_habit_logged(data)
    elif event_type == 'goal.completed':
        _on_goal_completed(data)
    elif event_type == 'reflection.saved':
        _on_reflection_saved(data)


def _on_habit_logged(data):
    """Handle habit.logged event - unlock missions, update TalentScope."""
    user_id = data.get('user_id')
    status = data.get('status')
    
    if status == 'completed':
        # TalentScope signal already created in views.log_habit
        # Mission unlock is checked via can_start_mission() in missions/views_mxp.py
        pass


def _on_goal_completed(data):
    """Handle goal.completed event - portfolio update, leaderboard."""
    user_id = data.get('user_id')
    goal_id = data.get('goal_id')
    
    # Update portfolio if goal is portfolio-related
    # Update leaderboard
    pass


def _on_reflection_saved(data):
    """Handle reflection.saved event - TalentScope update, mentor notification."""
    user_id = data.get('user_id')
    reflection_id = data.get('reflection_id')
    sentiment = data.get('sentiment')
    
    # TalentScope signal already created in view
    # Check if mentor should be notified (7-tier only)
    pass

