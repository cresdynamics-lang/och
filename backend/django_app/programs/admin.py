"""
Admin configuration for Programs app.
"""
from django.contrib import admin
from .models import (
    Program, Track, Specialization, Cohort, Enrollment,
    CalendarEvent, MentorAssignment, ProgramRule, Certificate, Waitlist
)
from programs.director_dashboard_models import DirectorDashboardCache, DirectorCohortDashboard


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'status', 'duration_months', 'default_price', 'created_at']
    list_filter = ['category', 'status', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ['name', 'program', 'key', 'director', 'created_at']
    list_filter = ['program', 'created_at']
    search_fields = ['name', 'key', 'description']


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ['name', 'track', 'duration_weeks', 'created_at']
    list_filter = ['track', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Cohort)
class CohortAdmin(admin.ModelAdmin):
    list_display = ['name', 'track', 'start_date', 'end_date', 'status', 'seat_cap', 'created_at']
    list_filter = ['status', 'mode', 'start_date', 'created_at']
    search_fields = ['name', 'track__name']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'cohort', 'status', 'payment_status', 'seat_type', 'joined_at']
    list_filter = ['status', 'payment_status', 'seat_type', 'enrollment_type', 'joined_at']
    search_fields = ['user__email', 'cohort__name']


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'cohort', 'type', 'start_ts', 'status', 'created_at']
    list_filter = ['type', 'status', 'start_ts', 'created_at']
    search_fields = ['title', 'description']


@admin.register(MentorAssignment)
class MentorAssignmentAdmin(admin.ModelAdmin):
    list_display = ['mentor', 'cohort', 'role', 'active', 'assigned_at']
    list_filter = ['role', 'active', 'assigned_at']
    search_fields = ['mentor__email', 'cohort__name']


@admin.register(ProgramRule)
class ProgramRuleAdmin(admin.ModelAdmin):
    list_display = ['program', 'version', 'active', 'created_at']
    list_filter = ['active', 'version', 'created_at']
    search_fields = ['program__name']


@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'cohort', 'position', 'seat_type', 'active', 'added_at']
    list_filter = ['active', 'seat_type', 'enrollment_type', 'added_at']
    search_fields = ['user__email', 'cohort__name']
    ordering = ['cohort', 'position']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'issued_at']
    list_filter = ['issued_at']
    search_fields = ['enrollment__user__email', 'enrollment__cohort__name']


@admin.register(DirectorDashboardCache)
class DirectorDashboardCacheAdmin(admin.ModelAdmin):
    list_display = ['director', 'active_programs_count', 'active_cohorts_count', 'seats_used', 'cache_updated_at']
    list_filter = ['cache_updated_at']
    search_fields = ['director__email']
    readonly_fields = ['cache_updated_at']


@admin.register(DirectorCohortDashboard)
class DirectorCohortDashboardAdmin(admin.ModelAdmin):
    list_display = ['cohort_name', 'director', 'track_name', 'seats_used', 'completion_pct', 'updated_at']
    list_filter = ['mode', 'updated_at']
    search_fields = ['cohort_name', 'track_name', 'director__email']
    readonly_fields = ['updated_at']

