"""
Cohort Lifecycle Management API for Directors.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta

from ..models import Cohort, Enrollment, CalendarEvent
from ..serializers import CohortSerializer
from ..permissions import IsProgramDirector

import logging

logger = logging.getLogger(__name__)


class DirectorCohortLifecycleViewSet(viewsets.ViewSet):
    """Director Cohort Lifecycle Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    
    def get_cohort(self, cohort_id, user):
        """Get cohort with permission check."""
        try:
            cohort = Cohort.objects.get(id=cohort_id)
            if not user.is_staff and cohort.track.director != user:
                return None
            return cohort
        except Cohort.DoesNotExist:
            return None
    
    @action(detail=True, methods=['post'])
    def transition_status(self, request, pk=None):
        """Transition cohort to new status with validation."""
        cohort = self.get_cohort(pk, request.user)
        if not cohort:
            return Response(
                {'error': 'Cohort not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        if new_status not in dict(Cohort.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Status transition validation
        valid_transitions = {
            'draft': ['active'],
            'active': ['running', 'draft'],
            'running': ['closing'],
            'closing': ['closed'],
            'closed': []
        }
        
        if new_status not in valid_transitions.get(cohort.status, []):
            return Response(
                {'error': f'Cannot transition from {cohort.status} to {new_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Perform transition with side effects
        with transaction.atomic():
            old_status = cohort.status
            cohort.status = new_status
            
            # Handle status-specific logic
            if new_status == 'active':
                # Validate cohort is ready to be active
                if not cohort.start_date or not cohort.end_date:
                    return Response(
                        {'error': 'Start and end dates required for active status'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Auto-generate calendar events if none exist
                if not cohort.calendar_events.exists():
                    self._generate_default_events(cohort)
            
            elif new_status == 'running':
                # Mark all pending enrollments as active
                cohort.enrollments.filter(status='pending_payment').update(
                    status='active'
                )
            
            elif new_status == 'closed':
                # Mark all active enrollments as completed
                cohort.enrollments.filter(status='active').update(
                    status='completed',
                    completed_at=timezone.now()
                )
            
            cohort.save()
        
        return Response({
            'message': f'Cohort status changed from {old_status} to {new_status}',
            'cohort': CohortSerializer(cohort).data
        })
    
    @action(detail=True, methods=['put'])
    def advanced_edit(self, request, pk=None):
        """Advanced cohort editing with validation."""
        cohort = self.get_cohort(pk, request.user)
        if not cohort:
            return Response(
                {'error': 'Cohort not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent editing of closed cohorts
        if cohort.status == 'closed':
            return Response(
                {'error': 'Cannot edit closed cohorts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CohortSerializer(cohort, data=request.data, partial=True)
        if serializer.is_valid():
            # Validate seat cap changes
            new_seat_cap = request.data.get('seat_cap')
            if new_seat_cap and new_seat_cap < cohort.enrollments.filter(status='active').count():
                return Response(
                    {'error': 'Cannot reduce seat cap below current active enrollments'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cohort = serializer.save()
            return Response(CohortSerializer(cohort).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def lifecycle_info(self, request, pk=None):
        """Get cohort lifecycle information and available transitions."""
        cohort = self.get_cohort(pk, request.user)
        if not cohort:
            return Response(
                {'error': 'Cohort not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        valid_transitions = {
            'draft': ['active'],
            'active': ['running', 'draft'],
            'running': ['closing'],
            'closing': ['closed'],
            'closed': []
        }
        
        # Calculate lifecycle metrics
        total_enrollments = cohort.enrollments.count()
        active_enrollments = cohort.enrollments.filter(status='active').count()
        completed_enrollments = cohort.enrollments.filter(status='completed').count()
        
        # Check readiness for transitions
        readiness_checks = {}
        if cohort.status == 'draft':
            readiness_checks['active'] = {
                'ready': bool(cohort.start_date and cohort.end_date and cohort.seat_cap > 0),
                'requirements': [
                    {'check': 'start_date', 'status': bool(cohort.start_date), 'message': 'Start date required'},
                    {'check': 'end_date', 'status': bool(cohort.end_date), 'message': 'End date required'},
                    {'check': 'seat_cap', 'status': cohort.seat_cap > 0, 'message': 'Seat capacity required'},
                ]
            }
        
        return Response({
            'current_status': cohort.status,
            'available_transitions': valid_transitions.get(cohort.status, []),
            'readiness_checks': readiness_checks,
            'metrics': {
                'total_enrollments': total_enrollments,
                'active_enrollments': active_enrollments,
                'completed_enrollments': completed_enrollments,
                'seat_utilization': (active_enrollments / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0,
                'days_until_start': (cohort.start_date - timezone.now().date()).days if cohort.start_date else None,
                'days_until_end': (cohort.end_date - timezone.now().date()).days if cohort.end_date else None,
            }
        })
    
    def _generate_default_events(self, cohort):
        """Generate default calendar events for cohort."""
        if not cohort.start_date or not cohort.end_date:
            return
        
        duration_days = (cohort.end_date - cohort.start_date).days
        
        events = [
            {
                'type': 'orientation',
                'title': f'{cohort.name} Orientation',
                'description': 'Welcome and program overview',
                'days_offset': 0,
                'duration_hours': 2
            },
            {
                'type': 'session',
                'title': 'Mid-Program Check-in',
                'description': 'Progress review and mentorship matching',
                'days_offset': duration_days // 2,
                'duration_hours': 1
            },
            {
                'type': 'submission',
                'title': 'Final Project Submission',
                'description': 'Portfolio and project submissions due',
                'days_offset': duration_days - 7,
                'duration_hours': 0
            },
            {
                'type': 'closure',
                'title': f'{cohort.name} Graduation',
                'description': 'Final presentations and certificate ceremony',
                'days_offset': duration_days,
                'duration_hours': 3
            }
        ]
        
        for event_data in events:
            event_date = cohort.start_date + timedelta(days=event_data['days_offset'])
            start_time = datetime.combine(event_date, datetime.min.time().replace(hour=10))
            end_time = start_time + timedelta(hours=event_data['duration_hours'])
            
            CalendarEvent.objects.create(
                cohort=cohort,
                type=event_data['type'],
                title=event_data['title'],
                description=event_data['description'],
                start_ts=start_time,
                end_ts=end_time,
                timezone='UTC'
            )