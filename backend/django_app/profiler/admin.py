"""
Admin interface for Profiler.
"""
from django.contrib import admin
from .models import ProfilerSession, ProfilerAnswer, ProfilerQuestion, ProfilerResult


@admin.register(ProfilerSession)
class ProfilerSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'is_locked', 'aptitude_score', 'started_at', 'completed_at']
    list_filter = ['status', 'is_locked', 'started_at']
    search_fields = ['user__email', 'session_token']
    readonly_fields = ['id', 'session_token', 'started_at', 'last_activity', 'completed_at', 'locked_at']
    fieldsets = (
        ('Session Info', {
            'fields': ('id', 'user', 'session_token', 'status', 'is_locked')
        }),
        ('Progress', {
            'fields': ('current_section', 'current_question_index', 'total_questions')
        }),
        ('Scores', {
            'fields': ('aptitude_score', 'track_confidence', 'recommended_track_id')
        }),
        ('Timing', {
            'fields': ('started_at', 'last_activity', 'completed_at', 'locked_at', 'time_spent_seconds')
        }),
        ('Results', {
            'fields': ('strengths', 'behavioral_profile', 'futureyou_persona'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProfilerAnswer)
class ProfilerAnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'question', 'question_key', 'is_correct', 'points_earned', 'created_at']
    list_filter = ['question_key', 'is_correct', 'created_at']
    search_fields = ['session__user__email', 'question_key', 'question__question_text']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(ProfilerQuestion)
class ProfilerQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_type', 'category', 'question_order', 'answer_type', 'is_active', 'created_at']
    list_filter = ['question_type', 'answer_type', 'category', 'is_active', 'created_at']
    search_fields = ['question_text', 'category']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['question_type', 'question_order']


@admin.register(ProfilerResult)
class ProfilerResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'overall_score', 'aptitude_score', 'behavioral_score', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('Result Info', {
            'fields': ('id', 'session', 'user', 'created_at')
        }),
        ('Scores', {
            'fields': ('overall_score', 'aptitude_score', 'behavioral_score')
        }),
        ('Analysis', {
            'fields': ('aptitude_breakdown', 'behavioral_traits', 'strengths', 'areas_for_growth'),
            'classes': ('collapse',)
        }),
        ('Recommendations', {
            'fields': ('recommended_tracks', 'learning_path_suggestions', 'och_mapping'),
            'classes': ('collapse',)
        }),
    )
