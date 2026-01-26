"""
Calendar Service - Calendar event management and template creation.
"""
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from typing import List, Dict, Optional
import logging

from programs.models import Cohort, CalendarEvent

logger = logging.getLogger(__name__)


class CalendarService:
    """Service for calendar event management."""
    
    @staticmethod
    @transaction.atomic
    def create_calendar_from_template(
        cohort: Cohort,
        template_events: List[Dict],
        start_date_offset: int = 0
    ) -> List[CalendarEvent]:
        """
        Create calendar events from a template.
        
        Args:
            cohort: Cohort instance
            template_events: List of template event dicts with relative_day, type, title, etc.
            start_date_offset: Days to offset from cohort start_date
        
        Returns:
            List of created CalendarEvent instances
        """
        if not cohort.start_date:
            raise ValueError("Cohort must have a start_date")
        
        events = []
        base_date = cohort.start_date + timedelta(days=start_date_offset)
        
        for template in template_events:
            event_date = base_date + timedelta(days=template.get('relative_day', 0))
            
            event = CalendarEvent.objects.create(
                cohort=cohort,
                type=template.get('type', 'session'),
                title=template.get('title', 'Event'),
                description=template.get('description', ''),
                start_ts=event_date.replace(
                    hour=template.get('hour', 9),
                    minute=template.get('minute', 0)
                ),
                end_ts=event_date.replace(
                    hour=template.get('end_hour', 17),
                    minute=template.get('end_minute', 0)
                ),
                status='scheduled',
                is_mandatory=template.get('is_mandatory', True),
            )
            events.append(event)
        
        logger.info(f"Created {len(events)} calendar events for cohort {cohort.id}")
        return events
    
    @staticmethod
    @transaction.atomic
    def create_standard_cohort_calendar(cohort: Cohort) -> List[CalendarEvent]:
        """
        Create standard calendar events for a cohort:
        - Orientation (day 0)
        - Weekly mentorship sessions
        - Submission deadlines
        - Closure ceremony
        """
        if not cohort.start_date or not cohort.end_date:
            raise ValueError("Cohort must have start_date and end_date")
        
        events = []
        duration_days = (cohort.end_date - cohort.start_date).days
        
        # Orientation (day 0)
        events.append(CalendarEvent.objects.create(
            cohort=cohort,
            type='orientation',
            title='Cohort Orientation',
            description='Welcome session and program overview',
            start_ts=cohort.start_date.replace(hour=9, minute=0),
            end_ts=cohort.start_date.replace(hour=12, minute=0),
            status='scheduled',
            is_mandatory=True,
        ))
        
        # Weekly mentorship sessions (every 7 days, starting week 1)
        weeks = duration_days // 7
        for week in range(1, weeks + 1):
            session_date = cohort.start_date + timedelta(days=week * 7)
            events.append(CalendarEvent.objects.create(
                cohort=cohort,
                type='mentorship',
                title=f'Week {week} Mentorship Session',
                description='Bi-weekly mentorship check-in',
                start_ts=session_date.replace(hour=14, minute=0),
                end_ts=session_date.replace(hour=15, minute=30),
                status='scheduled',
                is_mandatory=True,
            ))
        
        # Submission deadlines (every 2 weeks)
        for week in range(2, weeks + 1, 2):
            deadline_date = cohort.start_date + timedelta(days=week * 7)
            events.append(CalendarEvent.objects.create(
                cohort=cohort,
                type='submission',
                title=f'Week {week} Assignment Deadline',
                description='Mission submission deadline',
                start_ts=deadline_date.replace(hour=23, minute=59),
                end_ts=deadline_date.replace(hour=23, minute=59),
                status='scheduled',
                is_mandatory=True,
            ))
        
        # Closure ceremony (last day)
        events.append(CalendarEvent.objects.create(
            cohort=cohort,
            type='closure',
            title='Cohort Closure Ceremony',
            description='Graduation and certificate ceremony',
            start_ts=cohort.end_date.replace(hour=10, minute=0),
            end_ts=cohort.end_date.replace(hour=12, minute=0),
            status='scheduled',
            is_mandatory=True,
        ))
        
        logger.info(f"Created standard calendar with {len(events)} events for cohort {cohort.id}")
        return events
    
    @staticmethod
    def get_cohort_calendar(cohort: Cohort) -> List[CalendarEvent]:
        """Get all calendar events for a cohort."""
        return list(CalendarEvent.objects.filter(cohort=cohort).order_by('start_ts'))
    
    @staticmethod
    @transaction.atomic
    def update_event_status(event: CalendarEvent, status: str) -> CalendarEvent:
        """Update calendar event status."""
        event.status = status
        event.save()
        return event

