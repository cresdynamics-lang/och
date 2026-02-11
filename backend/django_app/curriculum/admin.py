"""
Curriculum Engine admin configuration.
"""
from django.contrib import admin
from .models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule, CurriculumContent,
    StrategicSession, Lesson, ModuleMission,
    RecipeRecommendation, UserTrackProgress, UserModuleProgress,
    UserLessonProgress, UserMissionProgress, CurriculumActivity,
    UserTrackEnrollment, UserContentProgress,
    UserLessonBookmark, CurriculumMentorFeedback,
)


@admin.register(CurriculumTrack)
class CurriculumTrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'tier', 'progression_mode', 'order_number', 'is_active', 'created_at']
    list_filter = ['is_active', 'tier', 'progression_mode', 'order_number']
    search_fields = ['title', 'slug', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order_number', 'title']


@admin.register(CurriculumModule)
class CurriculumModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'get_level_title', 'track_key', 'order_index', 'entitlement_tier', 'is_core', 'is_active']
    list_filter = ['track_key', 'entitlement_tier', 'is_core', 'is_active']
    search_fields = ['title', 'description', 'track_key']
    readonly_fields = ['lesson_count', 'mission_count', 'created_at', 'updated_at']
    ordering = ['track_key', 'order_index']

    def get_level_title(self, obj):
        return obj.level.title if obj.level else 'No Level'
    get_level_title.short_description = 'Level'


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'lesson_type', 'duration_minutes', 'order_index', 'is_required']
    list_filter = ['lesson_type', 'is_required', 'module__track_key']
    search_fields = ['title', 'description']
    raw_id_fields = ['module']
    ordering = ['module', 'order_index']


@admin.register(ModuleMission)
class ModuleMissionAdmin(admin.ModelAdmin):
    list_display = ['module', 'mission_title', 'mission_difficulty', 'is_required', 'recommended_order']
    list_filter = ['is_required', 'mission_difficulty', 'module__track_key']
    search_fields = ['mission_title', 'module__title']
    raw_id_fields = ['module']
    ordering = ['module', 'recommended_order']


@admin.register(RecipeRecommendation)
class RecipeRecommendationAdmin(admin.ModelAdmin):
    list_display = ['module', 'recipe_title', 'recipe_difficulty', 'relevance_score', 'order_index']
    list_filter = ['recipe_difficulty', 'module__track_key']
    search_fields = ['recipe_title', 'module__title']
    raw_id_fields = ['module']
    ordering = ['module', 'order_index']


@admin.register(UserTrackProgress)
class UserTrackProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'track', 'completion_percentage', 'circle_level', 'phase', 'total_points', 'last_activity_at']
    list_filter = ['track', 'circle_level', 'phase']
    search_fields = ['user__email', 'track__name']
    raw_id_fields = ['user', 'track', 'current_module']
    readonly_fields = ['started_at', 'last_activity_at']
    ordering = ['-last_activity_at']


@admin.register(UserModuleProgress)
class UserModuleProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'module', 'status', 'completion_percentage', 'is_blocked', 'updated_at']
    list_filter = ['status', 'is_blocked', 'module__track_key']
    search_fields = ['user__email', 'module__title']
    raw_id_fields = ['user', 'module']
    readonly_fields = ['updated_at']
    ordering = ['-updated_at']


@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'status', 'progress_percentage', 'quiz_score', 'updated_at']
    list_filter = ['status', 'lesson__lesson_type']
    search_fields = ['user__email', 'lesson__title']
    raw_id_fields = ['user', 'lesson']
    readonly_fields = ['updated_at']
    ordering = ['-updated_at']


@admin.register(UserMissionProgress)
class UserMissionProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'module_mission', 'status', 'score', 'grade', 'attempts', 'updated_at']
    list_filter = ['status', 'grade']
    search_fields = ['user__email', 'module_mission__mission_title']
    raw_id_fields = ['user', 'module_mission']
    readonly_fields = ['updated_at']
    ordering = ['-updated_at']


@admin.register(UserLessonBookmark)
class UserLessonBookmarkAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'lesson__title']
    raw_id_fields = ['user', 'lesson']
    ordering = ['-created_at']


@admin.register(CurriculumMentorFeedback)
class CurriculumMentorFeedbackAdmin(admin.ModelAdmin):
    list_display = ['mentor', 'learner', 'lesson', 'module', 'created_at']
    list_filter = ['created_at']
    search_fields = ['mentor__email', 'learner__email', 'comment_text']
    raw_id_fields = ['mentor', 'learner', 'lesson', 'module']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(CurriculumActivity)
class CurriculumActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'track', 'module', 'points_awarded', 'created_at']
    list_filter = ['activity_type', 'track']
    search_fields = ['user__email', 'track__name', 'module__title']
    raw_id_fields = ['user', 'track', 'module', 'lesson']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


# New Defender Curriculum Admin Classes

@admin.register(CurriculumLevel)
class CurriculumLevelAdmin(admin.ModelAdmin):
    list_display = ['title', 'track', 'slug', 'order_number', 'estimated_duration_hours', 'created_at']
    list_filter = ['track', 'order_number']
    search_fields = ['title', 'description', 'slug']
    raw_id_fields = ['track']
    ordering = ['track', 'order_number']


@admin.register(CurriculumContent)
class CurriculumContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'content_type', 'slug', 'order_number', 'duration_seconds', 'created_at']
    list_filter = ['content_type', 'order_number']
    search_fields = ['title', 'slug']
    raw_id_fields = ['module']
    ordering = ['module', 'order_number']


@admin.register(StrategicSession)
class StrategicSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'level', 'estimated_duration_minutes', 'requires_professional', 'created_at']
    list_filter = ['level__slug', 'estimated_duration_minutes', 'requires_professional']
    search_fields = ['title', 'description']
    raw_id_fields = ['level']
    ordering = ['level', 'created_at']


@admin.register(UserTrackEnrollment)
class UserTrackEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'track', 'current_level_slug', 'progress_percent', 'enrolled_at']
    list_filter = ['current_level_slug', 'enrolled_at']
    search_fields = ['track__title']
    raw_id_fields = ['track']
    ordering = ['-enrolled_at']


@admin.register(UserContentProgress)
class UserContentProgressAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'content', 'status', 'quiz_score', 'completed_at']
    list_filter = ['status', 'completed_at']
    search_fields = ['content__title']
    raw_id_fields = ['content']
    ordering = ['-updated_at']

