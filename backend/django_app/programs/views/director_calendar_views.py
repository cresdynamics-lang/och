"""
Calendar Management API for Directors.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from ..models import Cohort, CalendarEvent, Milestone
from ..serializers import CalendarEventSerializer
from ..permissions import IsProgramDirector

import logging

logger = logging.getLogger(__name__)


class DirectorCalendarViewSet(viewsets.ViewSet):
    """Director Calendar Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    
    def list(self, request):
        """Get calendar events for director's cohorts."""
        user = request.user
        cohort_id = request.query_params.get('cohort_id')
        
        if cohort_id:
            # Get events for specific cohort
            try:
                cohort = Cohort.objects.get(id=cohort_id)
                if not user.is_staff and cohort.track.director != user:
                    return Response(
                        {'error': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                events = cohort.calendar_events.all()
            except Cohort.DoesNotExist:
                return Response(
                    {'error': 'Cohort not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Get events for all director's cohorts
            if user.is_staff:
                events = CalendarEvent.objects.all()
            else:
                events = CalendarEvent.objects.filter(cohort__track__director=user)
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            events = events.filter(start_ts__gte=start_date)
        if end_date:
            events = events.filter(end_ts__lte=end_date)
        
        serializer = CalendarEventSerializer(events, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a new calendar event."""
        cohort_id = request.data.get('cohort_id')
        
        try:
            cohort = Cohort.objects.get(id=cohort_id)
            if not request.user.is_staff and cohort.track.director != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            data = request.data.copy()
            data['cohort'] = cohort.id
            
            serializer = CalendarEventSerializer(data=data)
            if serializer.is_valid():
                event = serializer.save()
                return Response(
                    CalendarEventSerializer(event).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Cohort.DoesNotExist:
            return Response(
                {'error': 'Cohort not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, pk=None):
        """Update a calendar event."""
        try:
            event = CalendarEvent.objects.get(id=pk)
            if not request.user.is_staff and event.cohort.track.director != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = CalendarEventSerializer(event, data=request.data, partial=True)
            if serializer.is_valid():
                event = serializer.save()
                return Response(CalendarEventSerializer(event).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except CalendarEvent.DoesNotExist:
            return Response(
                {'error': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def destroy(self, request, pk=None):
        """Delete a calendar event."""
        try:
            event = CalendarEvent.objects.get(id=pk)
            if not request.user.is_staff and event.cohort.track.director != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            event.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except CalendarEvent.DoesNotExist:
            return Response(
                {'error': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def generate_milestones(self, request):
        """Generate milestone events for a cohort."""
        cohort_id = request.data.get('cohort_id')
        
        try:
            cohort = Cohort.objects.get(id=cohort_id)
            if not request.user.is_staff and cohort.track.director != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate standard milestone events
            milestones = [
                {
                    'type': 'orientation',
                    'title': 'Cohort Orientation',
                    'description': 'Welcome and program overview',
                    'days_offset': 0,
                    'duration_hours': 2
                },
                {
                    'type': 'session',
                    'title': 'Mid-Program Check-in',
                    'description': 'Progress review and mentorship matching',
                    'days_offset': (cohort.end_date - cohort.start_date).days // 2,
                    'duration_hours': 1
                },
                {
                    'type': 'submission',
                    'title': 'Final Project Submission',
                    'description': 'Portfolio and project submissions due',
                    'days_offset': (cohort.end_date - cohort.start_date).days - 7,
                    'duration_hours': 0
                },
                {
                    'type': 'closure',
                    'title': 'Cohort Graduation',
                    'description': 'Final presentations and certificate ceremony',
                    'days_offset': (cohort.end_date - cohort.start_date).days,
                    'duration_hours': 3
                }
            ]
            
            created_events = []
            for milestone in milestones:
                event_date = cohort.start_date + timedelta(days=milestone['days_offset'])
                start_time = datetime.combine(event_date, datetime.min.time().replace(hour=10))
                end_time = start_time + timedelta(hours=milestone['duration_hours'])
                
                event = CalendarEvent.objects.create(
                    cohort=cohort,
                    type=milestone['type'],
                    title=milestone['title'],
                    description=milestone['description'],
                    start_ts=start_time,
                    end_ts=end_time,
                    timezone='UTC'
                )
                created_events.append(event)
            
            return Response({
                'message': f'Generated {len(created_events)} milestone events',
                'events': CalendarEventSerializer(created_events, many=True).data
            })
            
        except Cohort.DoesNotExist:
            return Response(
                {'error': 'Cohort not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Get calendar templates for different program types."""
        templates = {
            'builders': [
                {'type': 'orientation', 'title': 'Builders Kickoff', 'week': 1},
                {'type': 'session', 'title': 'Technical Deep Dive', 'week': 4},
                {'type': 'project_review', 'title': 'Mid-Program Review', 'week': 8},
                {'type': 'submission', 'title': 'Final Project Due', 'week': 11},
                {'type': 'closure', 'title': 'Demo Day', 'week': 12}
            ],
            'leaders': [
                {'type': 'orientation', 'title': 'Leadership Foundations', 'week': 1},
                {'type': 'session', 'title': 'Team Management Workshop', 'week': 3},
                {'type': 'session', 'title': 'Strategic Planning', 'week': 6},
                {'type': 'project_review', 'title': 'Leadership Project Review', 'week': 9},
                {'type': 'closure', 'title': 'Leadership Showcase', 'week': 12}
            ],
            'entrepreneurs': [
                {'type': 'orientation', 'title': 'Entrepreneurship Bootcamp', 'week': 1},
                {'type': 'session', 'title': 'Business Model Canvas', 'week': 2},
                {'type': 'session', 'title': 'Pitch Practice', 'week': 6},
                {'type': 'submission', 'title': 'Business Plan Due', 'week': 10},
                {'type': 'closure', 'title': 'Pitch Competition', 'week': 12}
            ]
        }
        
        return Response(templates)