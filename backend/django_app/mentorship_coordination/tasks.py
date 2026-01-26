"""
Background tasks for Mentorship Coordination Engine.
"""
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    # Mock decorator if Celery not available
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


@shared_task
def auto_match_mentors(cohort_id=None):
    """
    Auto-match unassigned mentees with available mentors.
    """
    from .models import MenteeMentorAssignment
    
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available, skipping auto-match")
        return
    
    # Get available mentors
    available_mentors = User.objects.filter(
        is_mentor=True,
        is_active=True
    ).exclude(
        mentor_assignments__status='active'
    )[:100]  # Limit for performance
    
    # Get unassigned mentees
    unassigned_mentees = User.objects.filter(
        is_active=True,
        mentee_assignments__isnull=True
    )
    
    if cohort_id:
        unassigned_mentees = unassigned_mentees.filter(cohort_id=cohort_id)
    
    matches_created = 0
    
    for mentee in unassigned_mentees[:50]:  # Limit batch size
        # Simple matching logic (would use AI in production)
        best_mentor = None
        
        # Try to match by specialties/track
        if mentee.track_key:
            for mentor in available_mentors:
                specialties = mentor.mentor_specialties or []
                if mentee.track_key.lower() in [s.lower() for s in specialties]:
                    best_mentor = mentor
                    break
        
        # Fallback to first available
        if not best_mentor and available_mentors.exists():
            best_mentor = available_mentors.first()
        
        if best_mentor:
            with transaction.atomic():
                assignment, created = MenteeMentorAssignment.objects.get_or_create(
                    mentee=mentee,
                    mentor=best_mentor,
                    defaults={
                        'status': 'active',
                        'cohort_id': cohort_id or mentee.cohort_id
                    }
                )
                if created:
                    matches_created += 1
                    logger.info(f"Matched {mentee.email} with {best_mentor.email}")
    
    return {'matches_created': matches_created}


@shared_task
def prioritize_work_queue():
    """
    Prioritize work queue items - mark overdue items.
    Runs every 5 minutes.
    """
    from .models import MentorWorkQueue
    
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available, skipping work queue prioritization")
        return
    
    now = timezone.now()
    
    # Find overdue items
    overdue = MentorWorkQueue.objects.filter(
        due_at__lt=now,
        status__in=['pending', 'in_progress']
    )
    
    updated = overdue.update(
        status='overdue',
        priority='urgent'
    )
    
    logger.info(f"Marked {updated} work queue items as overdue")
    return {'overdue_count': updated}


@shared_task
def check_mentor_capacity(mentor_id):
    """
    Check mentor capacity and notify if over limit.
    """
    from .models import MentorSession
    
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available, skipping capacity check")
        return
    
    try:
        mentor = User.objects.get(id=mentor_id, is_mentor=True)
    except User.DoesNotExist:
        return {'error': 'Mentor not found'}
    
    # Count sessions this week
    week_start = timezone.now() - timedelta(days=timezone.now().weekday())
    weekly_sessions = MentorSession.objects.filter(
        mentor=mentor,
        start_time__gte=week_start
    ).count()
    
    if weekly_sessions > mentor.mentor_capacity_weekly:
        # Would notify director here
        logger.warning(
            f"Mentor {mentor.email} over capacity: "
            f"{weekly_sessions}/{mentor.mentor_capacity_weekly}"
        )
        return {
            'over_capacity': True,
            'weekly_sessions': weekly_sessions,
            'capacity': mentor.mentor_capacity_weekly
        }
    
    return {'over_capacity': False}


@shared_task
def create_mission_review_queue_item(submission_id, mentor_id):
    """
    Create work queue item when mission is submitted.
    """
    from .models import MentorWorkQueue
    from missions.models import MissionSubmission
    
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available, skipping mission review queue creation")
        return
    
    try:
        submission = MissionSubmission.objects.get(id=submission_id)
        mentor = User.objects.get(id=mentor_id, is_mentor=True)
    except (MissionSubmission.DoesNotExist, User.DoesNotExist):
        return {'error': 'Submission or mentor not found'}
    
    # Check if assignment exists
    from .models import MenteeMentorAssignment
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee=submission.user,
        status='active'
    ).first()
    
    if not assignment:
        return {'error': 'No active assignment'}
    
    # Create work queue item
    due_at = timezone.now() + timedelta(hours=48)  # 48h SLA
    
    work_item, created = MentorWorkQueue.objects.get_or_create(
        mentor=mentor,
        mentee=submission.user,
        type='mission_review',
        reference_id=submission_id,
        status='pending',
        defaults={
            'priority': 'high',
            'title': f"Mission Review: {submission.mission.title if hasattr(submission, 'mission') else 'Mission'}",
            'description': f"Review mission submission from {submission.user.email}",
            'sla_hours': 48,
            'due_at': due_at
        }
    )
    
    if created:
        logger.info(f"Created work queue item for mission review: {submission_id}")
    
    return {'created': created, 'work_item_id': str(work_item.id)}

