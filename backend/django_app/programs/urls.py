"""
URL configuration for Programs app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramViewSet, TrackViewSet, CohortViewSet,
    ProgramRuleViewSet, CertificateViewSet,
    MilestoneViewSet, ModuleViewSet,
    MentorshipCycleViewSet,
    DirectorProgramRuleViewSet, ProgramManagementViewSet,
    MentorAssignmentViewSet,
    director_dashboard
)
from .api_views import (
    CohortViewSet as APICohortViewSet,
    cohort_waitlist_view,
    TrackMentorAssignmentViewSet,
    ModuleViewSet as APIModuleViewSet,
    MilestoneViewSet as APIMilestoneViewSet,
    SpecializationViewSet as APISpecializationViewSet,
    CalendarTemplateViewSet as APICalendarTemplateViewSet,
    sponsor_assignments
)
from .views.calendar_views import CalendarEventViewSet
from .views.director_views import DirectorCohortViewSet
from .views.director_management_views import (
    DirectorProgramManagementViewSet,
    DirectorTrackManagementViewSet,
    DirectorCohortManagementViewSet,
    DirectorMentorManagementViewSet,
    director_mentor_analytics_view,
)
from .views.director_calendar_views import DirectorCalendarViewSet
from .views.director_lifecycle_views import DirectorCohortLifecycleViewSet
from .views.director_rules_views import DirectorProgramRulesViewSet
from .views.director_reports_views import DirectorReportsViewSet
from .views.director_advanced_analytics_views import DirectorAdvancedAnalyticsViewSet
from .views.director_certificate_views import DirectorCertificateViewSet
from .director_dashboard_views import (
    director_dashboard_summary,
    director_cohorts_list,
    director_cohort_detail
)
from .views.director_students_views import (
    director_students_list,
    director_sponsors_list,
    link_students_to_sponsor,
    unlink_students_from_sponsor,
    remove_direct_mentor_assignment,
    sponsor_linked_students
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'programs-management', ProgramManagementViewSet, basename='program-management')
router.register(r'tracks', TrackViewSet, basename='track')
router.register(r'milestones', APIMilestoneViewSet, basename='milestone')
router.register(r'modules', APIModuleViewSet, basename='module')
router.register(r'specializations', APISpecializationViewSet, basename='specialization')
router.register(r'calendar-templates', APICalendarTemplateViewSet, basename='calendar-template')
router.register(r'cohorts', APICohortViewSet, basename='cohort')
router.register(r'rules', ProgramRuleViewSet, basename='rule')
router.register(r'certificates', CertificateViewSet, basename='certificate')
router.register(r'mentor-assignments', MentorAssignmentViewSet, basename='mentor-assignment')
router.register(r'track-mentor-assignments', TrackMentorAssignmentViewSet, basename='track-mentor-assignment')
router.register(r'mentorship-cycles', MentorshipCycleViewSet, basename='mentorship-cycle')
# Calendar events (must come after cohorts to avoid URL conflicts)
router.register(r'calendar-events', CalendarEventViewSet, basename='calendar-event')

# Director-specific endpoints
director_router = DefaultRouter()
director_router.register(r'programs', DirectorProgramManagementViewSet, basename='director-program')
director_router.register(r'tracks', DirectorTrackManagementViewSet, basename='director-track')
director_router.register(r'cohorts-management', DirectorCohortManagementViewSet, basename='director-cohort-management')
director_router.register(r'cohorts', DirectorCohortViewSet, basename='director-cohort')
director_router.register(r'cohorts-lifecycle', DirectorCohortLifecycleViewSet, basename='director-cohort-lifecycle')
director_router.register(r'mentors', DirectorMentorManagementViewSet, basename='director-mentor')
director_router.register(r'calendar', DirectorCalendarViewSet, basename='director-calendar')
director_router.register(r'rules', DirectorProgramRulesViewSet, basename='director-rule')
director_router.register(r'reports', DirectorReportsViewSet, basename='director-reports')
director_router.register(r'advanced-analytics', DirectorAdvancedAnalyticsViewSet, basename='director-advanced-analytics')
director_router.register(r'certificates', DirectorCertificateViewSet, basename='director-certificates')

from programs.track_api import get_tracks_for_profiler

urlpatterns = [
    # Profiler API - tracks for GPT analysis
    path('api/v1/programs/tracks/', get_tracks_for_profiler, name='profiler-tracks'),
    
    # Legacy director dashboard endpoint (kept for backward compatibility)
    path('programs/director/dashboard/', director_dashboard, name='director-dashboard'),
    
    # New high-performance cached director dashboard endpoints
    path('director/dashboard/summary/', director_dashboard_summary, name='director-dashboard-summary'),
    path('director/dashboard/cohorts/', director_cohorts_list, name='director-cohorts-list'),
    path('director/dashboard/cohorts/<uuid:cohort_id>/', director_cohort_detail, name='director-cohort-detail'),
    
    # Director students management endpoints
    path('director/students/', director_students_list, name='director-students-list'),
    path('director/sponsors/', director_sponsors_list, name='director-sponsors-list'),
    path('director/students/link-sponsor/', link_students_to_sponsor, name='link-students-to-sponsor'),
    path('director/students/unlink-sponsor/', unlink_students_from_sponsor, name='unlink-students-from-sponsor'),
    path('director/students/remove-mentor/', remove_direct_mentor_assignment, name='remove-direct-mentor-assignment'),
    path('director/sponsors/<str:sponsor_id>/students/', sponsor_linked_students, name='sponsor-linked-students'),
    path('director/mentors/<int:mentor_id>/analytics/', director_mentor_analytics_view, name='director-mentor-analytics'),
    
    # Sponsor assignments endpoint
    path('sponsor-assignments/', sponsor_assignments, name='sponsor-assignments'),
    
    # Explicit cohort waitlist (ensures /cohorts/{uuid}/waitlist/ resolves - router may not match UUID)
    path('cohorts/<uuid:pk>/waitlist/', cohort_waitlist_view, name='cohort-waitlist'),
    
    # All other routes (includes /programs/ and /programs/{id}/ for ProgramViewSet)
    path('', include(router.urls)),
    path('director/', include(director_router.urls)),
]



