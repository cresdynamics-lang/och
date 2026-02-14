"""
Enhanced Program Management Views for Directors.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404

from ..models import Program, Track, Cohort, Enrollment, MentorAssignment
from mentorship_coordination.models import MenteeMentorAssignment
from ..serializers import (
    ProgramSerializer, TrackSerializer, CohortSerializer,
    EnrollmentSerializer, MentorAssignmentSerializer
)
from ..permissions import IsProgramDirector
from users.models import User

import logging

logger = logging.getLogger(__name__)


class DirectorProgramManagementViewSet(viewsets.ModelViewSet):
    """Director Program Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    serializer_class = ProgramSerializer
    
    def get_queryset(self):
        """Directors can only see programs they manage."""
        user = self.request.user
        if user.is_staff:
            return Program.objects.all()
        return Program.objects.filter(tracks__director=user).distinct()
    
    @action(detail=True, methods=['post'])
    def create_track(self, request, pk=None):
        """Create a new track for this program."""
        program = self.get_object()
        
        data = request.data.copy()
        data['program'] = program.id
        data['director'] = request.user.id
        
        serializer = TrackSerializer(data=data)
        if serializer.is_valid():
            track = serializer.save()
            return Response(TrackSerializer(track).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DirectorTrackManagementViewSet(viewsets.ModelViewSet):
    """Director Track Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    serializer_class = TrackSerializer
    
    def get_queryset(self):
        """Directors can only see tracks they manage."""
        user = self.request.user
        if user.is_staff:
            return Track.objects.all()
        return Track.objects.filter(director=user)
    
    @action(detail=True, methods=['post'])
    def create_cohort(self, request, pk=None):
        """Create a new cohort for this track."""
        track = self.get_object()
        
        data = request.data.copy()
        data['track'] = track.id
        
        serializer = CohortSerializer(data=data)
        if serializer.is_valid():
            cohort = serializer.save()
            return Response(CohortSerializer(cohort).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DirectorCohortManagementViewSet(viewsets.ModelViewSet):
    """Director Cohort Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    serializer_class = CohortSerializer
    
    def get_queryset(self):
        """Directors can only see cohorts they manage."""
        user = self.request.user
        if user.is_staff:
            return Cohort.objects.all()
        return Cohort.objects.filter(track__director=user)
    
    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """Get enrollments for this cohort."""
        cohort = self.get_object()
        enrollments = cohort.enrollments.all()
        
        status_filter = request.query_params.get('status')
        if status_filter:
            enrollments = enrollments.filter(status=status_filter)
        
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve_enrollment(self, request, pk=None):
        """Approve a pending enrollment."""
        cohort = self.get_object()
        enrollment_id = request.data.get('enrollment_id')
        
        try:
            enrollment = cohort.enrollments.get(id=enrollment_id, status='pending_payment')
            enrollment.status = 'active'
            enrollment.save()
            
            return Response({
                'message': 'Enrollment approved',
                'enrollment': EnrollmentSerializer(enrollment).data
            })
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found or not pending'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def reject_enrollment(self, request, pk=None):
        """Reject a pending enrollment."""
        cohort = self.get_object()
        enrollment_id = request.data.get('enrollment_id')
        reason = request.data.get('reason', '')
        
        try:
            enrollment = cohort.enrollments.get(id=enrollment_id, status='pending_payment')
            enrollment.status = 'withdrawn'
            enrollment.save()
            
            return Response({
                'message': 'Enrollment rejected',
                'reason': reason
            })
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found or not pending'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def mentors(self, request, pk=None):
        """Get mentors assigned to this cohort."""
        cohort = self.get_object()
        assignments = cohort.mentor_assignments.filter(active=True)
        serializer = MentorAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_mentor(self, request, pk=None):
        """Assign a mentor to this cohort."""
        cohort = self.get_object()
        mentor_id = request.data.get('mentor_id')
        role = request.data.get('role', 'support')
        
        try:
            mentor = User.objects.get(id=mentor_id, is_mentor=True)
            
            # Check if already assigned
            existing = MentorAssignment.objects.filter(
                cohort=cohort, mentor=mentor, active=True
            ).first()
            
            if existing:
                return Response(
                    {'error': 'Mentor already assigned to this cohort'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            assignment = MentorAssignment.objects.create(
                cohort=cohort,
                mentor=mentor,
                role=role
            )
            
            return Response({
                'message': 'Mentor assigned successfully',
                'assignment': MentorAssignmentSerializer(assignment).data
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Mentor not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update cohort status (lifecycle management)."""
        cohort = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Cohort.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status transitions
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
        
        cohort.status = new_status
        cohort.save()
        
        return Response({
            'message': f'Cohort status updated to {new_status}',
            'cohort': CohortSerializer(cohort).data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsProgramDirector])
def director_mentor_analytics_view(request, mentor_id):
    """GET /api/v1/director/mentors/{id}/analytics/ - Mentor analytics for director view."""
    mentor = get_object_or_404(User, id=mentor_id, is_mentor=True)
    active_assignments = MentorAssignment.objects.filter(
        mentor=mentor, active=True
    ).select_related('cohort', 'cohort__track', 'cohort__track__program')
    cohorts = list({a.cohort for a in active_assignments})
    from programs.models import Enrollment
    total_mentees = Enrollment.objects.filter(
        cohort__in=cohorts, status='active'
    ).count()
    metrics = {
        'total_mentees': total_mentees,
        'active_cohorts': len(cohorts),
        'session_completion_rate': 0,
        'feedback_average': 0,
        'mentee_completion_rate': 0,
        'impact_score': 0,
        'sessions_scheduled': 0,
        'sessions_completed': 0,
        'sessions_missed': 0,
        'average_session_rating': 0,
        'mentee_satisfaction_score': 0,
    }
    assignments_data = [
        {
            'id': str(a.id),
            'cohort_id': str(a.cohort_id),
            'cohort_name': a.cohort.name if a.cohort else '',
            'role': a.role or 'support',
            'mentees_count': Enrollment.objects.filter(cohort=a.cohort, status='active').count() if a.cohort else 0,
            'start_date': a.cohort.start_date.isoformat() if a.cohort and getattr(a.cohort, 'start_date', None) else None,
            'end_date': a.cohort.end_date.isoformat() if a.cohort and getattr(a.cohort, 'end_date', None) else None,
        }
        for a in active_assignments
    ]
    return Response({
        'mentor_id': str(mentor.id),
        'mentor_name': mentor.get_full_name() or mentor.email,
        'metrics': metrics,
        'assignments': assignments_data,
        'cohorts': [{'id': str(c.id), 'name': c.name} for c in cohorts],
        'reviews': [],
        'mentee_goals': [],
        'activity_over_time': [],
    })


class DirectorMentorManagementViewSet(viewsets.ViewSet):
    """Director Mentor Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    
    def list(self, request):
        """List available mentors."""
        mentors = User.objects.filter(is_mentor=True, is_active=True)
        
        # Filter by specialties if provided
        specialties = request.query_params.get('specialties')
        if specialties:
            specialty_list = specialties.split(',')
            mentors = mentors.filter(mentor_specialties__overlap=specialty_list)
        
        mentor_data = []
        for mentor in mentors:
            # Calculate current capacity
            active_assignments = MentorAssignment.objects.filter(
                mentor=mentor, active=True
            ).count()
            
            mentor_data.append({
                'id': str(mentor.id),
                'name': mentor.get_full_name() or mentor.email,
                'email': mentor.email,
                'specialties': mentor.mentor_specialties,
                'capacity_weekly': mentor.mentor_capacity_weekly,
                'active_assignments': active_assignments,
                'availability': mentor.mentor_availability
            })
        
        return Response(mentor_data)
    
    @action(detail=False, methods=['post'], url_path='assign-direct')
    def assign_direct(self, request):
        """Assign a mentor directly to a student (direct assignment, no cohort/track)."""
        mentee_id = request.data.get('mentee_id')
        mentor_id = request.data.get('mentor_id')
        if not mentee_id or not mentor_id:
            return Response(
                {'error': 'mentee_id and mentor_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            mentee = User.objects.get(id=int(mentee_id))
            mentor = User.objects.get(id=int(mentor_id))
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'Invalid mentee_id or mentor_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not getattr(mentor, 'is_mentor', False):
            return Response(
                {'error': 'Selected user is not a mentor'},
                status=status.HTTP_400_BAD_REQUEST
            )
        assignment, created = MenteeMentorAssignment.objects.get_or_create(
            mentee=mentee,
            mentor=mentor,
            defaults={
                'status': 'active',
                'assignment_type': 'direct',
                'cohort_id': None,
                'track_id': None,
            }
        )
        if not created and assignment.status != 'active':
            assignment.status = 'active'
            assignment.assignment_type = 'direct'
            assignment.cohort_id = None
            assignment.track_id = None
            assignment.save()
        return Response({
            'id': str(assignment.id),
            'mentee_id': str(mentee.id),
            'mentor_id': str(mentor.id),
            'created': created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Get mentor suggestions for a cohort."""
        cohort_id = request.query_params.get('cohort_id')
        if not cohort_id:
            return Response(
                {'error': 'cohort_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cohort = Cohort.objects.get(id=cohort_id)
            
            # Get mentors with relevant specialties
            track_key = cohort.track.key.lower()
            relevant_mentors = User.objects.filter(
                is_mentor=True,
                is_active=True,
                mentor_specialties__icontains=track_key
            )
            
            suggestions = []
            for mentor in relevant_mentors:
                active_assignments = MentorAssignment.objects.filter(
                    mentor=mentor, active=True
                ).count()
                
                # Calculate match score (simple algorithm)
                match_score = 0
                if track_key in str(mentor.mentor_specialties).lower():
                    match_score += 50
                if active_assignments < mentor.mentor_capacity_weekly:
                    match_score += 30
                
                suggestions.append({
                    'mentor_id': str(mentor.id),
                    'name': mentor.get_full_name() or mentor.email,
                    'match_score': match_score,
                    'specialties': mentor.mentor_specialties,
                    'current_load': active_assignments,
                    'capacity': mentor.mentor_capacity_weekly
                })
            
            # Sort by match score
            suggestions.sort(key=lambda x: x['match_score'], reverse=True)
            
            return Response(suggestions[:10])  # Top 10 suggestions
            
        except Cohort.DoesNotExist:
            return Response(
                {'error': 'Cohort not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, pk=None):
        """GET /api/v1/director/mentors/{id}/analytics/ - Mentor analytics for director view."""
        mentor = get_object_or_404(User, id=pk, is_mentor=True)
        active_assignments = MentorAssignment.objects.filter(
            mentor=mentor, active=True
        ).select_related('cohort', 'cohort__track', 'cohort__track__program')
        cohorts = list({a.cohort for a in active_assignments})
        from programs.models import Enrollment
        total_mentees = Enrollment.objects.filter(
            cohort__in=cohorts, status='active'
        ).count()
        metrics = {
            'total_mentees': total_mentees,
            'active_cohorts': len(cohorts),
            'session_completion_rate': 0,
            'feedback_average': 0,
            'mentee_completion_rate': 0,
            'impact_score': 0,
            'sessions_scheduled': 0,
            'sessions_completed': 0,
            'sessions_missed': 0,
            'average_session_rating': 0,
            'mentee_satisfaction_score': 0,
        }
        assignments_data = [
            {
                'id': str(a.id),
                'cohort_id': str(a.cohort_id),
                'cohort_name': a.cohort.name if a.cohort else '',
                'role': a.role or 'support',
                'mentees_count': Enrollment.objects.filter(cohort=a.cohort, status='active').count() if a.cohort else 0,
                'start_date': a.cohort.start_date.isoformat() if a.cohort and getattr(a.cohort, 'start_date', None) else None,
                'end_date': a.cohort.end_date.isoformat() if a.cohort and getattr(a.cohort, 'end_date', None) else None,
            }
            for a in active_assignments
        ]
        return Response({
            'mentor_id': str(mentor.id),
            'mentor_name': mentor.get_full_name() or mentor.email,
            'metrics': metrics,
            'assignments': assignments_data,
            'cohorts': [{'id': str(c.id), 'name': c.name} for c in cohorts],
            'reviews': [],
            'mentee_goals': [],
            'activity_over_time': [],
        })