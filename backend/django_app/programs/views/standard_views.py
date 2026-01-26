"""
API views for Programs app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db.models import Q, Count, Avg, Sum, F, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
import uuid
from programs.models import (
    Program, Track, Milestone, Module, Specialization, Cohort, Enrollment,
    CalendarEvent, MentorAssignment, ProgramRule, Certificate, Waitlist, MentorshipCycle
)
from programs.serializers import (
    ProgramSerializer, ProgramDetailSerializer, TrackSerializer, MilestoneSerializer, ModuleSerializer,
    SpecializationSerializer, CohortSerializer, EnrollmentSerializer, CalendarEventSerializer,
    MentorAssignmentSerializer, ProgramRuleSerializer, CertificateSerializer,
    CohortDashboardSerializer, WaitlistSerializer, MentorshipCycleSerializer
)
# Import from core_services module
from programs.core_services import auto_graduate_cohort, EnrollmentService, ProgramManagementService
from users.models import Role, UserRole
from users.utils.audit_utils import log_audit_event


@extend_schema(
    summary='Get Director Dashboard (Legacy)',
    description='Comprehensive director dashboard endpoint. Returns hero metrics, alerts, cohort table data, and program overview. Use /api/v1/director/dashboard/summary/ for cached version.',
    tags=['Director Dashboard'],
    deprecated=True,
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_dashboard(request):
    """
    Comprehensive director dashboard endpoint.
    Returns hero metrics, alerts, cohort table data, and program overview.
    """
    user = request.user
    
    # Get user's programs and cohorts
    if user.is_staff:
        programs = Program.objects.all()
        cohorts = Cohort.objects.all()
    else:
        programs = Program.objects.filter(tracks__director=user).distinct()
        cohorts = Cohort.objects.filter(
            Q(track__director=user) | Q(mentor_assignments__mentor=user)
        ).distinct()
    
    active_programs = programs.filter(status='active').count()
    active_cohorts = cohorts.filter(status__in=['active', 'running'])
    
    # Hero Metrics
    total_seats_used = sum(c.enrollments.filter(status='active').count() for c in active_cohorts)
    total_seats_available = sum(c.seat_cap for c in active_cohorts)
    seat_utilization = (total_seats_used / total_seats_available * 100) if total_seats_available > 0 else 0
    
    # Calculate average readiness (mock - should come from TalentScope)
    avg_readiness = 65.0  # TODO: Aggregate from student_dashboard_cache
    
    completion_rates = [c.completion_rate or 0 for c in active_cohorts if c.completion_rate]
    avg_completion = sum(completion_rates) / len(completion_rates) if completion_rates else 0
    
    # Revenue per seat (mock - should come from billing)
    revenue_per_seat = 0.0  # TODO: Calculate from billing data
    
    # Alerts - items needing attention
    alerts = []
    
    # Cohorts at risk (low completion or readiness)
    for cohort in active_cohorts:
        if (cohort.completion_rate or 0) < 50:
            alerts.append({
                'type': 'cohort_at_risk',
                'severity': 'high',
                'title': f'Low completion rate: {cohort.name}',
                'message': f'Completion rate is {cohort.completion_rate or 0}%',
                'cohort_id': str(cohort.id),
                'action_url': f'/dashboard/director/cohorts/{cohort.id}'
            })
        
        # Check seat utilization
        enrolled_count = cohort.enrollments.filter(status='active').count()
        utilization = (enrolled_count / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0
        if utilization < 60 and enrolled_count > 0:
            alerts.append({
                'type': 'underfilled_cohort',
                'severity': 'medium',
                'title': f'Under-filled cohort: {cohort.name}',
                'message': f'Only {utilization:.0f}% of seats filled',
                'cohort_id': str(cohort.id),
                'action_url': f'/dashboard/director/cohorts/{cohort.id}'
            })
        elif utilization >= 95:
            alerts.append({
                'type': 'overfilled_cohort',
                'severity': 'medium',
                'title': f'Near capacity: {cohort.name}',
                'message': f'{utilization:.0f}% of seats filled',
                'cohort_id': str(cohort.id),
                'action_url': f'/dashboard/director/cohorts/{cohort.id}'
            })
    
    # Mentor SLA breaches (mock - should check mentor performance)
    # TODO: Check mentor session completion rates, feedback scores
    
    # Payment anomalies
    pending_payments = Enrollment.objects.filter(
        cohort__in=active_cohorts,
        payment_status='pending',
        status='active'
    ).count()
    
    if pending_payments > 0:
        alerts.append({
            'type': 'payment_anomaly',
            'severity': 'medium',
            'title': f'{pending_payments} pending payments',
            'message': 'Review payment status for active enrollments',
            'action_url': '/dashboard/director/reports?filter=payments'
        })
    
    # Cohort Table Data
    cohort_table = []
    for cohort in active_cohorts:
        enrollments = cohort.enrollments.filter(status='active')
        mentor_count = cohort.mentor_assignments.filter(active=True).count()
        
        # Upcoming milestones
        upcoming_events = CalendarEvent.objects.filter(
            cohort=cohort,
            start_ts__gte=timezone.now()
        ).order_by('start_ts')[:3]
        
        milestones = [
            {
                'title': event.title,
                'date': event.start_ts.isoformat(),
                'type': event.type
            }
            for event in upcoming_events
        ]
        
        enrolled_count = cohort.enrollments.filter(status='active').count()
        cohort_table.append({
            'id': str(cohort.id),
            'name': cohort.name,
            'track_name': cohort.track.name if cohort.track else '',
            'program_name': cohort.track.program.name if cohort.track and cohort.track.program else '',
            'status': cohort.status,
            'seats_used': enrolled_count,
            'seats_available': cohort.seat_cap - enrolled_count,
            'seats_total': cohort.seat_cap,
            'readiness_delta': 0.0,  # TODO: Calculate from TalentScope
            'completion_rate': cohort.completion_rate or 0,
            'mentor_coverage': mentor_count,
            'upcoming_milestones': milestones,
            'start_date': cohort.start_date.isoformat() if cohort.start_date else None,
            'end_date': cohort.end_date.isoformat() if cohort.end_date else None,
        })
    
    # Sort cohorts by status and start date
    cohort_table.sort(key=lambda x: (
        {'running': 0, 'active': 1, 'closing': 2, 'closed': 3}.get(x['status'], 4),
        x['start_date'] or ''
    ))
    
    return Response({
        'hero_metrics': {
            'active_programs': active_programs,
            'active_cohorts': active_cohorts.count(),
            'seats_used': total_seats_used,
            'seats_available': total_seats_available,
            'seat_utilization': round(seat_utilization, 1),
            'avg_readiness': round(avg_readiness, 1),
            'avg_completion_rate': round(avg_completion, 1),
            'revenue_per_seat': revenue_per_seat,
        },
        'alerts': alerts[:10],  # Top 10 alerts
        'cohort_table': cohort_table,
        'programs': ProgramSerializer(programs, many=True).data,
    })


class ProgramViewSet(viewsets.ModelViewSet):
    """ViewSet for Program model with full CRUD support."""
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use detail serializer for retrieve action."""
        if self.action == 'retrieve':
            return ProgramDetailSerializer
        return ProgramSerializer
    
    def get_queryset(self):
        """Filter programs based on user permissions and query params."""
        user = self.request.user
        queryset = Program.objects.all()
        
        # Filter by category (check both category field and categories array)
        category = self.request.query_params.get('category')
        if category:
            # Check if category matches the primary category field OR is in the categories array
            # For PostgreSQL JSONField, __contains checks if the JSON array contains the value
            queryset = queryset.filter(
                Q(category=category) | Q(categories__contains=[category])
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Permission filtering
        if not user.is_staff:
            # Check if user has program_director or admin role
            from users.models import UserRole, Role
            director_roles = Role.objects.filter(name__in=['program_director', 'admin'])
            has_program_director_role = UserRole.objects.filter(
                user=user,
                role__in=director_roles,
                is_active=True
            ).exists()
            
            if has_program_director_role:
                # Program directors can see all programs (they may create programs without assigning themselves as track directors)
                pass  # No filtering needed
            else:
                # Regular users can only see programs where they are directors of tracks
                director_has_tracks = user.directed_tracks.exists()
                if director_has_tracks:
                    queryset = queryset.filter(
                        Q(tracks__director=user) | Q(tracks__isnull=True)
                    ).distinct()
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        program = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='create',
            resource_type='program',
            resource_id=str(program.id),
            metadata={'name': program.name},
        )
        return program

    def perform_update(self, serializer):
        program = self.get_object()
        before = {'name': program.name, 'status': getattr(program, 'status', None)}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='update',
            resource_type='program',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated

    def perform_destroy(self, instance):
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='program',
            resource_id=str(instance.id),
            metadata={'name': getattr(instance, 'name', None)},
        )
        return super().perform_destroy(instance)


class TrackViewSet(viewsets.ModelViewSet):
    """ViewSet for Track model."""
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tracks based on user permissions and prefetch related data."""
        from django.db.models import Prefetch
        import logging
        
        logger = logging.getLogger(__name__)
        
        user = self.request.user
        program_id = self.request.query_params.get('program_id')
        track_type = self.request.query_params.get('track_type')
        
        # Prefetch related data for better performance
        queryset = Track.objects.select_related('program', 'director').prefetch_related(
            Prefetch('milestones', queryset=Milestone.objects.prefetch_related(
                Prefetch('modules')
            ).order_by('order')),
            Prefetch('specializations')
        )
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        if track_type:
            queryset = queryset.filter(track_type=track_type)
        
        # Permission filtering: Allow access if user is staff, director of track, has program_director role, or is a mentor assigned to cohorts with this track
        if not user.is_staff:
            # Check if user has program_director or admin role
            from users.models import UserRole, Role
            director_roles = Role.objects.filter(name__in=['program_director', 'admin'])
            has_program_director_role = UserRole.objects.filter(
                user=user,
                role__in=director_roles,
                is_active=True
            ).exists()
            
            logger.info(f"TrackViewSet: User {user.id} has_program_director_role: {has_program_director_role}, program_id: {program_id}")
            
            if has_program_director_role:
                # Program directors can see all tracks in programs they have access to
                # If filtering by program_id, they can see all tracks in that program
                # (Permission to view the program itself is checked at the program level)
                logger.info(f"TrackViewSet: Program director user, returning all tracks for program {program_id}")
            else:
                # Regular users can see tracks they are directors of OR tracks from cohorts they're assigned as mentors
                queryset = queryset.filter(
                    Q(director=user) | 
                    Q(program__tracks__director=user) |
                    Q(cohorts__mentor_assignments__mentor=user, cohorts__mentor_assignments__active=True)
                ).distinct()
                logger.info(f"TrackViewSet: Filtered queryset count: {queryset.count()}")
        else:
            logger.info(f"TrackViewSet: Staff user, returning all tracks")
        
        result = queryset.order_by('program__name', 'name')
        logger.info(f"TrackViewSet: Final queryset count: {result.count()}")
        return result

    def perform_create(self, serializer):
        track = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='create',
            resource_type='track',
            resource_id=str(track.id),
            metadata={'name': track.name, 'program_id': str(track.program_id) if track.program_id else None},
        )
        return track

    def perform_update(self, serializer):
        track = self.get_object()
        before = {'name': track.name, 'program_id': str(track.program_id) if track.program_id else None, 'key': getattr(track, 'key', None)}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='update',
            resource_type='track',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated

    def perform_destroy(self, instance):
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='track',
            resource_id=str(instance.id),
            metadata={'name': getattr(instance, 'name', None), 'program_id': str(getattr(instance, 'program_id', '') or '')},
        )
        return super().perform_destroy(instance)


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for Milestone model."""
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter milestones by track."""
        track_id = self.request.query_params.get('track_id')
        queryset = Milestone.objects.all()
        
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        return queryset.order_by('track', 'order')


class ModuleViewSet(viewsets.ModelViewSet):
    """ViewSet for Module model."""
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter modules by milestone or track."""
        milestone_id = self.request.query_params.get('milestone_id')
        track_id = self.request.query_params.get('track_id')
        queryset = Module.objects.all()
        
        if milestone_id:
            queryset = queryset.filter(milestone_id=milestone_id)
        elif track_id:
            queryset = queryset.filter(milestone__track_id=track_id)
        
        return queryset.order_by('milestone', 'order')


class CohortViewSet(viewsets.ModelViewSet):
    """ViewSet for Cohort model."""
    queryset = Cohort.objects.all()
    serializer_class = CohortSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Create cohort with logging."""
        import logging
        logger = logging.getLogger(__name__)
        
        data = request.data.copy()
        # Log incoming data (excluding potentially large fields)
        data_preview = {k: v for k, v in data.items() if k not in ['seat_pool']}
        logger.info(f"Creating cohort with data keys: {list(data.keys())}")
        logger.info(f"Creating cohort with data values: {data_preview}")
        
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            logger.error(f"Cohort validation failed: {serializer.errors}")
            logger.error(f"Received data: {data_preview}")
            return Response(
                {
                    'error': 'Validation failed',
                    'details': serializer.errors,
                    'received_data': data_preview
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        logger.info(f"Cohort created successfully: {serializer.data.get('id')} - {serializer.data.get('name')}")
        log_audit_event(
            request=request,
            user=request.user,
            action='create',
            resource_type='cohort',
            resource_id=str(serializer.data.get('id')) if serializer.data.get('id') else None,
            metadata={
                'name': serializer.data.get('name'),
                'track': data_preview.get('track'),
                'start_date': data_preview.get('start_date'),
                'end_date': data_preview.get('end_date'),
            },
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        cohort = self.get_object()
        before = {'name': cohort.name, 'status': getattr(cohort, 'status', None), 'track_id': str(cohort.track_id)}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='update',
            resource_type='cohort',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated

    def perform_destroy(self, instance):
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='cohort',
            resource_id=str(instance.id),
            metadata={'name': getattr(instance, 'name', None), 'track_id': str(getattr(instance, 'track_id', '') or '')},
        )
        return super().perform_destroy(instance)
    
    def get_queryset(self):
        """Filter cohorts based on user permissions."""
        user = self.request.user
        track_id = self.request.query_params.get('track_id')
        status_filter = self.request.query_params.get('status')
        view_all = self.request.query_params.get('view_all', '').lower() in ('true', '1', 'yes')
        
        queryset = Cohort.objects.all()
        
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if not user.is_staff:
            # If view_all is requested and user is a mentor, allow read-only access to all active cohorts
            if view_all and user.is_mentor:
                # Mentors can view all cohorts (read-only) when view_all=true
                # Only show active/running cohorts for better UX
                queryset = queryset.filter(status__in=['active', 'running'])
            else:
                # Base visibility: tracks user directs OR cohorts they're assigned as mentors
                visibility_q = (
                    Q(track__director=user) |
                    Q(mentor_assignments__mentor=user) |
                    Q(track__program__tracks__director=user)  # cohorts in programs where they direct at least one track
                )

                # Also support RBAC UserRole scoping for program_director (track/cohort scopes)
                director_role = Role.objects.filter(name='program_director').first()
                if director_role:
                    director_roles = UserRole.objects.filter(user=user, role=director_role, is_active=True)

                    # scope_ref based grants
                    cohort_refs = list(director_roles.filter(scope='cohort', scope_ref__isnull=False).values_list('scope_ref', flat=True))
                    track_refs = list(director_roles.filter(scope='track', scope_ref__isnull=False).values_list('scope_ref', flat=True))

                    # legacy string-based grants
                    legacy_track_keys = list(director_roles.exclude(track_key__isnull=True).exclude(track_key='').values_list('track_key', flat=True))
                    legacy_cohort_ids_raw = list(director_roles.exclude(cohort_id__isnull=True).exclude(cohort_id='').values_list('cohort_id', flat=True))
                    legacy_cohort_ids = []
                    for raw in legacy_cohort_ids_raw:
                        try:
                            legacy_cohort_ids.append(uuid.UUID(str(raw)))
                        except Exception:
                            continue

                    if cohort_refs or legacy_cohort_ids:
                        visibility_q = visibility_q | Q(id__in=cohort_refs + legacy_cohort_ids)
                    if track_refs:
                        visibility_q = visibility_q | Q(track_id__in=track_refs)
                    if legacy_track_keys:
                        visibility_q = visibility_q | Q(track__key__in=legacy_track_keys)

                    # If they have a global program_director role, treat it as broad access
                    if director_roles.filter(scope='global').exists():
                        visibility_q = Q()  # no restriction

                queryset = queryset.filter(visibility_q).distinct()
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Get cohort dashboard data."""
        cohort = self.get_object()
        
        enrollments = cohort.enrollments.filter(status='active')
        enrollments_count = enrollments.count()
        
        # Calculate readiness delta (mock - should come from analytics)
        readiness_delta = 0.0
        
        # Payment status
        payments_complete = enrollments.filter(payment_status='paid').count()
        payments_pending = enrollments.filter(payment_status='pending').count()
        
        dashboard_data = {
            'cohort_id': cohort.id,
            'cohort_name': cohort.name,
            'track_name': cohort.track.name,
            'enrollments_count': enrollments_count,
            'seat_utilization': cohort.seat_utilization,
            'mentor_assignments_count': cohort.mentor_assignments.filter(active=True).count(),
            'readiness_delta': readiness_delta,
            'completion_percentage': cohort.completion_rate,
            'payments_complete': payments_complete,
            'payments_pending': payments_pending,
        }
        
        serializer = CohortDashboardSerializer(dashboard_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def calendar(self, request, pk=None):
        """Get or create calendar events for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            events = CalendarEvent.objects.filter(cohort=cohort)
            serializer = CalendarEventSerializer(events, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['cohort'] = cohort.id
            serializer = CalendarEventSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def enrollments(self, request, pk=None):
        """Get or create enrollments for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            enrollments = Enrollment.objects.filter(cohort=cohort)
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Use EnrollmentService for validation and waitlist handling
            user_id = request.data.get('user', request.user.id)
            enrollment_type = request.data.get('enrollment_type', 'self')
            seat_type = request.data.get('seat_type', 'paid')
            org_id = request.data.get('org')
            
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            org = None
            if org_id:
                from organizations.models import Organization
                try:
                    org = Organization.objects.get(id=org_id)
                except Organization.DoesNotExist:
                    pass
            
            enrollment, is_waitlisted, error = EnrollmentService.create_enrollment(
                user=user,
                cohort=cohort,
                enrollment_type=enrollment_type,
                seat_type=seat_type,
                org=org
            )
            
            if error:
                return Response(
                    {'error': error, 'is_waitlisted': is_waitlisted},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if is_waitlisted:
                serializer = WaitlistSerializer(enrollment)
                return Response(
                    {'waitlist_entry': serializer.data, 'is_waitlisted': True},
                    status=status.HTTP_201_CREATED
                )
            else:
                serializer = EnrollmentSerializer(enrollment)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get', 'post'])
    def mentors(self, request, pk=None):
        """Get or assign mentors for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            assignments = MentorAssignment.objects.filter(cohort=cohort, active=True)
            serializer = MentorAssignmentSerializer(assignments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            from django.contrib.auth import get_user_model
            from programs.services.director_service import DirectorService
            User = get_user_model()
            
            data = request.data.copy()
            data['cohort'] = cohort.id  # Use UUID object, DRF will handle it
            
            # Check if mentor is already assigned
            mentor_id = data.get('mentor')
            if not mentor_id:
                return Response(
                    {'mentor': ['This field is required.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert mentor_id to integer if it's a string (User PK is BigAutoField)
            try:
                if isinstance(mentor_id, str):
                    mentor_id = int(mentor_id)
                data['mentor'] = mentor_id
                
                # Verify mentor exists
                try:
                    mentor = User.objects.get(id=mentor_id)
                except User.DoesNotExist:
                    return Response(
                        {'mentor': [f'Mentor with ID {mentor_id} does not exist.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'mentor': ['Invalid mentor ID format.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for existing assignment (including inactive ones for unique constraint)
            existing = MentorAssignment.objects.filter(
                cohort=cohort,
                mentor_id=mentor_id
            ).first()
            if existing:
                if existing.active:
                    return Response(
                        {'error': 'This mentor is already assigned to this cohort.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    # Reactivate the existing assignment instead of creating a new one
                    existing.active = True
                    existing.role = data.get('role', 'support')
                    existing.save()
                    serializer = MentorAssignmentSerializer(existing)
                    return Response(serializer.data, status=status.HTTP_200_OK)
            
            # Check permissions before validation
            if not (request.user.is_staff or DirectorService.can_manage_cohort(request.user, cohort)):
                return Response(
                    {'error': 'You do not have permission to manage this cohort'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = MentorAssignmentSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # Log validation errors for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'MentorAssignmentSerializer validation failed: {serializer.errors}')
            logger.error(f'Data sent to serializer: {data}')
            
            # Return detailed validation errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def auto_graduate(self, request, pk=None):
        """Auto-graduate students in cohort based on completion rules."""
        cohort = self.get_object()
        rule_id = request.data.get('rule_id')
        
        result = auto_graduate_cohort(str(cohort.id), rule_id)
        
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export cohort report as CSV or JSON."""
        cohort = self.get_object()
        format_type = request.query_params.get('format', 'json')
        
        # Get cohort data
        enrollments = Enrollment.objects.filter(cohort=cohort)
        enrollments_data = EnrollmentSerializer(enrollments, many=True).data
        
        if format_type == 'csv':
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="cohort_{cohort.id}_report.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['User Email', 'Status', 'Payment Status', 'Seat Type', 'Joined At'])
            
            for enrollment in enrollments_data:
                writer.writerow([
                    enrollment.get('user_email', ''),
                    enrollment.get('status', ''),
                    enrollment.get('payment_status', ''),
                    enrollment.get('seat_type', ''),
                    enrollment.get('joined_at', ''),
                ])
            
            return response
        
        # JSON format
        return Response({
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'enrollments': enrollments_data,
            'seat_utilization': cohort.seat_utilization,
            'completion_rate': cohort.completion_rate,
        })
    
    @action(detail=True, methods=['get', 'post'])
    def waitlist(self, request, pk=None):
        """Get waitlist or promote from waitlist."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            waitlist_entries = Waitlist.objects.filter(cohort=cohort, active=True)
            serializer = WaitlistSerializer(waitlist_entries, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Promote users from waitlist
            count = int(request.data.get('count', 1))
            promoted = EnrollmentService.promote_from_waitlist(cohort, count)
            
            if promoted:
                serializer = EnrollmentSerializer(promoted, many=True)
                return Response({
                    'promoted': serializer.data,
                    'count': len(promoted)
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'message': 'No users could be promoted from waitlist'},
                    status=status.HTTP_200_OK
                )

    @action(detail=True, methods=['get', 'post'], url_path='mentorship-cycle')
    def mentorship_cycle(self, request, pk=None):
        """Get or create mentorship cycle for this cohort."""
        cohort = self.get_object()

        if request.method == 'GET':
            # Get existing mentorship cycle
            try:
                cycle = MentorshipCycle.objects.get(cohort=cohort)
                serializer = MentorshipCycleSerializer(cycle)
                return Response(serializer.data)
            except MentorshipCycle.DoesNotExist:
                return Response(
                    {'error': 'No mentorship cycle found for this cohort'},
                    status=status.HTTP_404_NOT_FOUND
                )

        elif request.method == 'POST':
            # Create or update mentorship cycle
            data = request.data.copy()
            data['cohort'] = cohort.id

            # Check if cycle already exists for this cohort
            existing_cycle = MentorshipCycle.objects.filter(cohort=cohort).first()

            if existing_cycle:
                # Update existing cycle
                serializer = MentorshipCycleSerializer(existing_cycle, data=data)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Create new cycle
                serializer = MentorshipCycleSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProgramRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for ProgramRule model."""
    queryset = ProgramRule.objects.filter(active=True)
    serializer_class = ProgramRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter rules by program."""
        program_id = self.request.query_params.get('program_id')
        queryset = ProgramRule.objects.filter(active=True)
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        return queryset


class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Certificate model (read-only)."""
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download certificate file."""
        certificate = self.get_object()
        if certificate.file_uri:
            return Response({'file_uri': certificate.file_uri})
        return Response(
            {'error': 'Certificate file not available'},
            status=status.HTTP_404_NOT_FOUND
        )


@extend_schema_view(
    list=extend_schema(
        summary='List Mentorship Cycles',
        description='Get all mentorship cycles with cohort, track, and program information.',
        tags=['Mentorship Cycles']
    ),
    retrieve=extend_schema(
        summary='Get Mentorship Cycle',
        description='Get detailed information about a specific mentorship cycle.',
        tags=['Mentorship Cycles']
    ),
    create=extend_schema(
        summary='Create Mentorship Cycle',
        description='Create a new mentorship cycle for a cohort.',
        tags=['Mentorship Cycles']
    ),
    update=extend_schema(
        summary='Update Mentorship Cycle',
        description='Update an existing mentorship cycle.',
        tags=['Mentorship Cycles']
    ),
    partial_update=extend_schema(
        summary='Partial Update Mentorship Cycle',
        description='Partially update an existing mentorship cycle.',
        tags=['Mentorship Cycles']
    ),
    destroy=extend_schema(
        summary='Delete Mentorship Cycle',
        description='Delete a mentorship cycle.',
        tags=['Mentorship Cycles']
    ),
)
class MentorshipCycleViewSet(viewsets.ModelViewSet):
    """ViewSet for Mentorship Cycle model."""
    queryset = MentorshipCycle.objects.select_related(
        'cohort__track__program'
    ).all()
    serializer_class = MentorshipCycleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on user permissions."""
        queryset = super().get_queryset()
        user = self.request.user

        # If user is staff, return all cycles
        if user.is_staff:
            return queryset

        # Otherwise, filter by programs where user is director
        return queryset.filter(
            cohort__track__program__tracks__director=user
        ).distinct()
