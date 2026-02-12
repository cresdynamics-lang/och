"""
Curriculum Engine serializers - API responses for tracks, modules, lessons, and progress.
"""
from rest_framework import serializers
from django.db.models import Count, Avg
from .models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule, CurriculumContent,
    StrategicSession, UserTrackEnrollment, UserContentProgress, Lesson, ModuleMission,
    RecipeRecommendation, UserTrackProgress, UserModuleProgress,
    UserLessonProgress, UserMissionProgress, CurriculumActivity,
    CrossTrackSubmission, CrossTrackProgramProgress
)


# New Curriculum Navigation System Serializers

class CurriculumTrackSerializer(serializers.ModelSerializer):
    """Serializer for curriculum tracks"""
    levels_count = serializers.SerializerMethodField()
    total_duration_hours = serializers.SerializerMethodField()
    user_enrollment = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumTrack
        fields = [
            'id', 'slug', 'title', 'description', 'thumbnail_url',
            'order_number', 'levels_count', 'total_duration_hours',
            'user_enrollment', 'created_at'
        ]

    def get_levels_count(self, obj):
        return obj.levels.count()

    def get_total_duration_hours(self, obj):
        return sum(level.estimated_duration_hours or 0 for level in obj.levels.all())

    def get_user_enrollment(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = UserTrackEnrollment.objects.filter(
                user_id=request.user.id,
                track=obj
            ).first()
            if enrollment:
                return {
                    'enrolled': True,
                    'current_level': enrollment.current_level_slug,
                    'progress_percent': float(enrollment.progress_percent)
                }
        return {'enrolled': False}


class CurriculumLevelSerializer(serializers.ModelSerializer):
    """Serializer for curriculum levels"""
    modules_count = serializers.SerializerMethodField()
    strategic_session = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumLevel
        fields = [
            'id', 'slug', 'title', 'description', 'order_number',
            'estimated_duration_hours', 'prerequisites', 'modules_count',
            'strategic_session', 'created_at'
        ]

    def get_modules_count(self, obj):
        return obj.modules.count()

    def get_strategic_session(self, obj):
        session = obj.strategic_sessions.first()
        if session:
            return {
                'id': session.id,
                'title': session.title,
                'requires_professional': session.requires_professional
            }
        return None


class CurriculumContentSerializer(serializers.ModelSerializer):
    """Serializer for curriculum content"""
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumContent
        fields = [
            'id', 'slug', 'title', 'content_type', 'video_url',
            'quiz_data', 'duration_seconds', 'order_number',
            'user_progress', 'created_at'
        ]

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = UserContentProgress.objects.filter(
                user_id=request.user.id,
                content=obj
            ).first()
            if progress:
                return {
                    'status': progress.status,
                    'quiz_score': float(progress.quiz_score) if progress.quiz_score else None,
                    'completed_at': progress.completed_at
                }
        return {'status': 'not_started'}


class CurriculumModuleSerializer(serializers.ModelSerializer):
    """Serializer for curriculum modules"""
    content_count = serializers.SerializerMethodField()
    content_items = CurriculumContentSerializer(many=True, read_only=True)

    class Meta:
        model = CurriculumModule
        fields = [
            'id', 'slug', 'title', 'description', 'order_number',
            'estimated_duration_minutes', 'supporting_recipes',
            'is_locked_by_default', 'content_count', 'content_items',
            'created_at'
        ]

    def get_content_count(self, obj):
        return obj.content_items.count()


class UserTrackEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for user track enrollments"""
    track_title = serializers.CharField(source='track.title', read_only=True)

    class Meta:
        model = UserTrackEnrollment
        fields = [
            'user_id', 'track', 'track_title', 'current_level_slug',
            'progress_percent', 'enrolled_at'
        ]


class UserContentProgressSerializer(serializers.ModelSerializer):
    """Serializer for user content progress"""
    content_title = serializers.CharField(source='content.title', read_only=True)
    content_type = serializers.CharField(source='content.content_type', read_only=True)

    class Meta:
        model = UserContentProgress
        fields = [
            'user_id', 'content', 'content_title', 'content_type',
            'status', 'quiz_score', 'completed_at', 'updated_at'
        ]


class CurriculumContentSerializer(serializers.ModelSerializer):
    """Serializer for curriculum content (videos and quizzes)."""
    is_completed = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumContent
        fields = [
            'id', 'slug', 'title', 'content_type', 'video_url',
            'quiz_data', 'duration_seconds', 'order_number',
            'is_completed', 'user_progress', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user:
            try:
                progress = UserContentProgress.objects.get(
                    user_id=request.user.id,
                    content=obj
                )
                return progress.status == 'completed'
            except UserContentProgress.DoesNotExist:
                return False
        return False

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user:
            try:
                return UserContentProgressSerializer(
                    UserContentProgress.objects.get(
                        user_id=request.user.id,
                        content=obj
                    )
                ).data
            except UserContentProgress.DoesNotExist:
                return None
        return None


class CurriculumModuleDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for curriculum modules with content."""
    content_items = CurriculumContentSerializer(many=True, read_only=True)

    class Meta:
        model = CurriculumModule
        fields = [
            'id', 'slug', 'title', 'description', 'order_index',
            'estimated_duration_minutes', 'supporting_recipes',
            'videos', 'quizzes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CurriculumLevelSerializer(serializers.ModelSerializer):
    """Serializer for curriculum levels."""
    modules = CurriculumModuleDetailSerializer(many=True, read_only=True)
    strategic_sessions = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumLevel
        fields = [
            'id', 'slug', 'title', 'description', 'order_number',
            'estimated_duration_hours', 'modules', 'strategic_sessions',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_strategic_sessions(self, obj):
        sessions = obj.strategic_sessions.all()
        return [{
            'id': session.id,
            'title': session.title,
            'description': session.description,
            'agenda_items': session.agenda_items,
            'estimated_duration_minutes': session.estimated_duration_minutes,
            'supporting_recipes': session.supporting_recipes,
        } for session in sessions]


class CurriculumTrackSerializer(serializers.ModelSerializer):
    """Serializer for curriculum tracks."""
    levels = CurriculumLevelSerializer(many=True, read_only=True)

    class Meta:
        model = CurriculumTrack
        fields = [
            'id', 'code', 'slug', 'name', 'title', 'description', 'tier',
            'icon', 'color', 'estimated_duration_weeks', 'levels',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for lessons."""
    is_completed = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()
    module = serializers.PrimaryKeyRelatedField(
        queryset=CurriculumModule.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Lesson
        fields = [
            'id', 'module', 'title', 'description', 'content_url', 'lesson_type',
            'duration_minutes', 'order_index', 'is_required',
            'is_completed', 'user_progress', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user_progress.filter(
                user=request.user, 
                status='completed'
            ).exists()
        return False
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = obj.user_progress.filter(user=request.user).first()
            if progress:
                return {
                    'status': progress.status,
                    'progress_percentage': float(progress.progress_percentage),
                    'time_spent_minutes': progress.time_spent_minutes,
                    'quiz_score': float(progress.quiz_score) if progress.quiz_score else None,
                }
        return None


class ModuleMissionSerializer(serializers.ModelSerializer):
    """Serializer for module-mission links."""
    user_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = ModuleMission
        fields = [
            'id', 'mission_id', 'mission_title', 'mission_difficulty',
            'mission_estimated_hours', 'is_required', 'recommended_order',
            'user_progress'
        ]
        read_only_fields = ['id']
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = obj.user_progress.filter(user=request.user).first()
            if progress:
                return {
                    'status': progress.status,
                    'score': float(progress.score) if progress.score else None,
                    'grade': progress.grade,
                    'attempts': progress.attempts,
                }
        return None


class RecipeRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for recipe recommendations."""
    
    class Meta:
        model = RecipeRecommendation
        fields = [
            'id', 'recipe_id', 'recipe_title', 'recipe_duration_minutes',
            'recipe_difficulty', 'relevance_score', 'order_index'
        ]
        read_only_fields = ['id']


class CurriculumModuleListSerializer(serializers.ModelSerializer):
    """List serializer for curriculum modules (minimal data)."""
    lesson_count = serializers.SerializerMethodField()
    mission_count = serializers.IntegerField(read_only=True)

    def get_lesson_count(self, obj):
        return obj.lessons.count()
    completion_percentage = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    estimated_time_minutes = serializers.IntegerField(source='estimated_duration_minutes', read_only=True)

    class Meta:
        model = CurriculumModule
        fields = [
            'id', 'title', 'description', 'track_key', 'order_index',
            'level', 'entitlement_tier', 'is_core', 'is_required',
            'estimated_time_minutes', 'lesson_count', 'mission_count',
            'completion_percentage', 'is_locked', 'mentor_notes'
        ]
        read_only_fields = ['id']
    
    def get_completion_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = obj.user_progress.filter(user=request.user).first()
            if progress:
                return float(progress.completion_percentage)
        return 0
    
    def get_is_locked(self, obj):
        """Check if module is locked based on subscription tier."""
        request = self.context.get('request')
        subscription_tier = self.context.get('subscription_tier', 'free')
        
        if obj.entitlement_tier == 'all':
            return False
        if obj.entitlement_tier == 'professional' and subscription_tier != 'professional':
            return True
        if obj.entitlement_tier == 'starter_enhanced' and subscription_tier not in ['starter_enhanced', 'professional']:
            return True
        return False


class CurriculumModuleDetailSerializer(serializers.ModelSerializer):
    """Detail serializer for curriculum modules (full data)."""
    lessons = LessonSerializer(many=True, read_only=True)
    module_missions = ModuleMissionSerializer(many=True, read_only=True)
    recipe_recommendations = RecipeRecommendationSerializer(many=True, read_only=True)
    user_progress = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    estimated_time_minutes = serializers.IntegerField(source='estimated_duration_minutes', read_only=True)
    lesson_count = serializers.SerializerMethodField()

    def get_lesson_count(self, obj):
        return obj.lessons.count()
    
    class Meta:
        model = CurriculumModule
        fields = [
            'id', 'title', 'description', 'track_key', 'track',
            'order_index', 'level', 'entitlement_tier', 'is_core', 'is_required',
            'estimated_time_minutes', 'competencies', 'mentor_notes',
            'lesson_count', 'mission_count', 'is_active',
            'lessons', 'module_missions', 'recipe_recommendations',
            'user_progress', 'is_locked', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = obj.user_progress.filter(user=request.user).first()
            if progress:
                return {
                    'status': progress.status,
                    'completion_percentage': float(progress.completion_percentage),
                    'lessons_completed': progress.lessons_completed,
                    'missions_completed': progress.missions_completed,
                    'is_blocked': progress.is_blocked,
                    'time_spent_minutes': progress.time_spent_minutes,
                }
        return None
    
    def get_is_locked(self, obj):
        subscription_tier = self.context.get('subscription_tier', 'free')
        if obj.entitlement_tier == 'all':
            return False
        if obj.entitlement_tier == 'professional' and subscription_tier != 'professional':
            return True
        if obj.entitlement_tier == 'starter_enhanced' and subscription_tier not in ['starter_enhanced', 'professional']:
            return True
        return False


class CurriculumTrackListSerializer(serializers.ModelSerializer):
    """List serializer for curriculum tracks."""
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumTrack
        fields = [
            'id', 'code', 'slug', 'name', 'title', 'description',
            'level', 'tier', 'order_number', 'thumbnail_url',
            'icon', 'color', 'estimated_duration_weeks',
            'module_count', 'lesson_count', 'mission_count',
            'is_active', 'user_progress'
        ]
        read_only_fields = ['id']
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = obj.user_progress.filter(user=request.user).first()
            if progress:
                return {
                    'completion_percentage': float(progress.completion_percentage),
                    'circle_level': progress.circle_level,
                    'phase': progress.phase,
                    'current_streak_days': progress.current_streak_days,
                }
        return None


class CurriculumTrackDetailSerializer(serializers.ModelSerializer):
    """Detail serializer for curriculum tracks (full data)."""
    modules = CurriculumModuleListSerializer(many=True, read_only=True)
    user_progress = serializers.SerializerMethodField()
    recent_activities = serializers.SerializerMethodField()
    next_action = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumTrack
        fields = [
            'id', 'code', 'slug', 'name', 'title', 'description',
            'level', 'tier', 'order_number', 'thumbnail_url',
            'icon', 'color', 'program_track_id',
            'estimated_duration_weeks', 'module_count', 'lesson_count',
            'mission_count', 'is_active', 'modules',
            'user_progress', 'recent_activities', 'next_action',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = obj.user_progress.filter(user=request.user).first()
            if progress:
                return UserTrackProgressSerializer(progress).data
        return None
    
    def get_recent_activities(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            activities = CurriculumActivity.objects.filter(
                user=request.user,
                track=obj
            ).order_by('-created_at')[:5]
            return CurriculumActivitySerializer(activities, many=True).data
        return []
    
    def get_next_action(self, obj):
        """Calculate the next recommended action for the user."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        # Find first incomplete required module
        user_progress = obj.user_progress.filter(user=request.user).first()
        if not user_progress or not user_progress.current_module:
            # Get first module
            first_module = obj.modules.filter(is_active=True).order_by('order_index').first()
            if first_module:
                return {
                    'type': 'start_module',
                    'icon': '🚀',
                    'label': f'Start {first_module.title}',
                    'module_id': str(first_module.id),
                    'url': f'/curriculum/{obj.code}/module/{first_module.id}'
                }
        else:
            current = user_progress.current_module
            # Check if there's a pending mission
            pending_mission = current.module_missions.exclude(
                user_progress__user=request.user,
                user_progress__status='completed'
            ).first()
            
            if pending_mission:
                return {
                    'type': 'start_mission',
                    'icon': '🎯',
                    'label': f'Complete: {pending_mission.mission_title}',
                    'mission_id': str(pending_mission.mission_id),
                    'url': f'/missions/{pending_mission.mission_id}'
                }
            
            # Check for incomplete lessons
            incomplete_lesson = current.lessons.exclude(
                user_progress__user=request.user,
                user_progress__status='completed'
            ).first()
            
            if incomplete_lesson:
                return {
                    'type': 'continue_lesson',
                    'icon': '📚',
                    'label': f'Continue: {incomplete_lesson.title}',
                    'lesson_id': str(incomplete_lesson.id),
                    'url': f'/curriculum/{obj.code}/lesson/{incomplete_lesson.id}'
                }
            
            # Module complete, move to next
            next_module = obj.modules.filter(
                is_active=True,
                order_index__gt=current.order_index
            ).order_by('order_index').first()
            
            if next_module:
                return {
                    'type': 'next_module',
                    'icon': '⏭️',
                    'label': f'Next: {next_module.title}',
                    'module_id': str(next_module.id),
                    'url': f'/curriculum/{obj.code}/module/{next_module.id}'
                }
        
        return {
            'type': 'track_complete',
            'icon': '🎉',
            'label': 'Track Completed!',
            'url': f'/curriculum/{obj.code}/complete'
        }


class UserTrackProgressSerializer(serializers.ModelSerializer):
    """Serializer for user track progress."""
    track_name = serializers.CharField(source='track.name', read_only=True)
    track_code = serializers.CharField(source='track.code', read_only=True)
    current_module_title = serializers.CharField(source='current_module.title', read_only=True, allow_null=True)
    
    class Meta:
        model = UserTrackProgress
        fields = [
            'id', 'track', 'track_name', 'track_code',
            'current_module', 'current_module_title',
            'completion_percentage', 'modules_completed',
            'lessons_completed', 'missions_completed',
            'total_time_spent_minutes', 'estimated_completion_date',
            'circle_level', 'phase', 'total_points',
            'current_streak_days', 'longest_streak_days', 'total_badges',
            'university_rank', 'global_rank',
            'started_at', 'last_activity_at', 'completed_at',
            # Tier 2 specific fields
            'tier2_quizzes_passed', 'tier2_mini_missions_completed',
            'tier2_reflections_submitted', 'tier2_mentor_approval',
            'tier2_completion_requirements_met',
        ]
        read_only_fields = ['id', 'started_at', 'last_activity_at']


class UserModuleProgressSerializer(serializers.ModelSerializer):
    """Serializer for user module progress."""
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = UserModuleProgress
        fields = [
            'id', 'module', 'module_title', 'status',
            'completion_percentage', 'lessons_completed', 'missions_completed',
            'is_blocked', 'blocked_by_mission_id', 'time_spent_minutes',
            'started_at', 'completed_at', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class UserLessonProgressSerializer(serializers.ModelSerializer):
    """Serializer for user lesson progress."""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    
    class Meta:
        model = UserLessonProgress
        fields = [
            'id', 'lesson', 'lesson_title', 'status',
            'progress_percentage', 'quiz_score', 'quiz_attempts',
            'time_spent_minutes', 'started_at', 'completed_at', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class UserMissionProgressSerializer(serializers.ModelSerializer):
    """Serializer for user mission progress."""
    mission_title = serializers.CharField(source='module_mission.mission_title', read_only=True)
    
    class Meta:
        model = UserMissionProgress
        fields = [
            'id', 'module_mission', 'mission_title', 'status',
            'mission_submission_id', 'score', 'grade', 'feedback',
            'time_spent_minutes', 'attempts',
            'started_at', 'submitted_at', 'completed_at', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class CurriculumActivitySerializer(serializers.ModelSerializer):
    """Serializer for curriculum activities."""
    track_name = serializers.CharField(source='track.name', read_only=True, allow_null=True)
    module_title = serializers.CharField(source='module.title', read_only=True, allow_null=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, allow_null=True)
    
    class Meta:
        model = CurriculumActivity
        fields = [
            'id', 'activity_type', 'track', 'track_name',
            'module', 'module_title', 'lesson', 'lesson_title',
            'metadata', 'points_awarded', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ==================== Progress Update Serializers ====================

class LessonProgressUpdateSerializer(serializers.Serializer):
    """Serializer for updating lesson progress."""
    lesson_id = serializers.UUIDField(required=False)  # Optional - comes from URL pk
    status = serializers.ChoiceField(choices=['not_started', 'in_progress', 'completed'])
    progress_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    time_spent_minutes = serializers.IntegerField(required=False, min_value=0)
    quiz_score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)


class MissionProgressUpdateSerializer(serializers.Serializer):
    """Serializer for updating mission progress from Missions Engine."""
    module_mission_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=['not_started', 'in_progress', 'submitted', 'completed', 'failed'])
    mission_submission_id = serializers.UUIDField(required=False)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    grade = serializers.CharField(max_length=10, required=False)
    feedback = serializers.CharField(required=False, allow_blank=True)


class TrackEnrollmentSerializer(serializers.Serializer):
    """Serializer for enrolling in a track."""
    track_id = serializers.UUIDField()


# ==================== TIER 6 - CROSS-TRACK PROGRAMS SERIALIZERS ====================

class CrossTrackSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for cross-track program submissions."""
    track_name = serializers.CharField(source='track.name', read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True, allow_null=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, allow_null=True)
    mentor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CrossTrackSubmission
        fields = [
            'id', 'track', 'track_name', 'module', 'module_title',
            'lesson', 'lesson_title', 'submission_type', 'status',
            'content', 'document_url', 'document_filename',
            'scenario_choice', 'scenario_reasoning', 'scenario_metadata',
            'quiz_answers', 'quiz_score',
            'mentor_feedback', 'mentor_rating', 'mentor_reviewed_at',
            'mentor_reviewed_by', 'mentor_name',
            'metadata', 'created_at', 'updated_at', 'submitted_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'submitted_at', 'mentor_reviewed_at']
    
    def get_mentor_name(self, obj):
        if obj.mentor_reviewed_by:
            return f"{obj.mentor_reviewed_by.first_name} {obj.mentor_reviewed_by.last_name}".strip() or obj.mentor_reviewed_by.email
        return None


class CrossTrackSubmissionCreateSerializer(serializers.Serializer):
    """Serializer for creating cross-track submissions."""
    track_id = serializers.UUIDField()
    module_id = serializers.UUIDField(required=False, allow_null=True)
    lesson_id = serializers.UUIDField(required=False, allow_null=True)
    submission_type = serializers.ChoiceField(choices=CrossTrackSubmission.SUBMISSION_TYPE_CHOICES)
    content = serializers.CharField(required=False, allow_blank=True)
    document_url = serializers.URLField(required=False, allow_blank=True)
    document_filename = serializers.CharField(max_length=255, required=False, allow_blank=True)
    scenario_choice = serializers.CharField(max_length=100, required=False, allow_blank=True)
    scenario_reasoning = serializers.CharField(required=False, allow_blank=True)
    scenario_metadata = serializers.JSONField(required=False, default=dict)
    quiz_answers = serializers.JSONField(required=False, default=dict)
    metadata = serializers.JSONField(required=False, default=dict)


class CrossTrackProgramProgressSerializer(serializers.ModelSerializer):
    """Serializer for cross-track program progress."""
    track_name = serializers.CharField(source='track.name', read_only=True)
    track_code = serializers.CharField(source='track.code', read_only=True)
    
    class Meta:
        model = CrossTrackProgramProgress
        fields = [
            'id', 'track', 'track_name', 'track_code',
            'completion_percentage', 'modules_completed',
            'lessons_completed', 'submissions_completed',
            'all_modules_completed', 'all_reflections_submitted',
            'all_quizzes_passed', 'final_summary_submitted',
            'is_complete', 'total_time_spent_minutes',
            'started_at', 'last_activity_at', 'completed_at'
        ]
        read_only_fields = ['id', 'started_at', 'last_activity_at', 'completed_at']

