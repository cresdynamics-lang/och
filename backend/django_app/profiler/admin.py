"""
Admin interface for Profiler.
"""
from django.contrib import admin
from django.utils import timezone
from .models import ProfilerSession, ProfilerAnswer, ProfilerQuestion, ProfilerResult, ProfilerRetakeRequest


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


@admin.register(ProfilerRetakeRequest)
class ProfilerRetakeRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'created_at', 'reviewed_by', 'reviewed_at']
    list_filter = ['status', 'created_at', 'reviewed_at']
    search_fields = ['user__email', 'reason', 'admin_notes']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Request Info', {
            'fields': ('id', 'user', 'original_session', 'reason', 'status', 'created_at', 'updated_at')
        }),
        ('Admin Review', {
            'fields': ('reviewed_by', 'admin_notes', 'reviewed_at', 'new_session')
        }),
    )
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        """Approve selected retake requests."""
        count = 0
        for retake_request in queryset.filter(status='pending'):
            retake_request.approve(request.user, 'Bulk approved via admin')
            count += 1
        self.message_user(request, f'{count} retake request(s) approved.')
    approve_requests.short_description = 'Approve selected retake requests'
    
    def reject_requests(self, request, queryset):
        """Reject selected retake requests."""
        count = 0
        for retake_request in queryset.filter(status='pending'):
            retake_request.reject(request.user, 'Bulk rejected via admin')
            count += 1
        self.message_user(request, f'{count} retake request(s) rejected.')
    reject_requests.short_description = 'Reject selected retake requests'
