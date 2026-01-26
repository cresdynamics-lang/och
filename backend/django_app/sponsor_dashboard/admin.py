"""
Admin configuration for sponsor dashboard.
"""
from django.contrib import admin
from .models import (
    SponsorDashboardCache,
    SponsorCohortDashboard,
    SponsorStudentAggregates,
    SponsorCode
)


@admin.register(SponsorDashboardCache)
class SponsorDashboardCacheAdmin(admin.ModelAdmin):
    list_display = ['org', 'seats_total', 'seats_used', 'budget_used_pct', 'cache_updated_at']
    list_filter = ['cache_updated_at']
    search_fields = ['org__name']
    readonly_fields = ['cache_updated_at']


@admin.register(SponsorCohortDashboard)
class SponsorCohortDashboardAdmin(admin.ModelAdmin):
    list_display = ['org', 'cohort_name', 'seats_used', 'completion_pct', 'updated_at']
    list_filter = ['org', 'updated_at']
    search_fields = ['cohort_name', 'org__name']
    readonly_fields = ['updated_at']


@admin.register(SponsorStudentAggregates)
class SponsorStudentAggregatesAdmin(admin.ModelAdmin):
    list_display = ['org', 'name_anonymized', 'readiness_score', 'consent_employer_share', 'updated_at']
    list_filter = ['org', 'consent_employer_share', 'updated_at']
    search_fields = ['name_anonymized', 'org__name']
    readonly_fields = ['updated_at']


@admin.register(SponsorCode)
class SponsorCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'org', 'seats', 'usage_count', 'status', 'is_valid', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['code', 'org__name']
    readonly_fields = ['created_at', 'updated_at']
