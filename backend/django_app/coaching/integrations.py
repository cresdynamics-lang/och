"""
Coaching OS Platform Integrations - Missions gatekeeping, TalentScope signals.
"""
from django.db.models import Q
from .models import Habit, HabitLog, Goal, Reflection
from .services import calculate_coaching_metrics
from talentscope.models import BehaviorSignal
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


def can_start_mission(user, mission_id=None):
    """
    Check if user can start a mission based on coaching metrics.
    
    Rules:
    - Habit streak >= 3 days
    - Has recent reflection (within 7 days)
    """
    metrics = calculate_coaching_metrics(user)
    
    # Check habit streak
    if metrics['totalStreakDays'] < 3:
        return False, 'Complete 3-day habit streak first. Log your daily habits!'
    
    # Check recent reflection
    seven_days_ago = date.today() - timedelta(days=7)
    recent_reflection = Reflection.objects.filter(
        user=user,
        date__gte=seven_days_ago
    ).exists()
    
    if not recent_reflection:
        return False, 'Log a daily reflection to unlock missions. Reflect on your progress!'
    
    return True, None


def check_mission_eligibility(user, mission_id=None):
    """
    Comprehensive mission eligibility check with detailed gates.
    Returns eligibility status, gates, and coaching score multiplier.
    """
    metrics = calculate_coaching_metrics(user)
    issues = []
    warnings = []
    
    # Check habit streak
    if metrics['totalStreakDays'] < 3:
        issues.append({
            'type': 'habit_streak',
            'message': f'Complete {3 - metrics["totalStreakDays"]} more days of habits',
            'action': 'Log daily habits in Coaching OS',
            'priority': 'blocking'
        })
    
    # Check recent reflection
    seven_days_ago = date.today() - timedelta(days=7)
    recent_reflection = Reflection.objects.filter(
        user=user,
        date__gte=seven_days_ago
    ).exists()
    
    if not recent_reflection:
        warnings.append({
            'type': 'reflection',
            'message': 'No reflection in last 7 days',
            'action': 'Log reflection for full scoring',
            'priority': 'warning',
            'score_penalty': 0.20
        })
    
    # Check incomplete goals
    incomplete_goals = Goal.objects.filter(
        user=user,
        status='active'
    ).count()
    
    if incomplete_goals > 2:
        warnings.append({
            'type': 'goals',
            'message': f'{incomplete_goals} active goals incomplete',
            'action': 'Complete goals for optimal learning',
            'priority': 'suggestion'
        })
    
    eligible = len(issues) == 0
    
    # Calculate score multiplier
    multiplier = 1.0
    if not recent_reflection:
        multiplier -= 0.20
    if metrics['alignmentScore'] > 80:
        multiplier += 0.10
    if metrics['totalStreakDays'] > 14:
        multiplier += 0.05
    
    multiplier = max(0.5, min(1.5, multiplier))
    
    return {
        'eligible': eligible,
        'gates': issues,
        'warnings': warnings,
        'coachingScore': metrics['alignmentScore'],
        'scoreMultiplier': multiplier,
        'metrics': metrics
    }


def get_mission_score_multiplier(user):
    """
    Get mission score multiplier based on coaching metrics.
    
    - Missing reflection: -20% multiplier
    - High alignment score (>80%): +10% multiplier
    - Long streak (>14 days): +5% multiplier
    """
    multiplier = 1.0
    metrics = calculate_coaching_metrics(user)
    
    # Check recent reflection
    seven_days_ago = date.today() - timedelta(days=7)
    recent_reflection = Reflection.objects.filter(
        user=user,
        date__gte=seven_days_ago
    ).exists()
    
    if not recent_reflection:
        multiplier -= 0.20
    
    # High alignment bonus
    if metrics['alignmentScore'] > 80:
        multiplier += 0.10
    
    # Long streak bonus
    if metrics['totalStreakDays'] > 14:
        multiplier += 0.05
    
    return max(0.5, min(1.5, multiplier))  # Clamp between 0.5x and 1.5x


def sync_mission_to_coaching(user, mission_id, mission_title, score):
    """
    Sync mission completion to coaching OS.
    Auto-logs Practice habit and boosts relevant goals.
    """
    from django.utils import timezone
    today = date.today()
    
    # Get or create Practice habit
    practice_habit, _ = Habit.objects.get_or_create(
        user=user,
        name='Practice',
        type='core',
        defaults={
            'frequency': 'daily',
            'is_active': True,
        }
    )
    
    # Auto-log Practice habit for today
    HabitLog.objects.update_or_create(
        habit=practice_habit,
        user=user,
        date=today,
        defaults={
            'status': 'completed',
            'notes': f'Mission: {mission_title} (Score: {score}%)'
        }
    )
    
    # Update streak
    from .services import update_habit_streak
    update_habit_streak(practice_habit.id)
    
    # Boost relevant goals (missions-related)
    goals = Goal.objects.filter(
        user=user,
        status='active',
        type__in=['daily', 'weekly']
    )
    
    for goal in goals:
        if 'mission' in goal.title.lower() or 'practice' in goal.title.lower():
            boost = int(score / 5)  # 20% of score as boost
            goal.current = min(goal.target, goal.current + boost)
            goal.progress = int((goal.current / goal.target) * 100)
            goal.save()
    
    logger.info(f"Synced mission {mission_id} to coaching for user {user.id}")


def sync_to_talentscope(user, event_type, data):
    """
    Sync coaching events to TalentScope behavior signals.
    Called from emit_coaching_event.
    """
    if event_type == 'habit.logged' and data.get('status') == 'completed':
        # Already handled in views.log_habit
        pass
    
    elif event_type == 'reflection.saved':
        # Already handled in views.reflections_list
        pass
    
    elif event_type == 'goal.completed':
        # Already handled in views.goal_detail
        pass
