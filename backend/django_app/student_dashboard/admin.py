"""
Admin interface for Student Dashboard models.
"""
from django.contrib import admin
from .models import StudentDashboardCache, DashboardUpdateQueue


@admin.register(StudentDashboardCache)
class StudentDashboardCacheAdmin(admin.ModelAdmin):
    """Admin for dashboard cache."""
    list_display = ['user', 'readiness_score', 'missions_in_review', 'updated_at', 'last_active_at']
    list_filter = ['updated_at', 'profile_incomplete', 'payment_overdue']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['updated_at', 'last_active_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Readiness', {
            'fields': ('readiness_score', 'time_to_ready_days', 'skill_heatmap', 'top_3_gaps')
        }),
        ('Coaching', {
            'fields': ('habit_streak_current', 'habit_completion_week', 'goals_active_count', 'goals_completed_week')
        }),
        ('Missions', {
            'fields': ('missions_in_progress', 'missions_in_review', 'missions_completed_total', 'next_mission_recommended')
        }),
        ('Portfolio', {
            'fields': ('portfolio_health_score', 'portfolio_items_total', 'portfolio_items_approved', 'public_profile_enabled', 'public_profile_slug')
        }),
        ('Cohort', {
            'fields': ('cohort_id', 'cohort_name', 'mentor_name', 'next_cohort_event', 'cohort_completion_pct')
        }),
        ('Community', {
            'fields': ('leaderboard_rank_global', 'leaderboard_rank_cohort')
        }),
        ('Notifications', {
            'fields': ('notifications_unread', 'notifications_urgent')
        }),
        ('Curriculum', {
            'fields': ('curriculum_progress_pct', 'next_module_title')
        }),
        ('AI Coach', {
            'fields': ('ai_coach_nudge', 'ai_action_plan')
        }),
        ('Subscription', {
            'fields': ('days_to_renewal', 'can_upgrade_to_premium')
        }),
        ('Flags', {
            'fields': ('needs_mentor_feedback', 'payment_overdue', 'profile_incomplete')
        }),
        ('Metadata', {
            'fields': ('updated_at', 'last_active_at')
        }),
    )


@admin.register(DashboardUpdateQueue)
class DashboardUpdateQueueAdmin(admin.ModelAdmin):
    """Admin for update queue."""
    list_display = ['user', 'reason', 'priority', 'queued_at', 'processed_at']
    list_filter = ['priority', 'processed_at', 'queued_at']
    search_fields = ['user__email', 'reason']
    readonly_fields = ['queued_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
