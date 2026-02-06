"""
Admin interface for Missions MXP.
"""
from django.contrib import admin
from .models import Mission, MissionSubmission


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'estimated_duration_min', 'created_at']
    list_filter = ['difficulty', 'created_at']
    search_fields = ['title', 'description']


@admin.register(MissionSubmission)
class MissionSubmissionAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'student', 'status', 'score', 'submitted_at']
    list_filter = ['status', 'submitted_at']
    search_fields = ['assignment__mission__title', 'student__email']
