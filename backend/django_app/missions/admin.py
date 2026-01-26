"""
Admin interface for Missions MXP.
"""
from django.contrib import admin
from .models import Mission, MissionSubmission, MissionArtifact, AIFeedback


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'est_hours', 'created_at']
    list_filter = ['difficulty', 'created_at']
    search_fields = ['title', 'description']


@admin.register(MissionSubmission)
class MissionSubmissionAdmin(admin.ModelAdmin):
    list_display = ['mission', 'user', 'status', 'ai_score', 'submitted_at']
    list_filter = ['status', 'submitted_at']
    search_fields = ['mission__title', 'user__email']


@admin.register(MissionArtifact)
class MissionArtifactAdmin(admin.ModelAdmin):
    list_display = ['kind', 'filename', 'submission', 'size_bytes', 'created_at']
    list_filter = ['kind', 'created_at']
    search_fields = ['filename', 'submission__mission__title']


@admin.register(AIFeedback)
class AIFeedbackAdmin(admin.ModelAdmin):
    list_display = ['submission', 'score', 'created_at']
    list_filter = ['created_at']
    search_fields = ['submission__mission__title', 'submission__user__email']
