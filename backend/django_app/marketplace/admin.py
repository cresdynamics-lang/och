"""
Django admin configuration for marketplace models
"""

from django.contrib import admin
from .models import Employer, MarketplaceProfile, EmployerInterestLog, JobPosting


@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'user', 'sector', 'country', 'created_at']
    list_filter = ['sector', 'country', 'created_at']
    search_fields = ['company_name', 'user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user']


@admin.register(MarketplaceProfile)
class MarketplaceProfileAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'tier', 'profile_status', 'readiness_score', 'is_visible', 'employer_share_consent', 'last_updated_at']
    list_filter = ['tier', 'profile_status', 'is_visible', 'employer_share_consent', 'portfolio_depth']
    search_fields = ['mentee__email', 'mentee__first_name', 'mentee__last_name', 'primary_role', 'primary_track_key']
    raw_id_fields = ['mentee']
    readonly_fields = ['readiness_score', 'job_fit_score', 'hiring_timeline_days', 'last_updated_at', 'created_at']


@admin.register(EmployerInterestLog)
class EmployerInterestLogAdmin(admin.ModelAdmin):
    list_display = ['employer', 'profile', 'action', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['employer__company_name', 'profile__mentee__email']
    raw_id_fields = ['employer', 'profile']
    readonly_fields = ['created_at']


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ['title', 'employer', 'job_type', 'is_active', 'posted_at']
    list_filter = ['job_type', 'is_active', 'posted_at']
    search_fields = ['title', 'description', 'employer__company_name']
    raw_id_fields = ['employer']
    readonly_fields = ['posted_at']

