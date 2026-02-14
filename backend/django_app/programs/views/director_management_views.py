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
    """GET /api/v1/director/mentors/{id}/analytics/ - Mentor analytics and all assignments (cohort, track, direct)."""
    mentor = get_object_or_404(User, id=mentor_id)
    # Treat as mentor if is_mentor flag or has mentor role (align with assign-direct)
    is_mentor = getattr(mentor, 'is_mentor', False)
    if not is_mentor:
        from users.models import Role, UserRole
        mentor_role = Role.objects.filter(name='mentor').first()
        if mentor_role:
            is_mentor = UserRole.objects.filter(
                user=mentor, role=mentor_role, is_active=True
            ).exists()
    if not is_mentor:
        return Response(
            {'error': 'User is not a mentor'},
            status=status.HTTP_404_NOT_FOUND
        )
    from programs.models import Enrollment, TrackMentorAssignment
    # Cohort assignments
    active_cohort_assignments = MentorAssignment.objects.filter(
        mentor=mentor, active=True
    ).select_related('cohort', 'cohort__track', 'cohort__track__program')
    cohorts = list({a.cohort for a in active_cohort_assignments})
    total_mentees = Enrollment.objects.filter(
        cohort__in=cohorts, status='active'
    ).count()
    # Track assignments (programs Track)
    track_assignments = TrackMentorAssignment.objects.filter(
        mentor=mentor, active=True
    ).select_related('track', 'track__program')
    # Curriculum track assignments (from director mentorship matching page)
    from curriculum.models import CurriculumTrackMentorAssignment, CurriculumTrack
    curriculum_track_assignments = CurriculumTrackMentorAssignment.objects.filter(
        mentor=mentor, active=True
    ).select_related('curriculum_track')
    # Direct mentee assignments
    direct_assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        assignment_type='direct',
        status='active'
    ).select_related('mentee')
    # Build unified assignments list with type
    assignments_data = []
    for a in active_cohort_assignments:
        assignments_data.append({
            'id': str(a.id),
            'assignment_type': 'cohort',
            'cohort_id': str(a.cohort_id),
            'cohort_name': a.cohort.name if a.cohort else '',
            'track_id': str(a.cohort.track_id) if a.cohort and getattr(a.cohort, 'track_id', None) else None,
            'track_name': a.cohort.track.name if a.cohort and getattr(a.cohort, 'track', None) else None,
            'program_name': a.cohort.track.program.name if a.cohort and getattr(a.cohort, 'track', None) and getattr(a.cohort.track, 'program', None) else None,
            'role': a.role or 'support',
            'mentees_count': Enrollment.objects.filter(cohort=a.cohort, status='active').count() if a.cohort else 0,
            'start_date': a.cohort.start_date.isoformat() if a.cohort and getattr(a.cohort, 'start_date', None) else None,
            'end_date': a.cohort.end_date.isoformat() if a.cohort and getattr(a.cohort, 'end_date', None) else None,
        })
    for a in track_assignments:
        track_mentees = []
        if a.track_id:
            track_cohorts = Cohort.objects.filter(track_id=a.track_id)
            for enr in Enrollment.objects.filter(
                cohort__in=track_cohorts, status='active'
            ).select_related('user'):
                if enr.user:
                    track_mentees.append({
                        'id': str(enr.user_id),
                        'name': enr.user.get_full_name() or enr.user.email,
                        'email': enr.user.email,
                    })
        assignments_data.append({
            'id': str(a.id),
            'assignment_type': 'track',
            'cohort_id': None,
            'cohort_name': None,
            'track_id': str(a.track_id),
            'track_name': a.track.name if a.track else '',
            'program_name': a.track.program.name if a.track and getattr(a.track, 'program', None) else None,
            'role': a.role or 'support',
            'mentees_count': len(track_mentees),
            'mentees': track_mentees,
            'start_date': None,
            'end_date': None,
        })
    for a in curriculum_track_assignments:
        ct = a.curriculum_track
        track_name = (getattr(ct, 'title', None) or getattr(ct, 'name', None) or getattr(ct, 'slug', None) or str(ct.id)) if ct else ''
        program_track_id = getattr(ct, 'program_track_id', None) if ct else None
        curriculum_track_mentees = []
        seen_ct_uid = set()
        if program_track_id:
            track_cohorts = Cohort.objects.filter(track_id=program_track_id)
            for enr in Enrollment.objects.filter(
                cohort__in=track_cohorts, status='active'
            ).select_related('user'):
                if enr.user and enr.user_id not in seen_ct_uid:
                    seen_ct_uid.add(enr.user_id)
                    curriculum_track_mentees.append({
                        'id': str(enr.user_id),
                        'name': enr.user.get_full_name() or enr.user.email,
                        'email': enr.user.email,
                    })
        # Also include students assigned via MenteeMentorAssignment (e.g. from User.track_key)
        ct_id_str = str(ct.id) if ct else None
        if ct_id_str:
            for mma in MenteeMentorAssignment.objects.filter(
                mentor=mentor,
                assignment_type='track',
                track_id=ct_id_str,
                status='active'
            ).select_related('mentee'):
                if mma.mentee and mma.mentee_id not in seen_ct_uid:
                    seen_ct_uid.add(mma.mentee_id)
                    curriculum_track_mentees.append({
                        'id': str(mma.mentee_id),
                        'name': mma.mentee.get_full_name() or mma.mentee.email,
                        'email': mma.mentee.email,
                    })
        assignments_data.append({
            'id': str(a.id),
            'assignment_type': 'track',
            'cohort_id': None,
            'cohort_name': None,
            'track_id': ct_id_str,
            'track_name': track_name,
            'program_name': None,
            'role': a.role or 'support',
            'mentees_count': len(curriculum_track_mentees),
            'mentees': curriculum_track_mentees,
            'start_date': a.assigned_at.isoformat() if getattr(a, 'assigned_at', None) else None,
            'end_date': None,
            'curriculum_track': True,
        })
    for a in direct_assignments:
        assignments_data.append({
            'id': str(a.id),
            'assignment_type': 'direct',
            'cohort_id': None,
            'cohort_name': None,
            'track_id': None,
            'track_name': None,
            'program_name': None,
            'role': None,
            'mentees_count': 1,
            'mentee_id': str(a.mentee_id),
            'mentee_name': a.mentee.get_full_name() or a.mentee.email if a.mentee else '',
            'mentee_email': a.mentee.email if a.mentee else '',
            'start_date': a.assigned_at.isoformat() if getattr(a, 'assigned_at', None) else None,
            'end_date': None,
        })
    # Build list of all students (mentees) under this mentor: cohort + track + direct (deduplicated)
    seen_user_ids = set()
    mentees_list = []
    for enr in Enrollment.objects.filter(
        cohort__in=cohorts, status='active'
    ).select_related('user', 'cohort'):
        if enr.user_id not in seen_user_ids:
            seen_user_ids.add(enr.user_id)
            mentees_list.append({
                'id': str(enr.user_id),
                'email': enr.user.email,
                'name': enr.user.get_full_name() or enr.user.email,
                'source': 'cohort',
                'cohort_name': enr.cohort.name if enr.cohort else None,
                'track_name': enr.cohort.track.name if enr.cohort and getattr(enr.cohort, 'track', None) else None,
            })
    # From track assignments (programs): students in any cohort that uses this mentor's assigned track
    for ta in track_assignments:
        if not ta.track_id:
            continue
        track_cohorts = Cohort.objects.filter(track_id=ta.track_id)
        for enr in Enrollment.objects.filter(
            cohort__in=track_cohorts, status='active'
        ).select_related('user', 'cohort'):
            if enr.user_id not in seen_user_ids:
                seen_user_ids.add(enr.user_id)
                mentees_list.append({
                    'id': str(enr.user_id),
                    'email': enr.user.email,
                    'name': enr.user.get_full_name() or enr.user.email,
                    'source': 'track',
                    'cohort_name': enr.cohort.name if enr.cohort else None,
                    'track_name': ta.track.name if ta.track else str(ta.track_id),
                })
    # From curriculum track assignments: students in cohorts whose track links to this curriculum track
    for cta in curriculum_track_assignments:
        ct = cta.curriculum_track
        if not ct or not getattr(ct, 'program_track_id', None):
            continue
        track_cohorts = Cohort.objects.filter(track_id=ct.program_track_id)
        track_label = getattr(ct, 'title', None) or getattr(ct, 'name', None) or getattr(ct, 'slug', None) or str(ct.id)
        for enr in Enrollment.objects.filter(
            cohort__in=track_cohorts, status='active'
        ).select_related('user', 'cohort'):
            if enr.user_id not in seen_user_ids:
                seen_user_ids.add(enr.user_id)
                mentees_list.append({
                    'id': str(enr.user_id),
                    'email': enr.user.email,
                    'name': enr.user.get_full_name() or enr.user.email,
                    'source': 'track',
                    'cohort_name': enr.cohort.name if enr.cohort else None,
                    'track_name': track_label,
                })
    for a in direct_assignments:
        if a.mentee_id not in seen_user_ids:
            seen_user_ids.add(a.mentee_id)
            mentees_list.append({
                'id': str(a.mentee_id),
                'email': a.mentee.email if a.mentee else '',
                'name': (a.mentee.get_full_name() or a.mentee.email) if a.mentee else '',
                'source': 'direct',
                'cohort_name': None,
                'track_name': None,
            })
    metrics = {
        'total_mentees': len(mentees_list),
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
    return Response({
        'mentor_id': str(mentor.id),
        'mentor_name': mentor.get_full_name() or mentor.email,
        'metrics': metrics,
        'assignments': assignments_data,
        'mentees': mentees_list,
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
    
    def _resolve_user_by_id_or_uuid(self, value):
        """Resolve User by integer id or uuid_id string. Returns User or None."""
        if value is None or value == '':
            return None
        try:
            # Try integer id first (e.g. from director students list)
            return User.objects.get(id=int(value))
        except (ValueError, TypeError, User.DoesNotExist):
            pass
        try:
            # Try uuid_id (e.g. from some list APIs that expose uuid_id as id)
            return User.objects.get(uuid_id=value)
        except (ValueError, TypeError, User.DoesNotExist):
            return None

    @action(detail=False, methods=['post'], url_path='assign-direct')
    def assign_direct(self, request):
        """Assign a mentor directly to a student (direct assignment, no cohort/track)."""
        mentee_id = request.data.get('mentee_id')
        mentor_id = request.data.get('mentor_id')
        if mentee_id is None or (isinstance(mentee_id, str) and not str(mentee_id).strip()):
            return Response(
                {'error': 'mentee_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if mentor_id is None or (isinstance(mentor_id, str) and not str(mentor_id).strip()):
            return Response(
                {'error': 'mentor_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        mentee = self._resolve_user_by_id_or_uuid(mentee_id)
        mentor = self._resolve_user_by_id_or_uuid(mentor_id)
        if not mentee or not mentor:
            return Response(
                {'error': 'Invalid mentee_id or mentor_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Accept user as mentor if is_mentor flag is set OR they have the mentor role (UserRole)
        is_mentor = getattr(mentor, 'is_mentor', False)
        if not is_mentor:
            from users.models import Role, UserRole
            mentor_role = Role.objects.filter(name='mentor').first()
            if mentor_role:
                is_mentor = UserRole.objects.filter(
                    user=mentor, role=mentor_role, is_active=True
                ).exists()
        if not is_mentor:
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
        # Ensure existing assignment is updated to direct/active (idempotent: same success on retry)
        if not created:
            updated = False
            if assignment.status != 'active':
                assignment.status = 'active'
                updated = True
            if getattr(assignment, 'assignment_type', None) != 'direct':
                assignment.assignment_type = 'direct'
                updated = True
            if assignment.cohort_id or assignment.track_id:
                assignment.cohort_id = None
                assignment.track_id = None
                updated = True
            if updated:
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