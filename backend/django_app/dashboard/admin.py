from django.contrib import admin
from .models import (
    ReadinessScore, CohortProgress, PortfolioItem, MentorshipSession,
    GamificationPoints, DashboardEvent, CommunityActivity
)


@admin.register(ReadinessScore)
class ReadinessScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'score', 'max_score', 'trend_direction', 'countdown_days', 'updated_at']
    list_filter = ['trend_direction', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CohortProgress)
class CohortProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'cohort_id', 'percentage', 'completed_modules', 'total_modules', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['user__email', 'current_module']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(PortfolioItem)
class PortfolioItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(MentorshipSession)
class MentorshipSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'mentor_name', 'session_type', 'next_session_date', 'status', 'updated_at']
    list_filter = ['session_type', 'status', 'next_session_date']
    search_fields = ['user__email', 'mentor_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(GamificationPoints)
class GamificationPointsAdmin(admin.ModelAdmin):
    list_display = ['user', 'points', 'streak', 'badges', 'rank', 'updated_at']
    list_filter = ['rank', 'updated_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-points']


@admin.register(DashboardEvent)
class DashboardEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'date', 'time', 'event_type', 'urgency', 'rsvp_status', 'created_at']
    list_filter = ['event_type', 'urgency', 'rsvp_status', 'date']
    search_fields = ['title', 'user__email']
    readonly_fields = ['id', 'created_at']


@admin.register(CommunityActivity)
class CommunityActivityAdmin(admin.ModelAdmin):
    list_display = ['user_display_name', 'action', 'activity_type', 'likes', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user_display_name', 'action']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']

