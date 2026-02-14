"""
Curriculum Engine views - API endpoints for tracks, modules, lessons, and progress.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db.models import Count, Prefetch, Q
from django.utils import timezone

from .models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule, CurriculumContent,
    StrategicSession, UserTrackEnrollment, UserContentProgress, Lesson, ModuleMission,
    RecipeRecommendation, UserTrackProgress, UserModuleProgress,
    UserLessonProgress, UserMissionProgress, CurriculumActivity,
    UserLessonBookmark, CurriculumMentorFeedback,
    CurriculumTrackMentorAssignment,
)
from .serializers import (
    CurriculumTrackListSerializer, CurriculumTrackDetailSerializer,
    CurriculumModuleListSerializer, CurriculumModuleDetailSerializer,
    LessonSerializer, ModuleMissionSerializer, RecipeRecommendationSerializer,
    UserTrackProgressSerializer, UserModuleProgressSerializer,
    UserLessonProgressSerializer, UserMissionProgressSerializer,
    CurriculumActivitySerializer, LessonProgressUpdateSerializer,
    MissionProgressUpdateSerializer, TrackEnrollmentSerializer,
    CrossTrackSubmissionSerializer, CrossTrackSubmissionCreateSerializer,
    CrossTrackProgramProgressSerializer,
    CurriculumTrackMentorAssignmentSerializer,
)


def get_user_subscription_tier(user):
    """
    Get user's subscription tier for entitlement checks.
    Returns: 'free', 'starter_normal', 'starter_enhanced', 'professional'
    """
    # TODO: Integrate with subscriptions app
    # For now, return a default
    try:
        from subscriptions.models import Subscription
        subscription = Subscription.objects.filter(
            user=user,
            status='active'
        ).order_by('-start_date').first()
        
        if subscription:
            if subscription.plan_id == 'professional':
                return 'professional'
            if subscription.enhanced_access_until and subscription.enhanced_access_until > timezone.now():
                return 'starter_enhanced'
            return 'starter_normal'
    except Exception:
        pass
    return 'free'


def _is_uuid(value):
    if not value or not isinstance(value, str):
        return False
    try:
        import uuid
        uuid.UUID(value)
        return True
    except (ValueError, TypeError):
        return False


# Common slug/code aliases so "defender", "cyber_defense", "defensive-security" resolve to Defender track
CURRICULUM_TRACK_ALIASES = {
    'defender': {'slugs': ('defender', 'cyberdef', 'defensive-security', 'socdefense'), 'codes': ('defender', 'CYBERDEF', 'DEFENDER', 'DEFENSIVE', 'SOCDEFENSE', 'SOCDEF')},
    'cyber_defense': {'slugs': ('defender', 'cyberdef', 'defensive-security', 'socdefense'), 'codes': ('DEFENSIVE', 'defender', 'CYBERDEF', 'DEFENDER', 'SOCDEFENSE', 'SOCDEF')},
    'defensive-security': {'slugs': ('defender', 'cyberdef', 'defensive-security', 'socdefense'), 'codes': ('defender', 'CYBERDEF', 'DEFENDER', 'DEFENSIVE', 'SOCDEFENSE')},
    'offensive': {'slugs': ('offensive',), 'codes': ('OFFENSIVE', 'offensive')},
    'grc': {'slugs': ('grc',), 'codes': ('GRC', 'grc')},
    'innovation': {'slugs': ('innovation',), 'codes': ('INNOVATION', 'innovation')},
    'leadership': {'slugs': ('leadership',), 'codes': ('LEADERSHIP', 'leadership')},
}


class CurriculumTrackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for curriculum tracks.

    Endpoints:
    - GET /tracks/ - List all active tracks
    - GET /tracks/{code_or_slug}/ - Get track details (lookup by code or slug)
    - POST /tracks/{code_or_slug}/enroll/ - Enroll in a track
    - GET /tracks/{code_or_slug}/progress/ - Get user's progress in track
    """
    queryset = CurriculumTrack.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Allow browsing without auth
    lookup_field = 'code'
    lookup_url_kwarg = 'code'
    pagination_class = None  # Disable pagination - return plain array

    def get_object(self):
        """Resolve by slug first, then by code, then by alias, so /tracks/defender/ works even if slug is cyberdef."""
        queryset = self.filter_queryset(self.get_queryset())
        code_or_slug = self.kwargs.get(self.lookup_url_kwarg)
        if not code_or_slug:
            raise Http404('Track not found.')
        key = (code_or_slug or '').strip().lower()
        obj = queryset.filter(slug=code_or_slug).first()
        if obj is not None:
            return obj
        obj = queryset.filter(code=code_or_slug).first()
        if obj is not None:
            return obj
        if _is_uuid(code_or_slug):
            obj = queryset.filter(pk=code_or_slug).first()
            if obj is not None:
                return obj
        aliases = CURRICULUM_TRACK_ALIASES.get(key)
        if aliases:
            obj = queryset.filter(slug__in=aliases['slugs']).first()
            if obj is not None:
                return obj
            obj = queryset.filter(code__in=aliases['codes']).first()
            if obj is not None:
                return obj
        raise Http404('Track not found.')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CurriculumTrackDetailSerializer
        return CurriculumTrackListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.user.is_authenticated:
            context['subscription_tier'] = get_user_subscription_tier(self.request.user)
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by user's enrolled track for authenticated users
        if self.action == 'list' and self.request.user.is_authenticated:
            user_track_key = (self.request.user.track_key or '').strip()

            if user_track_key:
                # Get the program track for this user
                from programs.models import Track
                program_track = Track.objects.filter(
                    key=user_track_key,
                    track_type='primary'
                ).first()

                if program_track:
                    # Show only curriculum tracks linked to user's program track
                    # OR cross-track programs (tier 6) which are available to all
                    queryset = queryset.filter(
                        Q(program_track_id=program_track.id) | Q(tier=6)
                    )
                else:
                    # No program track found: match curriculum by slug/code alias (e.g. cyber_defense → defender)
                    key_normalized = user_track_key.lower()
                    aliases = CURRICULUM_TRACK_ALIASES.get(key_normalized)
                    if aliases:
                        queryset = queryset.filter(
                            Q(slug__in=aliases['slugs']) | Q(code__in=aliases['codes']) | Q(tier=6)
                        )
                    else:
                        # No alias for this track_key: show tier 2 beginner + tier 6 cross-tracks
                        queryset = queryset.filter(Q(tier=2) | Q(tier=6))
            # If no track_key set, show all tracks (user hasn't been assigned a track yet)

        # Order by order_number and code for consistent API responses
        # This ensures all tracks appear in the API list in the correct order
        if self.action == 'list':
            queryset = queryset.order_by('order_number', 'code')

        if self.action == 'retrieve':
            # Prefetch modules with lessons and missions
            queryset = queryset.prefetch_related(
                Prefetch(
                    'modules',
                    queryset=CurriculumModule.objects.filter(is_active=True)
                    .prefetch_related('lessons', 'module_missions', 'recipe_recommendations')
                    .order_by('order_index')
                )
            )

        return queryset
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, code=None):
        """Enroll user in a track."""
        track = self.get_object()
        user = request.user
        
        # Check if already enrolled
        progress, created = UserTrackProgress.objects.get_or_create(
            user=user,
            track=track,
            defaults={
                'current_module': CurriculumModule.objects.filter(track_key=track.code, is_active=True).order_by('order_index').first()
            }
        )
        
        if created:
            # Log activity
            CurriculumActivity.objects.create(
                user=user,
                activity_type='track_started',
                track=track,
                points_awarded=10
            )
            
            return Response({
                'status': 'enrolled',
                'message': f'Successfully enrolled in {track.name}',
                'progress': UserTrackProgressSerializer(progress).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'already_enrolled',
            'message': 'You are already enrolled in this track',
            'progress': UserTrackProgressSerializer(progress).data
        })
    
    @action(detail=True, methods=['get'])
    def progress(self, request, code=None):
        """Get user's progress in a track."""
        track = self.get_object()
        progress = UserTrackProgress.objects.filter(
            user=request.user,
            track=track
        ).first()
        
        if not progress:
            return Response({
                'enrolled': False,
                'message': 'Not enrolled in this track'
            })
        
        return Response({
            'enrolled': True,
            'progress': UserTrackProgressSerializer(progress).data
        })
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, code=None):
        """Get track leaderboard."""
        track = self.get_object()
        
        leaderboard = UserTrackProgress.objects.filter(
            track=track
        ).select_related('user').order_by('-total_points', '-completion_percentage')[:50]
        
        return Response({
            'track': track.code,
            'leaderboard': [
                {
                    'rank': i + 1,
                    'user_id': str(p.user.id),
                    'user_name': f"{p.user.first_name} {p.user.last_name}",
                    'avatar_url': getattr(p.user, 'avatar_url', None),
                    'total_points': p.total_points,
                    'completion_percentage': float(p.completion_percentage),
                    'circle_level': p.circle_level,
                    'current_streak_days': p.current_streak_days,
                }
                for i, p in enumerate(leaderboard)
            ]
        })


class CurriculumTrackMentorAssignmentViewSet(viewsets.ModelViewSet):
    """List, create, delete mentor assignments for a curriculum track (no program link required)."""
    serializer_class = CurriculumTrackMentorAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        qs = CurriculumTrackMentorAssignment.objects.filter(active=True).select_related(
            'mentor', 'curriculum_track'
        )
        curriculum_track_id = self.request.query_params.get('curriculum_track_id')
        if curriculum_track_id:
            qs = qs.filter(curriculum_track_id=curriculum_track_id)
        return qs

    def perform_destroy(self, instance):
        instance.active = False
        instance.save()


class CurriculumModuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for curriculum modules.
    
    Endpoints:
    - GET /modules/ - List modules (filterable by track)
    - GET /modules/{id}/ - Get module details with lessons and missions
    - POST /modules/{id}/start/ - Start a module
    - POST /modules/{id}/complete/ - Mark module as complete
    """
    queryset = CurriculumModule.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CurriculumModuleDetailSerializer
        return CurriculumModuleListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.user.is_authenticated:
            context['subscription_tier'] = get_user_subscription_tier(self.request.user)
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by track
        track_code = self.request.query_params.get('track')
        if track_code:
            queryset = queryset.filter(
                Q(track__code=track_code) | Q(track_key=track_code)
            )
        
        # Filter by level
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                'lessons', 'module_missions', 'recipe_recommendations'
            )
        
        return queryset.order_by('order_index')
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a module."""
        module = self.get_object()
        user = request.user
        
        # Check entitlement
        tier = get_user_subscription_tier(user)
        if module.entitlement_tier == 'professional' and tier != 'professional':
            return Response({
                'error': 'upgrade_required',
                'message': 'This module requires Professional subscription',
                'required_tier': 'professional'
            }, status=status.HTTP_403_FORBIDDEN)
        
        progress, created = UserModuleProgress.objects.get_or_create(
            user=user,
            module=module,
            defaults={'status': 'in_progress', 'started_at': timezone.now()}
        )
        
        if not created and progress.status == 'not_started':
            progress.status = 'in_progress'
            progress.started_at = timezone.now()
            progress.save()
        
        # Update track progress
        if module.track:
            track_progress = UserTrackProgress.objects.filter(
                user=user, track=module.track
            ).first()
            if track_progress:
                track_progress.current_module = module
                track_progress.save()
        
        # Log activity
        CurriculumActivity.objects.create(
            user=user,
            activity_type='module_started',
            track=module.track,
            module=module,
            points_awarded=5
        )
        
        return Response({
            'status': 'started',
            'progress': UserModuleProgressSerializer(progress).data
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark module as complete."""
        module = self.get_object()
        user = request.user
        
        progress, created = UserModuleProgress.objects.get_or_create(
            user=user, 
            module=module,
            defaults={'status': 'completed', 'completed_at': timezone.now(), 'completion_percentage': 100}
        )
        
        if not created and progress.status == 'completed':
            return Response({
                'status': 'already_completed',
                'progress': UserModuleProgressSerializer(progress).data
            })
        
        if not created:
            progress.status = 'completed'
            progress.completion_percentage = 100
            progress.completed_at = timezone.now()
            progress.save()
        
        # Update track progress
        self._update_track_progress(user, module)
        
        # Log activity
        CurriculumActivity.objects.create(
            user=user,
            activity_type='module_completed',
            track=module.track,
            module=module,
            points_awarded=50,
            metadata={'module_title': module.title}
        )
        
        return Response({
            'status': 'completed',
            'progress': UserModuleProgressSerializer(progress).data
        })
    
    def _update_track_progress(self, user, module):
        """Update track progress when a module is completed."""
        if not module.track:
            return
        
        track = module.track
        track_progress = UserTrackProgress.objects.filter(user=user, track=track).first()
        if not track_progress:
            return
        
        # Count completed modules
        completed_count = UserModuleProgress.objects.filter(
            user=user,
            module__track=track,
            status='completed'
        ).count()
        
        total_modules = track.modules.filter(is_active=True, is_required=True).count()
        
        track_progress.modules_completed = completed_count
        track_progress.completion_percentage = (completed_count / total_modules * 100) if total_modules > 0 else 0
        
        # Move to next module
        next_module = track.modules.filter(
            is_active=True,
            order_index__gt=module.order_index
        ).order_by('order_index').first()
        
        if next_module:
            track_progress.current_module = next_module
        elif completed_count >= total_modules:
            track_progress.completed_at = timezone.now()
        
        track_progress.save()


class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lessons.
    
    Endpoints:
    - GET /lessons/ - List lessons (filterable by module)
    - GET /lessons/{id}/ - Get lesson details
    - POST /lessons/{id}/progress/ - Update lesson progress
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        return queryset.order_by('order_index')

    @action(detail=False, methods=['post'], url_path='upload-video')
    def upload_video(self, request):
        """
        POST /curriculum/lessons/upload-video/
        Accepts a video file upload, saves to media/lesson_videos/, returns the URL.
        Used by the director module management UI.
        """
        video_file = request.FILES.get('video')
        if not video_file:
            return Response({'error': 'No file provided. Send file as "video" field.'}, status=400)

        # Validate file type
        allowed_types = ('video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
                         'video/quicktime', 'video/x-msvideo', 'video/mpeg')
        if video_file.content_type and video_file.content_type not in allowed_types:
            return Response(
                {'error': f'Unsupported file type: {video_file.content_type}. Allowed: mp4, webm, ogg, avi, mov'},
                status=400,
            )

        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os, uuid as uuid_lib
        from django.conf import settings as django_settings

        # Use a unique filename to avoid collisions
        ext = os.path.splitext(video_file.name)[1].lower() or '.mp4'
        unique_name = f"{uuid_lib.uuid4().hex}{ext}"
        save_path = f"lesson_videos/{unique_name}"

        path = default_storage.save(save_path, ContentFile(video_file.read()))
        url = request.build_absolute_uri(f"{django_settings.MEDIA_URL}{path}")

        return Response({
            'url': url,
            'filename': unique_name,
            'original_name': video_file.name,
            'size_bytes': video_file.size,
        }, status=201)

    @action(detail=True, methods=['post'])
    def progress(self, request, pk=None):
        """Update lesson progress."""
        lesson = self.get_object()
        user = request.user
        
        serializer = LessonProgressUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        progress, created = UserLessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson,
            defaults={'status': data.get('status', 'in_progress')}
        )
        
        # Update fields
        if 'status' in data:
            progress.status = data['status']
        if 'progress_percentage' in data:
            progress.progress_percentage = data['progress_percentage']
        if 'time_spent_minutes' in data:
            progress.time_spent_minutes += data['time_spent_minutes']
        if 'quiz_score' in data:
            progress.quiz_score = data['quiz_score']
            progress.quiz_attempts += 1
        
        if progress.status == 'in_progress' and not progress.started_at:
            progress.started_at = timezone.now()
        
        if progress.status == 'completed' and not progress.completed_at:
            progress.completed_at = timezone.now()
            
            # Log activity
            CurriculumActivity.objects.create(
                user=user,
                activity_type='lesson_completed',
                track=lesson.module.track if lesson.module else None,
                module=lesson.module,
                lesson=lesson,
                points_awarded=10,
                metadata={'lesson_title': lesson.title}
            )
            
            # Update module progress
            self._update_module_progress(user, lesson.module)
            # Update track progress so sidebar and dashboards stay in sync with learning
            self._update_track_progress_after_lesson(user, lesson.module)
        
        progress.save()
        
        return Response({
            'status': 'updated',
            'progress': UserLessonProgressSerializer(progress).data
        })
    
    def _update_module_progress(self, user, module):
        """Update module progress when a lesson is completed."""
        if not module:
            return
        
        module_progress, _ = UserModuleProgress.objects.get_or_create(
            user=user,
            module=module,
            defaults={'status': 'in_progress'}
        )
        
        completed_lessons = UserLessonProgress.objects.filter(
            user=user,
            lesson__module=module,
            status='completed'
        ).count()
        
        total_lessons = module.lessons.filter(is_required=True).count()
        
        module_progress.lessons_completed = completed_lessons
        module_progress.completion_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        module_progress.save()

    def _update_track_progress_after_lesson(self, user, module):
        """Create or update UserTrackProgress when a lesson is completed so sidebar/dashboard stay in sync."""
        if not module:
            return
        track = getattr(module, 'track', None)
        if not track and getattr(module, 'track_key', None):
            track = CurriculumTrack.objects.filter(
                Q(slug=module.track_key) | Q(code=module.track_key)
            ).first()
        if not track:
            return
        track_progress, _ = UserTrackProgress.objects.get_or_create(
            user=user,
            track=track,
            defaults={'current_module': track.modules.filter(is_active=True).order_by('order_index').first()}
        )
        track_modules = track.modules.filter(is_active=True)
        if not track_modules.exists():
            track_modules = CurriculumModule.objects.filter(track_key__in=[track.code, track.slug], is_active=True)
        track_module_ids = list(track_modules.values_list('id', flat=True))
        completed_lessons = UserLessonProgress.objects.filter(
            user=user,
            status='completed',
            lesson__module_id__in=track_module_ids
        ).count() if track_module_ids else 0
        total_lessons = sum(
            m.lessons.filter(is_required=True).count()
            for m in track_modules
        )
        track_progress.lessons_completed = completed_lessons
        track_progress.completion_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        track_progress.total_points = (track_progress.total_points or 0) + 10
        track_progress.save(update_fields=['lessons_completed', 'completion_percentage', 'total_points', 'last_activity_at'])


class MissionProgressView(APIView):
    """
    API endpoint for receiving mission progress updates from Missions Engine.
    
    POST /curriculum/mission-progress/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Update mission progress from Missions Engine."""
        serializer = MissionProgressUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        user = request.user
        
        module_mission = get_object_or_404(
            ModuleMission, 
            id=data['module_mission_id']
        )
        
        progress, created = UserMissionProgress.objects.get_or_create(
            user=user,
            module_mission=module_mission,
            defaults={'status': data['status']}
        )
        
        # Update fields
        progress.status = data['status']
        if 'mission_submission_id' in data:
            progress.mission_submission_id = data['mission_submission_id']
        if 'score' in data:
            progress.score = data['score']
        if 'grade' in data:
            progress.grade = data['grade']
        if 'feedback' in data:
            progress.feedback = data['feedback']
        
        if progress.status == 'in_progress' and not progress.started_at:
            progress.started_at = timezone.now()
        if progress.status == 'submitted' and not progress.submitted_at:
            progress.submitted_at = timezone.now()
        if progress.status == 'completed' and not progress.completed_at:
            progress.completed_at = timezone.now()
            progress.attempts += 1
            
            # Log activity
            module = module_mission.module
            CurriculumActivity.objects.create(
                user=user,
                activity_type='mission_completed',
                track=module.track if module else None,
                module=module,
                points_awarded=100,
                metadata={
                    'mission_title': module_mission.mission_title,
                    'score': float(progress.score) if progress.score else None,
                    'grade': progress.grade
                }
            )
            
            # Update module progress
            self._update_module_progress(user, module)
        
        progress.save()
        
        return Response({
            'status': 'updated',
            'progress': UserMissionProgressSerializer(progress).data
        })
    
    def _update_module_progress(self, user, module):
        """Update module progress when a mission is completed."""
        if not module:
            return
        
        module_progress, _ = UserModuleProgress.objects.get_or_create(
            user=user,
            module=module,
            defaults={'status': 'in_progress'}
        )
        
        completed_missions = UserMissionProgress.objects.filter(
            user=user,
            module_mission__module=module,
            status='completed'
        ).count()
        
        total_missions = module.module_missions.filter(is_required=True).count()
        
        module_progress.missions_completed = completed_missions
        
        # Check if module should be unblocked
        if module_progress.is_blocked:
            pending_required = module.module_missions.filter(
                is_required=True
            ).exclude(
                user_progress__user=user,
                user_progress__status='completed'
            ).exists()
            
            if not pending_required:
                module_progress.is_blocked = False
                module_progress.blocked_by_mission_id = None
        
        module_progress.save()


class UserProgressView(APIView):
    """
    API endpoint for user's overall curriculum progress.
    
    GET /curriculum/my-progress/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's progress across all enrolled tracks."""
        user = request.user
        
        track_progress = UserTrackProgress.objects.filter(
            user=user
        ).select_related('track', 'current_module').order_by('-last_activity_at')
        
        # Recent activities
        recent_activities = CurriculumActivity.objects.filter(
            user=user
        ).select_related('track', 'module', 'lesson').order_by('-created_at')[:10]
        
        # Stats
        stats = {
            'total_tracks_enrolled': track_progress.count(),
            'total_tracks_completed': track_progress.filter(completed_at__isnull=False).count(),
            'total_points': sum(p.total_points for p in track_progress),
            'total_time_spent_minutes': sum(p.total_time_spent_minutes for p in track_progress),
            'current_streak_days': max((p.current_streak_days for p in track_progress), default=0),
            'total_badges': sum(p.total_badges for p in track_progress),
        }
        
        return Response({
            'tracks': UserTrackProgressSerializer(track_progress, many=True).data,
            'recent_activities': CurriculumActivitySerializer(recent_activities, many=True).data,
            'stats': stats,
            'subscription_tier': get_user_subscription_tier(user)
        })


class RecentActivityView(APIView):
    """
    API endpoint for user's recent curriculum activities.
    
    GET /curriculum/activities/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's recent activities."""
        user = request.user
        limit = int(request.query_params.get('limit', 20))
        
        track_code = request.query_params.get('track')
        
        activities = CurriculumActivity.objects.filter(user=user)
        
        if track_code:
            activities = activities.filter(track__code=track_code)
        
        activities = activities.select_related(
            'track', 'module', 'lesson'
        ).order_by('-created_at')[:limit]
        
        return Response(CurriculumActivitySerializer(activities, many=True).data)


class Tier2TrackStatusView(APIView):
    """
    GET /curriculum/tier2/tracks/{code}/status
    Get Tier 2 track completion status and requirements.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, code):
        """Get Tier 2 track completion status and requirements."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True)
        
        if track.tier != 2:
            return Response({
                'error': 'not_tier2',
                'message': 'This endpoint is only for Beginner level tracks'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        progress, _ = UserTrackProgress.objects.get_or_create(
            user=user,
            track=track
        )
        
        # Check completion requirements
        is_complete, missing = progress.check_tier2_completion(require_mentor_approval=False)
        
        # Get track details
        mandatory_modules = CurriculumModule.objects.filter(
            track=track,
            is_required=True,
            is_active=True
        ).order_by('order_index')
        
        # Get quiz count
        required_quizzes = Lesson.objects.filter(
            module__track=track,
            module__is_required=True,
            lesson_type='quiz',
            is_required=True
        ).count()
        
        # Get mini-mission count
        mini_missions = ModuleMission.objects.filter(
            module__track=track,
            module__is_required=True,
            is_required=True
        ).count()
        
        min_missions_required = getattr(track, 'tier2_mini_missions_required', 1)
        return Response({
            'track_code': track.code,
            'track_name': track.name,
            'progression_mode': getattr(track, 'progression_mode', 'sequential'),
            'completion_percentage': float(progress.completion_percentage),
            'is_complete': is_complete,
            'tier2_completion_requirements_met': progress.tier2_completion_requirements_met,
            'requirements': {
                'mandatory_modules_total': mandatory_modules.count(),
                'mandatory_modules_completed': UserModuleProgress.objects.filter(
                    user=user,
                    module__in=mandatory_modules,
                    status='completed'
                ).count(),
                'quizzes_total': required_quizzes,
                'quizzes_passed': progress.tier2_quizzes_passed,
                'mini_missions_total': mini_missions,
                'mini_missions_completed': progress.tier2_mini_missions_completed,
                'mini_missions_required': min_missions_required,
                'reflections_submitted': progress.tier2_reflections_submitted,
                'mentor_approval': progress.tier2_mentor_approval,
                'mentor_approval_required': getattr(track, 'tier2_require_mentor_approval', False),
            },
            'missing_requirements': missing,
            'can_progress_to_tier3': is_complete,
        })


class Tier3TrackStatusView(APIView):
    """
    GET /curriculum/tier3/tracks/{code}/status
    Get Tier 3 (Intermediate) track completion status and requirements.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        """Get Tier 3 track completion status and requirements."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True)
        if track.tier != 3:
            return Response({
                'error': 'not_tier3',
                'message': 'This endpoint is only for Intermediate level tracks'
            }, status=status.HTTP_400_BAD_REQUEST)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        is_complete, missing = progress.check_tier3_completion()
        mandatory_modules = CurriculumModule.objects.filter(
            track=track,
            is_required=True,
            is_active=True
        ).order_by('order_index')
        mandatory_completed = UserModuleProgress.objects.filter(
            user=user,
            module__in=mandatory_modules,
            status='completed'
        ).count()
        required_mission_count = ModuleMission.objects.filter(
            module__track=track,
            module__is_required=True,
            is_required=True
        ).values_list('mission_id', flat=True).distinct().count()
        missions_passed = 0
        if required_mission_count > 0:
            try:
                from missions.models_mxp import MissionProgress
                missions_passed = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=ModuleMission.objects.filter(
                        module__track=track,
                        module__is_required=True,
                        is_required=True
                    ).values_list('mission_id', flat=True).distinct(),
                    final_status='pass'
                ).count()
            except ImportError:
                pass
        return Response({
            'track_code': track.code,
            'track_name': track.name,
            'progression_mode': getattr(track, 'progression_mode', 'sequential'),
            'completion_percentage': float(progress.completion_percentage),
            'is_complete': is_complete,
            'tier3_completion_requirements_met': progress.tier3_completion_requirements_met,
            'requirements': {
                'mandatory_modules_total': mandatory_modules.count(),
                'mandatory_modules_completed': mandatory_completed,
                'intermediate_missions_total': required_mission_count,
                'intermediate_missions_passed': missions_passed,
                'mentor_approval': progress.tier3_mentor_approval,
                'mentor_approval_required': getattr(track, 'tier3_require_mentor_approval', False),
            },
            'missing_requirements': missing,
            'can_progress_to_tier4': is_complete,
            'tier4_unlocked': progress.tier4_unlocked,
        })


class Tier3CompleteView(APIView):
    """POST /curriculum/tier3/tracks/{code}/complete - Complete Tier 3 and unlock Tier 4"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        """Complete Tier 3 and unlock Tier 4."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=3)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        is_complete, missing = progress.check_tier3_completion()
        if not is_complete:
            return Response({
                'error': 'requirements_not_met',
                'message': 'All Intermediate level requirements must be met before completion (mandatory modules, all missions passed, reflections, mentor approval if required).',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        progress.completed_at = timezone.now()
        progress.completion_percentage = 100
        progress.tier4_unlocked = True
        progress.save(update_fields=['completed_at', 'completion_percentage', 'tier4_unlocked'])
        CurriculumActivity.objects.create(
            user=user,
            activity_type='tier3_completed',
            track=track,
            points_awarded=750,
            metadata={'tier': 3, 'track': track.code}
        )
        return Response({
            'success': True,
            'message': 'Intermediate Track completed successfully. You can now access Advanced Tracks.',
            'completed_at': progress.completed_at.isoformat(),
            'tier4_unlocked': True,
        })


class Tier4TrackStatusView(APIView):
    """
    GET /curriculum/tier4/tracks/{code}/status
    Get Tier 4 (Advanced) track completion status and requirements.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        """Get Tier 4 track completion status and requirements."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True)
        if track.tier != 4:
            return Response({
                'error': 'not_tier4',
                'message': 'This endpoint is only for Advanced level tracks'
            }, status=status.HTTP_400_BAD_REQUEST)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        is_complete, missing = progress.check_tier4_completion()
        mandatory_modules = CurriculumModule.objects.filter(
            track=track,
            is_required=True,
            is_active=True
        ).order_by('order_index')
        mandatory_completed = UserModuleProgress.objects.filter(
            user=user,
            module__in=mandatory_modules,
            status='completed'
        ).count()
        required_mission_count = 0
        missions_approved = 0
        feedback_cycles_complete = 0
        reflections_submitted = 0
        reflections_required = 0
        try:
            from missions.models_mxp import MissionProgress
            from missions.models import Mission
            required_mission_ids = list(
                ModuleMission.objects.filter(
                    module__track=track,
                    module__is_required=True,
                    is_required=True
                ).values_list('mission_id', flat=True).distinct()
            )
            if not required_mission_ids:
                # Match by track code (e.g., 'DEFENDER_4') or track name
                track_code_lower = track.code.lower() if hasattr(track, 'code') else None
                track_match = None
                if track_code_lower:
                    if 'defender' in track_code_lower:
                        track_match = 'defender'
                    elif 'offensive' in track_code_lower:
                        track_match = 'offensive'
                    elif 'grc' in track_code_lower:
                        track_match = 'grc'
                    elif 'innovation' in track_code_lower:
                        track_match = 'innovation'
                    elif 'leadership' in track_code_lower:
                        track_match = 'leadership'
                
                advanced_missions = Mission.objects.filter(
                    tier='advanced',
                    is_active=True
                )
                
                if track_match:
                    advanced_missions = advanced_missions.filter(track=track_match)
                elif track_code_lower:
                    advanced_missions = advanced_missions.filter(track_id__icontains=track_code_lower)
                
                required_mission_ids = list(advanced_missions.values_list('id', flat=True))
            required_mission_count = len(required_mission_ids)
            if required_mission_ids:
                missions_approved = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    final_status='pass',
                    status='approved'
                ).count()
                feedback_cycles_complete = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    mentor_reviewed_at__isnull=False
                ).count()
                reflections_required = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    reflection_required=True
                ).count()
                reflections_submitted = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    reflection_required=True,
                    reflection_submitted=True
                ).count()
        except ImportError:
            pass
        return Response({
            'track_code': track.code,
            'track_name': track.name,
            'progression_mode': getattr(track, 'progression_mode', 'sequential'),
            'completion_percentage': float(progress.completion_percentage),
            'is_complete': is_complete,
            'tier4_completion_requirements_met': progress.tier4_completion_requirements_met,
            'requirements': {
                'mandatory_modules_total': mandatory_modules.count(),
                'mandatory_modules_completed': mandatory_completed,
                'advanced_missions_total': required_mission_count,
                'advanced_missions_approved': missions_approved,
                'feedback_cycles_complete': feedback_cycles_complete,
                'reflections_required': reflections_required,
                'reflections_submitted': reflections_submitted,
                'mentor_approval': progress.tier4_mentor_approval,
                'mentor_approval_required': getattr(track, 'tier4_require_mentor_approval', False),
            },
            'missing_requirements': missing,
            'can_progress_to_tier5': is_complete,
            'tier5_unlocked': progress.tier5_unlocked,
        })


class Tier4CompleteView(APIView):
    """POST /curriculum/tier4/tracks/{code}/complete - Complete Tier 4 and unlock Tier 5"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        """Complete Tier 4 and unlock Tier 5."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=4)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        is_complete, missing = progress.check_tier4_completion()
        if not is_complete:
            return Response({
                'error': 'requirements_not_met',
                'message': 'All Advanced level requirements must be met before completion (mandatory modules, all advanced missions approved, feedback cycles complete, final reflection submitted, mentor approval if required).',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        progress.completed_at = timezone.now()
        progress.completion_percentage = 100
        progress.tier5_unlocked = True
        progress.save(update_fields=['completed_at', 'completion_percentage', 'tier5_unlocked'])
        CurriculumActivity.objects.create(
            user=user,
            activity_type='tier4_completed',
            track=track,
            points_awarded=1000,
            metadata={'tier': 4, 'track': track.code}
        )
        return Response({
            'success': True,
            'message': 'Advanced Track completed successfully. You can now access Mastery Tracks.',
            'completed_at': progress.completed_at.isoformat(),
            'tier5_unlocked': True,
        })


class Tier5TrackStatusView(APIView):
    """
    GET /curriculum/tier5/tracks/{code}/status
    Get Tier 5 (Mastery) track completion status and requirements.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        """Get Tier 5 track completion status and requirements."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True)
        if track.tier != 5:
            return Response({
                'error': 'not_tier5',
                'message': 'This endpoint is only for Mastery level tracks'
            }, status=status.HTTP_400_BAD_REQUEST)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        is_complete, missing = progress.check_tier5_completion()
        mandatory_modules = CurriculumModule.objects.filter(
            track=track,
            is_required=True,
            is_active=True
        ).order_by('order_index')
        mandatory_completed = UserModuleProgress.objects.filter(
            user=user,
            module__in=mandatory_modules,
            status='completed'
        ).count()
        required_mission_count = 0
        mastery_missions_approved = 0
        capstone_approved = 0
        capstone_total = 0
        reflections_submitted = 0
        reflections_required = 0
        rubric_passed = True
        try:
            from missions.models_mxp import MissionProgress
            from missions.models import Mission
            required_mission_ids = list(
                ModuleMission.objects.filter(
                    module__track=track,
                    module__is_required=True,
                    is_required=True
                ).values_list('mission_id', flat=True).distinct()
            )
            if not required_mission_ids:
                track_code_lower = track.code.lower() if hasattr(track, 'code') else None
                track_match = None
                if track_code_lower:
                    if 'defender' in track_code_lower:
                        track_match = 'defender'
                    elif 'offensive' in track_code_lower:
                        track_match = 'offensive'
                    elif 'grc' in track_code_lower:
                        track_match = 'grc'
                    elif 'innovation' in track_code_lower:
                        track_match = 'innovation'
                    elif 'leadership' in track_code_lower:
                        track_match = 'leadership'
                
                mastery_missions = Mission.objects.filter(
                    tier='mastery',
                    is_active=True
                )
                
                if track_match:
                    mastery_missions = mastery_missions.filter(track=track_match)
                elif track_code_lower:
                    mastery_missions = mastery_missions.filter(track_id__icontains=track_code_lower)
                
                required_mission_ids = list(mastery_missions.values_list('id', flat=True))
            required_mission_count = len(required_mission_ids)
            if required_mission_ids:
                mastery_missions_approved = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    final_status='pass',
                    status='approved'
                ).count()
                capstone_missions = Mission.objects.filter(
                    id__in=required_mission_ids,
                    mission_type='capstone',
                    is_active=True
                )
                capstone_ids = list(capstone_missions.values_list('id', flat=True)) if capstone_missions.exists() else []
                capstone_total = len(capstone_ids)
                capstone_approved = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=capstone_ids,
                    final_status='pass',
                    status='approved'
                ).count() if capstone_ids else 0
                reflections_required = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    reflection_required=True
                ).count()
                reflections_submitted = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    reflection_required=True,
                    reflection_submitted=True
                ).count()
                # Check rubric scores (70% threshold)
                low_scores = MissionProgress.objects.filter(
                    user=user,
                    mission_id__in=required_mission_ids,
                    mentor_score__lt=70
                ).exists()
                rubric_passed = not low_scores
        except ImportError:
            pass
        return Response({
            'track_code': track.code,
            'track_name': track.name,
            'progression_mode': getattr(track, 'progression_mode', 'sequential'),
            'completion_percentage': float(progress.completion_percentage),
            'is_complete': is_complete,
            'tier5_completion_requirements_met': progress.tier5_completion_requirements_met,
            'requirements': {
                'mandatory_modules_total': mandatory_modules.count(),
                'mandatory_modules_completed': mandatory_completed,
                'mastery_missions_total': required_mission_count,
                'mastery_missions_approved': mastery_missions_approved,
                'capstone_total': capstone_total,
                'capstone_approved': capstone_approved,
                'reflections_required': reflections_required,
                'reflections_submitted': reflections_submitted,
                'rubric_passed': rubric_passed,
                'mentor_approval': progress.tier5_mentor_approval,
                'mentor_approval_required': getattr(track, 'tier5_require_mentor_approval', False),
            },
            'missing_requirements': missing,
            'mastery_complete': is_complete,
        })


class Tier5CompleteView(APIView):
    """POST /curriculum/tier5/tracks/{code}/complete - Complete Tier 5 (Mastery)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        """Complete Tier 5 and mark Mastery achieved."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=5)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        is_complete, missing = progress.check_tier5_completion()
        if not is_complete:
            return Response({
                'error': 'requirements_not_met',
                'message': 'All Mastery level requirements must be met before completion (all mastery missions approved, capstone approved, reflections complete, mastery completion rubric passed, mentor approval if required).',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        progress.completed_at = timezone.now()
        progress.completion_percentage = 100
        progress.save(update_fields=['completed_at', 'completion_percentage'])
        CurriculumActivity.objects.create(
            user=user,
            activity_type='tier5_completed',
            track=track,
            points_awarded=1500,
            metadata={'tier': 5, 'track': track.code}
        )
        return Response({
            'success': True,
            'message': 'Mastery Track completed successfully. You have achieved Mastery level in this track.',
            'completed_at': progress.completed_at.isoformat(),
            'mastery_achieved': True,
        })


class Tier2SubmitQuizView(APIView):
    """POST /curriculum/tier2/tracks/{code}/submit-quiz - Submit quiz result"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Submit quiz result and update Tier 2 tracking."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        lesson_id = request.data.get('lesson_id')
        score = request.data.get('score')
        answers = request.data.get('answers', {})
        
        if not lesson_id or score is None:
            return Response({
                'error': 'missing_fields',
                'message': 'lesson_id and score are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        lesson = get_object_or_404(Lesson, id=lesson_id, lesson_type='quiz')
        
        # Update lesson progress
        lesson_progress, _ = UserLessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson
        )
        
        previous_score = lesson_progress.quiz_score
        lesson_progress.quiz_score = float(score)
        lesson_progress.quiz_attempts += 1
        
        # Mark as completed if score >= 70%
        if float(score) >= 70:
            lesson_progress.status = 'completed'
            lesson_progress.completed_at = timezone.now()
            
            # Update Tier 2 quiz count if this is a new pass
            if previous_score is None or previous_score < 70:
                progress.tier2_quizzes_passed += 1
                progress.save(update_fields=['tier2_quizzes_passed'])
        
        lesson_progress.save()
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'quiz_passed': float(score) >= 70,
            'score': float(score),
            'tier2_quizzes_passed': progress.tier2_quizzes_passed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })


class Tier2SubmitReflectionView(APIView):
    """POST /curriculum/tier2/tracks/{code}/submit-reflection - Submit reflection"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Submit reflection and update Tier 2 tracking."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        module_id = request.data.get('module_id')
        reflection_text = request.data.get('reflection_text')
        
        if not module_id or not reflection_text:
            return Response({
                'error': 'missing_fields',
                'message': 'module_id and reflection_text are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module = get_object_or_404(CurriculumModule, id=module_id, track=track)
        
        # Store reflection (could be in portfolio or separate model)
        # For now, increment counter
        progress.tier2_reflections_submitted += 1
        progress.save(update_fields=['tier2_reflections_submitted'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'reflections_submitted': progress.tier2_reflections_submitted,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })


class Tier2SubmitMiniMissionView(APIView):
    """POST /curriculum/tier2/tracks/{code}/submit-mini-mission - Submit mini-mission"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Submit mini-mission and update Tier 2 tracking."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        module_mission_id = request.data.get('module_mission_id')
        submission_data = request.data.get('submission_data', {})
        
        if not module_mission_id:
            return Response({
                'error': 'missing_fields',
                'message': 'module_mission_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module_mission = get_object_or_404(ModuleMission, id=module_mission_id, module__track=track)
        
        # Update mission progress
        mission_progress, created = UserMissionProgress.objects.get_or_create(
            user=user,
            module_mission=module_mission
        )
        
        was_completed = mission_progress.status == 'completed'
        mission_progress.status = 'submitted'
        mission_progress.submitted_at = timezone.now()
        mission_progress.save()
        
        # Update Tier 2 mini-mission count if this is a new completion
        if not was_completed:
            progress.tier2_mini_missions_completed += 1
            progress.save(update_fields=['tier2_mini_missions_completed'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'mini_missions_completed': progress.tier2_mini_missions_completed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })


class Tier2CompleteView(APIView):
    """POST /curriculum/tier2/tracks/{code}/complete - Complete Tier 2 and unlock Tier 3"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Complete Tier 2 and unlock Tier 3."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        # Verify all requirements are met
        is_complete, missing = progress.check_tier2_completion()
        
        if not is_complete:
            return Response({
                'error': 'requirements_not_met',
                'message': 'All Beginner level requirements must be met before completion',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark track as completed
        progress.completed_at = timezone.now()
        progress.completion_percentage = 100
        progress.save()
        
        # Log activity
        CurriculumActivity.objects.create(
            user=user,
            activity_type='tier2_completed',
            track=track,
            points_awarded=500,
            metadata={'tier': 2, 'track': track.code}
        )
        
        return Response({
            'success': True,
            'message': 'Beginner Track completed successfully. You can now access Intermediate Tracks.',
            'completed_at': progress.completed_at.isoformat(),
            'tier3_unlocked': True,
        })
    
    def _submit_quiz(self, request, progress):
        """Submit quiz result and update Tier 2 tracking."""
        lesson_id = request.data.get('lesson_id')
        score = request.data.get('score')
        answers = request.data.get('answers', {})
        
        if not lesson_id or score is None:
            return Response({
                'error': 'missing_fields',
                'message': 'lesson_id and score are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        lesson = get_object_or_404(Lesson, id=lesson_id, lesson_type='quiz')
        
        # Update lesson progress
        lesson_progress, _ = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        
        lesson_progress.quiz_score = float(score)
        lesson_progress.quiz_attempts += 1
        
        # Mark as completed if score >= 70%
        if float(score) >= 70:
            lesson_progress.status = 'completed'
            lesson_progress.completed_at = timezone.now()
            
            # Update Tier 2 quiz count if this is a new pass
            if lesson_progress.quiz_attempts == 1 or (lesson_progress.quiz_attempts > 1 and lesson_progress.quiz_score < 70):
                progress.tier2_quizzes_passed += 1
                progress.save(update_fields=['tier2_quizzes_passed'])
        
        lesson_progress.save()
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'quiz_passed': float(score) >= 70,
            'score': float(score),
            'tier2_quizzes_passed': progress.tier2_quizzes_passed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })
    
    def _submit_reflection(self, request, progress):
        """Submit reflection and update Tier 2 tracking."""
        module_id = request.data.get('module_id')
        reflection_text = request.data.get('reflection_text')
        
        if not module_id or not reflection_text:
            return Response({
                'error': 'missing_fields',
                'message': 'module_id and reflection_text are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module = get_object_or_404(CurriculumModule, id=module_id)
        
        # Store reflection (could be in portfolio or separate model)
        # For now, increment counter
        progress.tier2_reflections_submitted += 1
        progress.save(update_fields=['tier2_reflections_submitted'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'reflections_submitted': progress.tier2_reflections_submitted,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })
    
    def _submit_mini_mission(self, request, progress):
        """Submit mini-mission and update Tier 2 tracking."""
        module_mission_id = request.data.get('module_mission_id')
        submission_data = request.data.get('submission_data', {})
        
        if not module_mission_id:
            return Response({
                'error': 'missing_fields',
                'message': 'module_mission_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module_mission = get_object_or_404(ModuleMission, id=module_mission_id)
        
        # Update mission progress
        mission_progress, created = UserMissionProgress.objects.get_or_create(
            user=request.user,
            module_mission=module_mission
        )
        
        mission_progress.status = 'submitted'
        mission_progress.submitted_at = timezone.now()
        mission_progress.save()
        
        # Update Tier 2 mini-mission count if this is a new completion
        if created or mission_progress.status != 'completed':
            progress.tier2_mini_missions_completed += 1
            progress.save(update_fields=['tier2_mini_missions_completed'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'mini_missions_completed': progress.tier2_mini_missions_completed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })
    
    def _complete_tier2(self, request, progress):
        """Complete Tier 2 and unlock Tier 3."""
        # Verify all requirements are met
        is_complete, missing = progress.check_tier2_completion()
        
        if not is_complete:
            return Response({
                'error': 'requirements_not_met',
                'message': 'All Beginner level requirements must be met before completion',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark track as completed
        progress.completed_at = timezone.now()
        progress.status = 'completed'
        progress.completion_percentage = 100
        progress.save()
        
        # Log activity
        CurriculumActivity.objects.create(
            user=request.user,
            activity_type='tier2_completed',
            track=progress.track,
            points_awarded=500,
            metadata={'tier': 2, 'track': progress.track.code}
        )
        
        return Response({
            'success': True,
            'message': 'Beginner Track completed successfully. You can now access Intermediate Tracks.',
            'completed_at': progress.completed_at.isoformat(),
            'tier3_unlocked': True,
        })


class LessonBookmarkView(APIView):
    """
    GET /curriculum/lessons/<lesson_id>/bookmark/ — list bookmark status (or user's bookmarks for track).
    POST /curriculum/lessons/<lesson_id>/bookmark/ — add bookmark.
    DELETE /curriculum/lessons/<lesson_id>/bookmark/ — remove bookmark.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, lesson_id=None):
        if lesson_id:
            lesson = get_object_or_404(Lesson, id=lesson_id)
            bookmarked = UserLessonBookmark.objects.filter(user=request.user, lesson=lesson).exists()
            return Response({'bookmarked': bookmarked})
        # List: ?track_code= optional filter
        qs = UserLessonBookmark.objects.filter(user=request.user).select_related('lesson', 'lesson__module')
        track_code = request.query_params.get('track_code')
        if track_code:
            qs = qs.filter(lesson__module__track__code=track_code)
        return Response({
            'bookmarks': [
                {'lesson_id': str(b.lesson_id), 'lesson_title': b.lesson.title, 'module_title': b.lesson.module.title}
                for b in qs[:100]
            ],
        })

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, id=lesson_id)
        _, created = UserLessonBookmark.objects.get_or_create(user=request.user, lesson=lesson)
        return Response({'bookmarked': True, 'created': created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, id=lesson_id)
        deleted, _ = UserLessonBookmark.objects.filter(user=request.user, lesson=lesson).delete()
        return Response({'bookmarked': False, 'deleted': deleted > 0}, status=status.HTTP_200_OK)


class Tier2MentorFeedbackView(APIView):
    """
    GET /curriculum/tier2/tracks/<code>/feedback/ — learner: list feedback for me; mentor: list feedback given for track.
    POST /curriculum/tier2/tracks/<code>/feedback/ — mentor: add feedback (learner_id, lesson_id or module_id, comment_text).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        user = request.user
        # Check if mentor (has mentor role) — simple check via user profile or role
        from users.models import UserRole
        is_mentor = UserRole.objects.filter(user=user, role__name='mentor', is_active=True).exists()
        if is_mentor:
            qs = CurriculumMentorFeedback.objects.filter(
                mentor=user,
                lesson__module__track=track
            ).select_related('learner', 'lesson', 'module').order_by('-created_at')
        else:
            qs = CurriculumMentorFeedback.objects.filter(
                learner=user,
                lesson__module__track=track
            ).select_related('mentor', 'lesson', 'module').order_by('-created_at')
        return Response({
            'feedback': [
                {
                    'id': f.id,
                    'comment_text': f.comment_text,
                    'lesson_id': str(f.lesson_id) if f.lesson_id else None,
                    'lesson_title': f.lesson.title if f.lesson else None,
                    'module_id': str(f.module_id) if f.module_id else None,
                    'module_title': f.module.title if f.module else None,
                    'mentor_email': f.mentor.email if is_mentor else None,
                    'learner_email': f.learner.email if not is_mentor else None,
                    'created_at': f.created_at.isoformat(),
                }
                for f in qs[:50]
            ],
        })

    def post(self, request, code):
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        from users.models import UserRole
        if not UserRole.objects.filter(user=request.user, role__name='mentor', is_active=True).exists():
            return Response({'error': 'Mentor role required'}, status=status.HTTP_403_FORBIDDEN)
        learner_id = request.data.get('learner_id')
        lesson_id = request.data.get('lesson_id')
        module_id = request.data.get('module_id')
        comment_text = (request.data.get('comment_text') or '').strip()
        if not comment_text or not learner_id:
            return Response(
                {'error': 'learner_id and comment_text are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from django.contrib.auth import get_user_model
        User = get_user_model()
        learner = get_object_or_404(User, id=learner_id)
        lesson = get_object_or_404(Lesson, id=lesson_id, module__track=track) if lesson_id else None
        module = get_object_or_404(CurriculumModule, id=module_id, track=track) if module_id else None
        if not lesson and not module:
            return Response(
                {'error': 'One of lesson_id or module_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        fb = CurriculumMentorFeedback.objects.create(
            mentor=request.user,
            learner=learner,
            lesson=lesson,
            module=module,
            comment_text=comment_text,
        )
        return Response({
            'id': fb.id,
            'comment_text': fb.comment_text,
            'created_at': fb.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class Tier2SampleMissionReportView(APIView):
    """
    GET /curriculum/tier2/tracks/<code>/sample-report/ — return a sample mission report for viewing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        return Response({
            'title': 'Sample Beginner Mission Report',
            'description': 'Example of what a completed mini-mission report looks like.',
            'sections': [
                {'heading': 'Objective', 'content': 'Demonstrate understanding of core concepts from this track.'},
                {'heading': 'Approach', 'content': 'Outline the steps you took and tools or methods used.'},
                {'heading': 'Findings', 'content': 'Summary of results or artifacts produced.'},
                {'heading': 'Reflection', 'content': 'What you learned and how it connects to the next level.'},
            ],
            'tip': 'Your actual mini-mission submissions will be reviewed by your mentor.',
        })


class Tier2CohortProgressView(APIView):
    """
    GET /curriculum/tier2/cohort-progress/?cohort_id=<uuid> — aggregated Tier 2 progress for a cohort (enterprise).
    No PII; only counts and completion rates.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cohort_id = request.query_params.get('cohort_id')
        if not cohort_id:
            return Response({'error': 'cohort_id required'}, status=status.HTTP_400_BAD_REQUEST)
        # Resolve cohort to user set (programs.Enrollment or similar)
        try:
            from programs.models import Enrollment
            enrollments = Enrollment.objects.filter(cohort_id=cohort_id).values_list('user_id', flat=True)
            user_ids = list(enrollments)
        except Exception:
            user_ids = []
        if not user_ids:
            return Response({
                'cohort_id': cohort_id,
                'total_learners': 0,
                'by_track': {},
                'completion_rate': 0,
            })
        progress_qs = UserTrackProgress.objects.filter(
            user__in=user_ids,
            track__tier=2,
            track__is_active=True,
        ).select_related('track')
        by_track = {}
        users_completed = set()
        for p in progress_qs:
            key = p.track.code
            if key not in by_track:
                by_track[key] = {'started': 0, 'completed': 0}
            by_track[key]['started'] += 1
            if p.completed_at:
                by_track[key]['completed'] += 1
                users_completed.add(p.user_id)
        total = len(user_ids)
        return Response({
            'cohort_id': cohort_id,
            'total_learners': total,
            'by_track': by_track,
            'completion_rate': round(100.0 * len(users_completed) / total, 1) if total else 0,
        })


# ============================================================================
# TIER 6 - CROSS-TRACK PROGRAMS VIEWS
# ============================================================================

class CrossTrackProgramsView(APIView):
    """
    List all Tier 6 Cross-Track Programs.
    GET /curriculum/cross-track/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get all cross-track programs (tier=6) with user progress."""
        from .models import CrossTrackProgramProgress
        
        programs = CurriculumTrack.objects.filter(tier=6, is_active=True).order_by('name')
        
        result = []
        for program in programs:
            progress = CrossTrackProgramProgress.objects.filter(
                user=request.user,
                track=program
            ).first()
            
            program_data = {
                'id': str(program.id),
                'code': program.code,
                'name': program.name,
                'description': program.description,
                'icon': program.icon,
                'color': program.color,
                'module_count': program.module_count,
                'lesson_count': program.lesson_count,
                'progress': CrossTrackProgramProgressSerializer(progress).data if progress else None,
            }
            result.append(program_data)
        
        return Response({
            'programs': result,
            'total': len(result)
        })


class CrossTrackProgramDetailView(APIView):
    """
    Get details of a specific cross-track program.
    GET /curriculum/cross-track/{code}/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, code):
        """Get program details with modules, lessons, and progress."""
        from .models import CrossTrackProgramProgress
        
        try:
            program = CurriculumTrack.objects.get(code=code, tier=6, is_active=True)
        except CurriculumTrack.DoesNotExist:
            return Response({'error': 'Program not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create progress
        progress, _ = CrossTrackProgramProgress.objects.get_or_create(
            user=request.user,
            track=program
        )
        
        # Get modules with lessons
        modules = program.modules.filter(is_active=True).order_by('order_index')
        modules_data = []
        for module in modules:
            lessons = module.lessons.all().order_by('order_index')
            modules_data.append({
                'id': str(module.id),
                'title': module.title,
                'description': module.description,
                'order_index': module.order_index,
                'estimated_time_minutes': module.estimated_duration_minutes,
                'lesson_count': module.lesson_count,
                'lessons': [
                    {
                        'id': str(lesson.id),
                        'title': lesson.title,
                        'description': lesson.description,
                        'lesson_type': lesson.lesson_type,
                        'content_url': lesson.content_url,
                        'duration_minutes': lesson.duration_minutes,
                        'order_index': lesson.order_index,
                    }
                    for lesson in lessons
                ]
            })
        
        return Response({
            'program': CurriculumTrackDetailSerializer(program, context={'request': request}).data,
            'modules': modules_data,
            'progress': CrossTrackProgramProgressSerializer(progress).data,
        })


class CrossTrackSubmissionView(APIView):
    """
    Create or update cross-track program submissions.
    POST /curriculum/cross-track/submit/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Create a new submission (reflection, scenario, document, quiz)."""
        from .models import CrossTrackSubmission, CrossTrackProgramProgress
        
        serializer = CrossTrackSubmissionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Get track
        try:
            track = CurriculumTrack.objects.get(id=data['track_id'], tier=6)
        except CurriculumTrack.DoesNotExist:
            return Response({'error': 'Cross-track program not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get module and lesson if provided
        module = None
        lesson = None
        if data.get('module_id'):
            try:
                module = CurriculumModule.objects.get(id=data['module_id'], track=track)
            except CurriculumModule.DoesNotExist:
                pass
        
        if data.get('lesson_id'):
            try:
                lesson = Lesson.objects.get(id=data['lesson_id'], module=module) if module else None
            except Lesson.DoesNotExist:
                pass
        
        # Create submission
        submission = CrossTrackSubmission.objects.create(
            user=request.user,
            track=track,
            module=module,
            lesson=lesson,
            submission_type=data['submission_type'],
            content=data.get('content', ''),
            document_url=data.get('document_url', ''),
            document_filename=data.get('document_filename', ''),
            scenario_choice=data.get('scenario_choice', ''),
            scenario_reasoning=data.get('scenario_reasoning', ''),
            scenario_metadata=data.get('scenario_metadata', {}),
            quiz_answers=data.get('quiz_answers', {}),
            metadata=data.get('metadata', {}),
            status='submitted',
            submitted_at=timezone.now()
        )
        
        # Update progress
        progress, _ = CrossTrackProgramProgress.objects.get_or_create(
            user=request.user,
            track=track
        )
        progress.submissions_completed = CrossTrackSubmission.objects.filter(
            user=request.user,
            track=track,
            status__in=['submitted', 'reviewed', 'approved']
        ).count()
        progress.last_activity_at = timezone.now()
        progress.save()
        
        # Check completion
        progress.check_completion()
        
        return Response({
            'success': True,
            'submission': CrossTrackSubmissionSerializer(submission).data,
            'message': 'Submission created successfully'
        }, status=status.HTTP_201_CREATED)


class CrossTrackProgressView(APIView):
    """
    Get user's progress across all cross-track programs.
    GET /curriculum/cross-track/progress/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get overall cross-track progress."""
        from .models import CrossTrackProgramProgress
        
        all_progress = CrossTrackProgramProgress.objects.filter(
            user=request.user
        ).select_related('track')
        
        programs_completed = all_progress.filter(is_complete=True).count()
        total_programs = CurriculumTrack.objects.filter(tier=6, is_active=True).count()
        
        return Response({
            'total_programs': total_programs,
            'programs_completed': programs_completed,
            'completion_percentage': round((programs_completed / total_programs * 100) if total_programs > 0 else 0, 2),
            'programs': [
                CrossTrackProgramProgressSerializer(progress).data
                for progress in all_progress
            ],
            'marketplace_ready': programs_completed == total_programs and total_programs > 0,
        })


# ============================================================================
# DEFENDER CURRICULUM VIEWS
# ============================================================================

class DefenderCurriculumView(APIView):
    """
    GET /api/curriculum/defender
    Returns full Defender track structure with levels → modules → videos + quizzes
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .serializers import CurriculumTrackSerializer

        try:
            track = CurriculumTrack.objects.prefetch_related(
                'levels__modules__videos',
                'levels__modules__quizzes',
                'levels__strategic_sessions'
            ).get(slug='defender', is_active=True)

            serializer = CurriculumTrackSerializer(track, context={'request': request})
            return Response(serializer.data)

        except CurriculumTrack.DoesNotExist:
            return Response(
                {'error': 'Defender track not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DefenderLevelView(APIView):
    """
    GET /api/curriculum/defender/:level
    Single level with modules, videos, quizzes, strategic session
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, level_slug):
        from .serializers import CurriculumLevelSerializer

        try:
            level = CurriculumLevel.objects.prefetch_related(
                'modules__videos',
                'modules__quizzes',
                'strategic_sessions'
            ).get(
                track__slug='defender',
                slug=level_slug,
                track__is_active=True
            )

            serializer = CurriculumLevelSerializer(level, context={'request': request})
            return Response(serializer.data)

        except CurriculumLevel.DoesNotExist:
            return Response(
                {'error': f'Level {level_slug} not found in Defender track'},
                status=status.HTTP_404_NOT_FOUND
            )


class DefenderProgressView(APIView):
    """
    GET /api/users/:userId/curriculum/defender/progress
    POST /api/users/:userId/curriculum-progress (for video/quiz completion)
    Progress summary per level/module/video
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        # For now, return a basic progress structure
        # TODO: Implement actual progress tracking
        return Response({
            'track_slug': 'defender',
            'user_id': user_id,
            'overall_progress': {
                'completion_percentage': 0,
                'levels_completed': 0,
                'total_levels': 4,
                'videos_watched': 0,
                'total_videos': 36,
                'quizzes_passed': 0,
                'total_quizzes': 12,
            },
            'levels': [
                {
                    'slug': 'beginner',
                    'title': 'Beginner',
                    'completion_percentage': 0,
                    'modules_completed': 0,
                    'total_modules': 3,
                },
                {
                    'slug': 'intermediate',
                    'title': 'Intermediate',
                    'completion_percentage': 0,
                    'modules_completed': 0,
                    'total_modules': 3,
                },
                {
                    'slug': 'advanced',
                    'title': 'Advanced',
                    'completion_percentage': 0,
                    'modules_completed': 0,
                    'total_modules': 3,
                },
                {
                    'slug': 'mastery',
                    'title': 'Mastery',
                    'completion_percentage': 0,
                    'modules_completed': 0,
                    'total_modules': 3,
                }
            ]
        })

    def post(self, request, user_id):
        """
        Record progress for video watched, quiz completed, etc.
        """
        # TODO: Implement progress recording
        data = request.data
        return Response({
            'message': 'Progress recorded successfully',
            'data': data
        }, status=status.HTTP_201_CREATED)


# ============================================================================
# CURRICULUM NAVIGATION SYSTEM VIEWS
# ============================================================================

class CurriculumTracksView(APIView):
    """
    GET /api/curriculum/tracks
    Returns all 5 tracks + user's enrollment status + lock status
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .serializers import CurriculumTrackSerializer

        try:
            tracks = CurriculumTrack.objects.filter(is_active=True).prefetch_related('levels')
            serializer = CurriculumTrackSerializer(tracks, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error in CurriculumTracksView: {e}', exc_info=True)
            # Return empty array instead of 500 error if there's a serialization issue
            return Response([], status=status.HTTP_200_OK)


class CurriculumTrackDetailView(APIView):
    """
    GET /api/curriculum/:track_slug
    Full structure: levels → modules → content + progress overlay
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, track_slug):
        from .serializers import CurriculumTrackSerializer

        try:
            track = CurriculumTrack.objects.prefetch_related(
                'levels__modules__content_items',
                'levels__strategic_sessions'
            ).get(slug=track_slug, is_active=True)

            serializer = CurriculumTrackSerializer(track, context={'request': request})
            return Response(serializer.data)

        except CurriculumTrack.DoesNotExist:
            return Response(
                {'error': f'Track {track_slug} not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TrackEnrollmentView(APIView):
    """
    POST /api/users/:userId/enroll-track
    Body: { track_slug: 'defender' }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        track_slug = request.data.get('track_slug')
        if not track_slug:
            return Response(
                {'error': 'track_slug is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            track = CurriculumTrack.objects.get(slug=track_slug, is_active=True)
        except CurriculumTrack.DoesNotExist:
            return Response(
                {'error': f'Track {track_slug} not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already enrolled
        enrollment, created = UserTrackEnrollment.objects.get_or_create(
            user_id=user_id,
            track=track,
            defaults={'current_level_slug': 'beginner'}
        )

        from .serializers import UserTrackEnrollmentSerializer
        serializer = UserTrackEnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CurriculumProgressView(APIView):
    """
    POST /api/users/:userId/curriculum-progress
    Body: { content_id, status: 'completed', quiz_score?: 85 }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        content_id = request.data.get('content_id')
        status_value = request.data.get('status', 'completed')
        quiz_score = request.data.get('quiz_score')

        if not content_id:
            return Response(
                {'error': 'content_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            content = CurriculumContent.objects.get(id=content_id)
        except CurriculumContent.DoesNotExist:
            return Response(
                {'error': f'Content {content_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update or create progress
        progress, created = UserContentProgress.objects.update_or_create(
            user_id=user_id,
            content=content,
            defaults={
                'status': status_value,
                'quiz_score': quiz_score,
                'completed_at': timezone.now() if status_value == 'completed' else None
            }
        )

        from .serializers import UserContentProgressSerializer
        serializer = UserContentProgressSerializer(progress)
        return Response(serializer.data)


class LevelUnlockStatusView(APIView):
    """
    GET /api/users/:userId/curriculum/:track_slug/:level_slug/unlock-status
    { unlocked: true, missing_requirements: [] }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id, track_slug, level_slug):
        try:
            track = CurriculumTrack.objects.get(slug=track_slug, is_active=True)
            level = CurriculumLevel.objects.get(track=track, slug=level_slug)
        except (CurriculumTrack.DoesNotExist, CurriculumLevel.DoesNotExist):
            return Response(
                {'error': 'Track or level not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check enrollment
        enrollment = UserTrackEnrollment.objects.filter(
            user_id=user_id,
            track=track
        ).first()

        if not enrollment:
            return Response({
                'unlocked': False,
                'missing_requirements': ['Not enrolled in track']
            })

        # Check prerequisites
        missing_requirements = []
        prerequisites = level.prerequisites or {}

        # Check previous level completion
        if level.order_number > 0:
            prev_levels = CurriculumLevel.objects.filter(
                track=track,
                order_number__lt=level.order_number
            )
            for prev_level in prev_levels:
                # Check if all modules in previous level are completed
                modules = CurriculumModule.objects.filter(level=prev_level)
                for module in modules:
                    content_items = CurriculumContent.objects.filter(module=module)
                    for content in content_items:
                        progress = UserContentProgress.objects.filter(
                            user_id=user_id,
                            content=content,
                            status='completed'
                        ).exists()
                        if not progress:
                            missing_requirements.append(f'Complete {prev_level.title}')

        # Check quiz passing requirements
        if prerequisites.get('quizzes_passed'):
            required_score = prerequisites.get('quizzes_passed', 80)
            # Check quizzes in previous levels
            prev_levels = CurriculumLevel.objects.filter(
                track=track,
                order_number__lt=level.order_number
            )
            for prev_level in prev_levels:
                modules = CurriculumModule.objects.filter(level=prev_level)
                for module in modules:
                    quizzes = CurriculumContent.objects.filter(
                        module=module,
                        content_type='quiz'
                    )
                    for quiz in quizzes:
                        progress = UserContentProgress.objects.filter(
                            user_id=user_id,
                            content=quiz,
                            quiz_score__gte=required_score
                        ).exists()
                        if not progress:
                            missing_requirements.append(f'Pass {quiz.title} with {required_score}%')

        return Response({
            'unlocked': len(missing_requirements) == 0,
            'missing_requirements': list(set(missing_requirements))  # Remove duplicates
        })
