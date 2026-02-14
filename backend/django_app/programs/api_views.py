"""
API Views for Cohorts, Modules, Milestones, and Specializations.
"""
import uuid as uuid_module
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Cohort, Track, Module, Milestone, Specialization, CalendarTemplate, MentorAssignment, TrackMentorAssignment, Enrollment, CalendarEvent, Waitlist
from .serializers import MentorAssignmentSerializer, TrackMentorAssignmentSerializer, EnrollmentSerializer, CalendarEventSerializer, WaitlistSerializer
from .core_services import EnrollmentService
from .api_serializers import (
    CohortSerializer, CreateCohortSerializer,
    ModuleSerializer, CreateModuleSerializer,
    MilestoneSerializer, CreateMilestoneSerializer,
    SpecializationSerializer, CreateSpecializationSerializer
)
from .permissions import IsDirectorOrAdmin, IsDirectorOrAdminOrMentorCohortsReadOnly
from .services.director_service import DirectorService


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsDirectorOrAdminOrMentorCohortsReadOnly])
def cohort_waitlist_view(request, pk):
    """Standalone view for cohort waitlist - ensures /cohorts/{uuid}/waitlist/ always resolves."""
    cohort = get_object_or_404(Cohort, pk=pk)
    perm = IsDirectorOrAdminOrMentorCohortsReadOnly()
    if not perm.has_object_permission(request, None, cohort):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You do not have access to this cohort.")
    if request.method == 'GET':
        waitlist_entries = Waitlist.objects.filter(cohort=cohort, active=True).order_by('position')
        serializer = WaitlistSerializer(waitlist_entries, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        count = int(request.data.get('count', 1))
        promoted = EnrollmentService.promote_from_waitlist(cohort, count)
        if promoted:
            serializer = EnrollmentSerializer(promoted, many=True)
            return Response({'promoted': serializer.data, 'count': len(promoted)}, status=status.HTTP_200_OK)
        return Response({'message': 'No users could be promoted from waitlist'}, status=status.HTTP_200_OK)


class CohortViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cohorts. Directors/admins see all; mentors see only assigned cohorts (read-only)."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdminOrMentorCohortsReadOnly]
    lookup_field = 'pk'
    lookup_value_regex = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
    
    def get_queryset(self):
        from .permissions import _is_director_or_admin
        queryset = Cohort.objects.select_related(
            'track__program', 'coordinator'
        ).prefetch_related('enrollments')
        if not _is_director_or_admin(self.request.user):
            queryset = queryset.filter(
                mentor_assignments__mentor=self.request.user,
                mentor_assignments__active=True
            ).distinct()
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        program_id = self.request.query_params.get('program')
        if program_id:
            queryset = queryset.filter(track__program_id=program_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-start_date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateCohortSerializer
        return CohortSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cohort = serializer.save()
        
        # Return the created cohort with full details
        response_serializer = CohortSerializer(cohort)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        return Response({
            'success': True,
            'data': data,
            'results': data,
            'count': len(data)
        })
    
    @action(detail=True, methods=['get'], url_path='enrollments')
    def enrollments(self, request, pk=None):
        """Get enrollments for this cohort."""
        cohort = self.get_object()
        enrollments_qs = Enrollment.objects.filter(cohort=cohort).select_related('user')
        serializer = EnrollmentSerializer(enrollments_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='waitlist')
    def waitlist(self, request, pk=None):
        """Get waitlist or promote from waitlist."""
        cohort = self.get_object()
        if request.method == 'GET':
            waitlist_entries = Waitlist.objects.filter(cohort=cohort, active=True).order_by('position')
            serializer = WaitlistSerializer(waitlist_entries, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            count = int(request.data.get('count', 1))
            promoted = EnrollmentService.promote_from_waitlist(cohort, count)
            if promoted:
                serializer = EnrollmentSerializer(promoted, many=True)
                return Response({'promoted': serializer.data, 'count': len(promoted)}, status=status.HTTP_200_OK)
            return Response({'message': 'No users could be promoted from waitlist'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='missions')
    def missions(self, request, pk=None):
        """Get missions assigned to this cohort."""
        cohort = self.get_object()
        from missions.models import MissionAssignment
        assignments = MissionAssignment.objects.filter(
            cohort_id=cohort.id, assignment_type='cohort'
        ).select_related('mission')
        data = [
            {
                'id': str(a.mission.id),
                'title': a.mission.title,
                'description': getattr(a.mission, 'description', '') or '',
                'difficulty': a.mission.difficulty,
                'mission_type': a.mission.mission_type,
                'estimated_duration_min': getattr(a.mission, 'estimated_duration_min', 0) or 0,
                'is_active': a.mission.is_active,
                'assignment_id': str(a.id),
                'assignment_status': a.status,
            }
            for a in assignments
        ]
        return Response(data)

    @action(detail=True, methods=['get'], url_path='dashboard')
    def dashboard(self, request, pk=None):
        """Get cohort dashboard summary (enrollments, mentors, readiness)."""
        cohort = self.get_object()
        enrollments_count = Enrollment.objects.filter(cohort=cohort, status='active').count()
        mentor_count = MentorAssignment.objects.filter(cohort=cohort, active=True).count()
        seat_cap = cohort.seat_cap or 1
        seat_utilization = (enrollments_count / seat_cap * 100) if seat_cap else 0.0
        track_name = cohort.track.name if cohort.track else ''
        data = {
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'track_name': track_name,
            'enrollments_count': enrollments_count,
            'seat_utilization': seat_utilization,
            'mentor_assignments_count': mentor_count,
            'readiness_delta': min(100.0, seat_utilization),
            'completion_percentage': getattr(cohort, 'completion_rate', 0) or 0,
            'payments_complete': 0,
            'payments_pending': 0,
        }
        return Response(data)

    @action(detail=True, methods=['get'], url_path='calendar')
    def calendar(self, request, pk=None):
        """Get calendar events for this cohort."""
        cohort = self.get_object()
        events_qs = CalendarEvent.objects.filter(cohort=cohort).order_by('start_ts')
        serializer = CalendarEventSerializer(events_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='mentors')
    def mentors(self, request, pk=None):
        """Get or assign mentors for this cohort. POST: directors/admins only."""
        cohort = self.get_object()
        if request.method == 'GET':
            assignments = MentorAssignment.objects.filter(cohort=cohort, active=True).select_related('mentor')
            serializer = MentorAssignmentSerializer(assignments, many=True)
            return Response(serializer.data)
        from .permissions import _is_director_or_admin
        if not _is_director_or_admin(request.user):
            return Response(
                {'detail': 'Only directors or admins can assign mentors to a cohort.'},
                status=status.HTTP_403_FORBIDDEN
            )
        mentor_id = request.data.get('mentor') or request.data.get('mentor_id')
        role = request.data.get('role', 'support')
        if role not in dict(MentorAssignment.ROLE_CHOICES):
            role = 'support'
        if not mentor_id:
            return Response(
                {'mentor': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        User = get_user_model()
        try:
            # Step 1: Resolve the user either by integer ID or UUID string,
            # WITHOUT assuming they are already flagged as a mentor.
            mentor_user = None
            mentor_pk = None
            try:
                mentor_pk = int(mentor_id)
            except (ValueError, TypeError):
                mentor_pk = None

            if mentor_pk is not None:
                mentor_user = User.objects.get(id=mentor_pk)
            else:
                # Fallback to UUID-based lookup
                try:
                    mentor_uuid = uuid_module.UUID(str(mentor_id))
                except (ValueError, TypeError):
                    return Response(
                        {'mentor': ['Invalid mentor identifier. Expected numeric ID or UUID.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                mentor_user = User.objects.get(uuid_id=mentor_uuid)

            # Step 2: Verify that this user is actually a mentor
            # We consider them a mentor if either:
            # - user.is_mentor is True, OR
            # - they have an active UserRole with role.name == 'mentor'
            is_mentor_flag = getattr(mentor_user, 'is_mentor', False)

            if not is_mentor_flag:
                from users.models import UserRole
                has_mentor_role = UserRole.objects.filter(
                    user=mentor_user,
                    role__name='mentor',
                    is_active=True,
                ).exists()
                if not has_mentor_role:
                    return Response(
                        {'mentor': ['User exists but is not marked as a mentor. Assign the mentor role first.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        except User.DoesNotExist:
            return Response(
                {'mentor': ['Mentor not found.']},
                status=status.HTTP_404_NOT_FOUND
            )
        if MentorAssignment.objects.filter(cohort=cohort, mentor=mentor_user, active=True).exists():
            return Response(
                {'non_field_errors': ['This mentor is already assigned to this cohort.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        assignment = MentorAssignment.objects.create(
            cohort=cohort,
            mentor=mentor_user,
            role=role
        )
        serializer = MentorAssignmentSerializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='mentors/auto-match')
    def auto_match_mentors(self, request, pk=None):
        """Auto-assign available mentors to this cohort. Directors/admins only."""
        from .permissions import _is_director_or_admin
        if not _is_director_or_admin(request.user):
            return Response(
                {'detail': 'Only directors or admins can run auto-match.'},
                status=status.HTTP_403_FORBIDDEN
            )
        cohort = self.get_object()
        role = request.data.get('role', 'support')
        if role not in dict(MentorAssignment.ROLE_CHOICES):
            role = 'support'
        track_id = request.data.get('track_id')
        User = get_user_model()
        track_key = None
        if track_id:
            try:
                from .models import Track
                track = Track.objects.get(pk=track_id)
                track_key = track.key
            except Exception:
                pass
        if not track_key and cohort.track_id:
            try:
                track_key = cohort.track.key if cohort.track else None
            except Exception:
                pass
        assigned_mentor_ids = set(
            MentorAssignment.objects.filter(cohort=cohort, active=True).values_list('mentor_id', flat=True)
        )
        available = (
            User.objects.filter(is_mentor=True, is_active=True)
            .exclude(id__in=assigned_mentor_ids)
            .annotate(cohort_count=Count('cohort_mentor_assignments', filter=Q(cohort_mentor_assignments__active=True), distinct=True))
        )
        if track_key:
            available = available.filter(track_key=track_key)
        available = available.order_by('cohort_count', 'email')[:20]
        created = []
        for mentor in available:
            assignment, created_flag = MentorAssignment.objects.get_or_create(
                cohort=cohort,
                mentor=mentor,
                defaults={'role': role, 'active': True}
            )
            if created_flag:
                created.append(assignment)
        serializer = MentorAssignmentSerializer(created, many=True)
        return Response({'assignments': serializer.data, 'count': len(created)}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a cohort."""
        cohort = self.get_object()
        cohort.status = 'active'
        cohort.save()
        
        serializer = self.get_serializer(cohort)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Cohort activated successfully'
        })
    
    @action(detail=True, methods=['get', 'post'])
    def sponsors(self, request, pk=None):
        """Get or assign sponsors for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            # Get sponsors assigned to this cohort
            return Response({
                'success': True,
                'data': [],
                'message': 'Sponsors retrieved successfully'
            })
        
        elif request.method == 'POST':
            # Assign sponsor to cohort
            sponsor_id = request.data.get('sponsor_id')
            seat_allocation = request.data.get('seat_allocation', 0)
            role = request.data.get('role', 'funding')
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            funding_agreement_id = request.data.get('funding_agreement_id')
            
            if not sponsor_id:
                return Response({
                    'success': False,
                    'error': 'sponsor_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not seat_allocation or seat_allocation <= 0:
                return Response({
                    'success': False,
                    'error': 'seat_allocation must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Save to database
            try:
                from sponsors.models import SponsorCohortAssignment
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                # Try to find user by ID first, then by uuid_id if that fails
                try:
                    sponsor_user = User.objects.get(id=sponsor_id)
                except (User.DoesNotExist, ValueError):
                    # If ID lookup fails, try uuid_id
                    sponsor_user = User.objects.get(uuid_id=sponsor_id)
                
                assignment, created = SponsorCohortAssignment.objects.get_or_create(
                    sponsor_uuid_id=sponsor_user,
                    cohort_id=cohort,
                    defaults={
                        'role': role,
                        'seat_allocation': seat_allocation,
                        'start_date': start_date,
                        'end_date': end_date,
                        'funding_agreement_id': funding_agreement_id
                    }
                )
                
                return Response({
                    'success': True,
                    'data': {
                        'assignment_id': str(assignment.id),
                        'cohort_id': str(cohort.id),
                        'sponsor_id': str(sponsor_user.id),
                        'sponsor_uuid_id': str(sponsor_user.uuid_id),
                        'seat_allocation': assignment.seat_allocation,
                        'role': assignment.role,
                        'start_date': assignment.start_date,
                        'end_date': assignment.end_date,
                        'funding_agreement_id': assignment.funding_agreement_id
                    },
                    'message': 'Sponsor assigned successfully'
                }, status=status.HTTP_201_CREATED)
                
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Sponsor user not found'
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({
                    'success': False,
                    'error': f'Failed to assign sponsor: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ModuleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing modules."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    
    def get_queryset(self):
        queryset = Module.objects.select_related(
            'milestone__track__program'
        ).prefetch_related('applicable_tracks')
        
        # Filter by milestone if provided
        milestone_id = self.request.query_params.get('milestone')
        if milestone_id:
            queryset = queryset.filter(milestone_id=milestone_id)
        
        # Filter by track if provided
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(milestone__track_id=track_id)
        
        # Filter by content type if provided
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        return queryset.order_by('milestone__order', 'order')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateModuleSerializer
        return ModuleSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        module = serializer.save()
        
        # Return the created module with full details
        response_serializer = ModuleSerializer(module)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for managing milestones."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    
    def get_queryset(self):
        queryset = Milestone.objects.select_related(
            'track__program'
        ).prefetch_related('modules')
        
        # Filter by track if provided
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        # Filter by program if provided
        program_id = self.request.query_params.get('program')
        if program_id:
            queryset = queryset.filter(track__program_id=program_id)
        
        return queryset.order_by('track__name', 'order')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateMilestoneSerializer
        return MilestoneSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save()
        
        # Return the created milestone with full details
        response_serializer = MilestoneSerializer(milestone)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })
    
    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        """Get all modules for a milestone."""
        milestone = self.get_object()
        modules = milestone.modules.all().order_by('order')
        serializer = ModuleSerializer(modules, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })


class SpecializationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing specializations."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    
    def get_queryset(self):
        queryset = Specialization.objects.select_related('track__program')
        
        # Filter by track if provided
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        # Filter by program if provided
        program_id = self.request.query_params.get('program')
        if program_id:
            queryset = queryset.filter(track__program_id=program_id)
        
        return queryset.order_by('track__name', 'name')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateSpecializationSerializer
        return SpecializationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        specialization = serializer.save()
        
        # Return the created specialization with full details
        response_serializer = SpecializationSerializer(specialization)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })


class CalendarTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing calendar templates."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    queryset = CalendarTemplate.objects.select_related('program', 'track')
    
    def create(self, request, *args, **kwargs):
        data = request.data
        template = CalendarTemplate.objects.create(
            program_id=data['program_id'],
            track_id=data['track_id'],
            name=data['name'],
            timezone=data.get('timezone', 'Africa/Nairobi'),
            events=data.get('events', [])
        )
        return Response({
            'success': True,
            'data': {
                'template_id': str(template.id),
                'program_id': str(template.program_id),
                'track_id': str(template.track_id),
                'name': template.name,
                'timezone': template.timezone,
                'events': template.events
            }
        }, status=status.HTTP_201_CREATED)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [{
            'template_id': str(t.id),
            'program_id': str(t.program_id),
            'track_id': str(t.track_id),
            'name': t.name,
            'timezone': t.timezone,
            'events': t.events
        } for t in queryset]
        return Response({'success': True, 'data': data})


class TrackMentorAssignmentViewSet(viewsets.ModelViewSet):
    """List, create, delete track-level mentor assignments. Directors only for write."""
    serializer_class = TrackMentorAssignmentSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        qs = TrackMentorAssignment.objects.filter(active=True).select_related('mentor', 'track')
        track_id = self.request.query_params.get('track_id')
        if track_id:
            qs = qs.filter(track_id=track_id)
        user = self.request.user
        if user.is_staff:
            return qs
        # Directors see only their tracks
        return qs.filter(track__director=user)

    def perform_create(self, serializer):
        track = serializer.validated_data['track']
        if not (self.request.user.is_staff or DirectorService.can_manage_track(self.request.user, track)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to manage this track")
        serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_staff or DirectorService.can_manage_track(self.request.user, instance.track)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to manage this track")
        instance.active = False
        instance.save()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_assignments(request):
    """Get all sponsor assignments across cohorts."""
    try:
        from sponsors.models import SponsorCohortAssignment
        
        assignments = SponsorCohortAssignment.objects.all().select_related('sponsor_uuid_id', 'cohort_id__track')
        
        data = []
        for assignment in assignments:
            data.append({
                'id': str(assignment.id),
                'sponsor_uuid_id': str(assignment.sponsor_uuid_id.uuid_id),
                'sponsor': {
                    'name': f"{assignment.sponsor_uuid_id.first_name} {assignment.sponsor_uuid_id.last_name}".strip(),
                    'email': assignment.sponsor_uuid_id.email,
                    'organization': None  # Add if needed
                },
                'cohort': {
                    'id': str(assignment.cohort_id.id),
                    'name': assignment.cohort_id.name,
                    'track': {
                        'name': assignment.cohort_id.track.name if assignment.cohort_id.track else 'Unknown Track'
                    }
                },
                'role': assignment.role,
                'seat_allocation': assignment.seat_allocation,
                'start_date': assignment.start_date.isoformat() if assignment.start_date else None,
                'end_date': assignment.end_date.isoformat() if assignment.end_date else None,
                'funding_agreement_id': assignment.funding_agreement_id,
                'created_at': assignment.created_at.isoformat(),
                'updated_at': assignment.updated_at.isoformat()
            })
        
        return Response({
            'success': True,
            'data': data,
            'count': len(data),
            'message': 'Sponsor assignments retrieved successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to retrieve sponsor assignments: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)