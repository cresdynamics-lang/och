"""
Coaching OS Django Signals - Platform integrations.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Habit, HabitLog, Goal, Reflection
from .services import update_habit_streak, emit_coaching_event
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=HabitLog)
def on_habit_log_saved(sender, instance, created, **kwargs):
    """Update streak when habit log is saved."""
    update_habit_streak(instance.habit.id)


@receiver(post_save, sender=Goal)
def on_goal_saved(sender, instance, created, **kwargs):
    """Emit event when goal is completed."""
    if instance.status == 'completed':
        emit_coaching_event('goal.completed', {
            'user_id': str(instance.user.id),
            'goal_id': str(instance.id),
            'type': instance.type,
        })


@receiver(post_save, sender=Reflection)
def on_reflection_saved(sender, instance, created, **kwargs):
    """Emit event when reflection is saved."""
    if created:
        emit_coaching_event('reflection.saved', {
            'user_id': str(instance.user.id),
            'reflection_id': str(instance.id),
            'sentiment': instance.sentiment,
            'word_count': instance.word_count,
        })


# Profiler → Coaching integration
def on_profiler_completed(sender, instance, created, **kwargs):
    """
    Create onboarding habits when Profiler is completed.
    This signal is triggered from profiler app.
    """
    # Check if profiler is finished (status='finished')
    if instance.status == 'finished':
        from .models import Habit
        
        # Create 3 core habits
        core_habits = [
            {'name': 'Learn', 'type': 'core', 'frequency': 'daily'},
            {'name': 'Practice', 'type': 'core', 'frequency': 'daily'},
            {'name': 'Reflect', 'type': 'core', 'frequency': 'daily'},
        ]
        
        for habit_data in core_habits:
            Habit.objects.get_or_create(
                user=instance.user,
                name=habit_data['name'],
                type=habit_data['type'],
                defaults={
                    'frequency': habit_data['frequency'],
                    'is_active': True,
                }
            )
        
        logger.info(f"Created onboarding habits for user {instance.user.id}")


# Register signal in profiler app's ready() method
# This will be imported by profiler app

