"""
Admin configuration for Director Dashboard.
"""
from django.contrib import admin
from .models import DirectorDashboardCache, DirectorCohortHealth


@admin.register(DirectorDashboardCache)
class DirectorDashboardCacheAdmin(admin.ModelAdmin):
    list_display = ['director', 'active_programs_count', 'active_cohorts_count', 'seats_used', 'cache_updated_at']
    list_filter = ['cache_updated_at']
    search_fields = ['director__email']
    readonly_fields = ['cache_updated_at']


@admin.register(DirectorCohortHealth)
class DirectorCohortHealthAdmin(admin.ModelAdmin):
    list_display = ['cohort_name', 'director', 'seats_used_total', 'readiness_avg', 'completion_pct', 'risk_score', 'updated_at']
    list_filter = ['risk_score', 'updated_at', 'director']
    search_fields = ['cohort_name', 'director__email']
    readonly_fields = ['updated_at']

