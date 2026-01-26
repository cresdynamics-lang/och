"""
Director views for Missions MXP - CRUD operations for Program Directors.
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from users.models import Role, UserRole
from users.utils.audit_utils import log_audit_event
from .models import Mission, MissionSubmission
from .serializers import MissionSerializer


class MissionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class MissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Mission CRUD operations (Director only).
    Endpoints:
    - GET /api/v1/missions/ - List missions with filters
    - POST /api/v1/missions/ - Create mission
    - GET /api/v1/missions/{id}/ - Get mission detail
    - PATCH /api/v1/missions/{id}/ - Update mission
    - DELETE /api/v1/missions/{id}/ - Delete mission
    """
    queryset = Mission.objects.all()
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MissionPagination
    
    def perform_create(self, serializer):
        mission = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='create',
            resource_type='mission',
            resource_id=str(mission.id),
            metadata={'code': mission.code, 'title': mission.title},
        )
        return mission

    def perform_update(self, serializer):
        mission = self.get_object()
        before = {'code': mission.code, 'title': mission.title, 'track_id': str(mission.track_id) if mission.track_id else None, 'track_key': mission.track_key}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='update',
            resource_type='mission',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated

    def perform_destroy(self, instance):
        meta = {'code': getattr(instance, 'code', None), 'title': getattr(instance, 'title', None)}
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='mission',
            resource_id=str(instance.id),
            metadata=meta,
        )
        return super().perform_destroy(instance)

    def _build_track_lookup(self, missions):
        """Build a map of track_id -> {name, key, program_id, program_name} for serializer context."""
        track_ids = {m.track_id for m in missions if getattr(m, 'track_id', None)}
        if not track_ids:
            return {}
        try:
            from programs.models import Track
        except Exception:
            return {}

        tracks = (
            Track.objects.select_related('program')
            .filter(id__in=list(track_ids))
        )
        lookup = {}
        for t in tracks:
            lookup[str(t.id)] = {
                'name': t.name,
                'key': t.key,
                'program_id': str(t.program_id) if t.program_id else None,
                'program_name': t.program.name if getattr(t, 'program', None) else None,
            }
        return lookup

    def list(self, request, *args, **kwargs):
        """List missions with track/program labels resolved server-side for accurate UI."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            track_lookup = self._build_track_lookup(page)
            serializer = self.get_serializer(
                page,
                many=True,
                context={**self.get_serializer_context(), 'track_lookup': track_lookup},
            )
            return self.get_paginated_response(serializer.data)

        track_lookup = self._build_track_lookup(queryset)
        serializer = self.get_serializer(
            queryset,
            many=True,
            context={**self.get_serializer_context(), 'track_lookup': track_lookup},
        )
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a mission with track/program labels resolved server-side."""
        instance = self.get_object()
        track_lookup = self._build_track_lookup([instance])
        serializer = self.get_serializer(
            instance,
            context={**self.get_serializer_context(), 'track_lookup': track_lookup},
        )
        return Response(serializer.data)

    def get_queryset(self):
        """Filter missions based on query parameters."""
        queryset = Mission.objects.all().order_by('-created_at')

        # Filter by program_id (via Track model)
        program_id = self.request.query_params.get('program_id')
        if program_id:
            try:
                from programs.models import Track
                track_ids = list(Track.objects.filter(program_id=program_id).values_list('id', flat=True))
                track_keys = list(Track.objects.filter(program_id=program_id).values_list('key', flat=True))
                if track_ids or track_keys:
                    queryset = queryset.filter(
                        Q(track_id__in=track_ids) | Q(track_key__in=track_keys)
                    )
            except Exception:
                # If programs app isn't available for some reason, ignore program filter
                pass
        
        # Filter by track_id
        track_id = self.request.query_params.get('track_id')
        # Filter by track_key
        track_key = self.request.query_params.get('track_key')
        if track_id and track_key:
            # Support missions that may only have one of these fields populated
            queryset = queryset.filter(Q(track_id=track_id) | Q(track_key=track_key))
        elif track_id:
            queryset = queryset.filter(track_id=track_id)
        elif track_key:
            queryset = queryset.filter(track_key=track_key)
        
        # Filter by status (stored in requirements JSON)
        status_param = self.request.query_params.get('status')
        if status_param:
            if status_param == 'draft':
                # Treat missing status as draft for backwards compatibility
                queryset = queryset.filter(Q(requirements__status='draft') | Q(requirements__status__isnull=True))
            else:
                queryset = queryset.filter(requirements__status=status_param)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Filter by type
        mission_type = self.request.query_params.get('type')
        if mission_type:
            queryset = queryset.filter(type=mission_type)
        
        # Search by code, title, or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset

    def get_permissions(self):
        """Only allow Program Directors and Admins to manage missions."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # For write operations, check for program_director or admin role
            return [IsAuthenticated()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        """Create a new mission (Program Director only)."""
        # Check if user is admin or program_director
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            if director_role:
                is_director = UserRole.objects.filter(
                    user=request.user,
                    role=director_role,
                    is_active=True
                ).exists()
                if not is_director:
                    return Response(
                        {'detail': 'Only program directors and administrators can create missions'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'detail': 'Only program directors and administrators can create missions'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                # Return detailed validation errors
                return Response(
                    {
                        'detail': 'Validation failed',
                        'errors': serializer.errors,
                        'data_received': request.data
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            # Log the full error for debugging
            import traceback
            error_message = str(e)
            error_traceback = traceback.format_exc()
            print(f"❌ Mission creation error: {error_message}")
            print(f"Traceback: {error_traceback}")
            
            # Check if it's a database column error
            if 'column' in error_message.lower() and 'does not exist' in error_message.lower():
                return Response(
                    {
                        'detail': 'Database schema is out of sync. Please run migrations: python manage.py migrate missions',
                        'error': error_message,
                        'error_type': type(e).__name__,
                        'migration_command': 'python manage.py migrate missions'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            # Return more detailed error for debugging
            return Response(
                {
                    'detail': 'Failed to create mission',
                    'error': error_message,
                    'error_type': type(e).__name__,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """Update a mission (Program Director only)."""
        # Check if user is admin or program_director
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            if director_role:
                is_director = UserRole.objects.filter(
                    user=request.user,
                    role=director_role,
                    is_active=True
                ).exists()
                if not is_director:
                    return Response(
                        {'detail': 'Only program directors and administrators can update missions'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'detail': 'Only program directors and administrators can update missions'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete a mission (Program Director only)."""
        # Check if user is admin or program_director
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            if director_role:
                is_director = UserRole.objects.filter(
                    user=request.user,
                    role=director_role,
                    is_active=True
                ).exists()
                if not is_director:
                    return Response(
                        {'detail': 'Only program directors and administrators can delete missions'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'detail': 'Only program directors and administrators can delete missions'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for a mission with enriched data."""
        from programs.models import Enrollment, MentorAssignment
        
        mission = self.get_object()
        submissions = MissionSubmission.objects.filter(mission=mission).select_related('user').order_by('-submitted_at')
        
        # Serialize submissions with enriched data
        submission_data = []
        for sub in submissions:
            # Get enrollment for cohort info
            enrollment = Enrollment.objects.filter(user=sub.user, status='active').select_related('cohort', 'cohort__track').first()
            
            # Get mentor assignment
            mentor_name = None
            mentor_id = None
            if enrollment and enrollment.cohort:
                mentor_assignment = MentorAssignment.objects.filter(
                    cohort=enrollment.cohort,
                    mentor__user=sub.user
                ).select_related('mentor__user').first()
                if mentor_assignment and mentor_assignment.mentor:
                    mentor_name = f"{mentor_assignment.mentor.first_name or ''} {mentor_assignment.mentor.last_name or ''}".strip() or mentor_assignment.mentor.email
                    mentor_id = str(mentor_assignment.mentor.id)
            
            submission_data.append({
                'id': str(sub.id),
                'user_id': sub.user.id,
                'user_email': sub.user.email,
                'user_name': f"{sub.user.first_name or ''} {sub.user.last_name or ''}".strip() or sub.user.email,
                'status': sub.status,
                'ai_score': float(sub.ai_score) if sub.ai_score else None,
                'mentor_score': float(sub.mentor_score) if sub.mentor_score else None,
                'mentor_feedback': sub.mentor_feedback or None,
                'submitted_at': sub.submitted_at.isoformat() if sub.submitted_at else None,
                'ai_reviewed_at': sub.ai_reviewed_at.isoformat() if sub.ai_reviewed_at else None,
                'mentor_reviewed_at': sub.mentor_reviewed_at.isoformat() if sub.mentor_reviewed_at else None,
                'created_at': sub.created_at.isoformat(),
                'cohort_id': str(enrollment.cohort.id) if enrollment and enrollment.cohort else None,
                'cohort_name': enrollment.cohort.name if enrollment and enrollment.cohort else None,
                'mentor_id': mentor_id,
                'mentor_name': mentor_name,
            })
        
        return Response({
            'mission_id': str(mission.id),
            'mission_code': mission.code,
            'submissions': submission_data,
            'count': len(submission_data)
        })

    @action(detail=True, methods=['post'], url_path='publish-to-cohorts')
    def publish_to_cohorts(self, request, pk=None):
        """
        Publish a mission to specific cohorts.
        POST /api/v1/missions/{id}/publish-to-cohorts/
        Body: {"cohort_ids": ["uuid1", "uuid2", ...]}
        """
        # Check if user is admin or program_director
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            if director_role:
                is_director = UserRole.objects.filter(
                    user=request.user,
                    role=director_role,
                    is_active=True
                ).exists()
                if not is_director:
                    return Response(
                        {'detail': 'Only program directors and administrators can publish missions'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'detail': 'Only program directors and administrators can publish missions'},
                    status=status.HTTP_403_FORBIDDEN
                )

        mission = self.get_object()
        cohort_ids = request.data.get('cohort_ids', [])
        
        if not cohort_ids or not isinstance(cohort_ids, list):
            return Response(
                {'detail': 'cohort_ids must be a non-empty list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate cohorts exist
        try:
            from programs.models import Cohort
            cohorts = Cohort.objects.filter(id__in=cohort_ids)
            found_ids = {str(c.id) for c in cohorts}
            requested_ids = set(cohort_ids)
            
            if found_ids != requested_ids:
                missing = requested_ids - found_ids
                return Response(
                    {'detail': f'Some cohorts not found: {list(missing)}'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except ImportError:
            return Response(
                {'detail': 'Cohort model not available'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Update mission status to published
        requirements = mission.requirements or {}
        requirements['status'] = 'published'
        
        # Store published cohorts in requirements
        requirements['published_cohorts'] = cohort_ids
        requirements['published_at'] = timezone.now().isoformat()
        requirements['published_by'] = str(request.user.id)
        
        mission.requirements = requirements
        mission.save()

        # Log audit event
        log_audit_event(
            request=request,
            user=request.user,
            action='publish_to_cohorts',
            resource_type='mission',
            resource_id=str(mission.id),
            metadata={
                'mission_code': mission.code,
                'mission_title': mission.title,
                'cohort_ids': cohort_ids,
                'cohort_count': len(cohort_ids),
            },
        )

        return Response({
            'detail': f'Mission published to {len(cohort_ids)} cohort(s) successfully',
            'mission_id': str(mission.id),
            'mission_code': mission.code,
            'cohort_ids': cohort_ids,
            'cohort_count': len(cohort_ids),
        }, status=status.HTTP_200_OK)
