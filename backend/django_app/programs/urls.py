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
    # MentorAssignmentViewSet,  # Temporarily disabled due to syntax errors
    director_dashboard
)
from .views.calendar_views import CalendarEventViewSet
from .views.director_views import DirectorCohortViewSet
from .director_dashboard_views import (
    director_dashboard_summary,
    director_cohorts_list,
    director_cohort_detail
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'programs-management', ProgramManagementViewSet, basename='program-management')
router.register(r'tracks', TrackViewSet, basename='track')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'cohorts', CohortViewSet, basename='cohort')
router.register(r'rules', ProgramRuleViewSet, basename='rule')
router.register(r'certificates', CertificateViewSet, basename='certificate')
# router.register(r'mentor-assignments', MentorAssignmentViewSet, basename='mentor-assignment')  # Temporarily disabled due to syntax errors
router.register(r'mentorship-cycles', MentorshipCycleViewSet, basename='mentorship-cycle')
# Calendar events (must come after cohorts to avoid URL conflicts)
router.register(r'calendar-events', CalendarEventViewSet, basename='calendar-event')

# Director-specific endpoints
# Note: Director ViewSets are currently handled via director_dashboard_views.py
# If ViewSets are needed, they should be created in director_views.py
director_router = DefaultRouter()
# director_router.register(r'programs', DirectorProgramViewSet, basename='director-program')
# director_router.register(r'tracks', DirectorTrackViewSet, basename='director-track')
director_router.register(r'cohorts', DirectorCohortViewSet, basename='director-cohort')
# director_router.register(r'mentors', DirectorMentorViewSet, basename='director-mentor')
director_router.register(r'rules', DirectorProgramRuleViewSet, basename='director-rule')
# director_router.register(r'dashboard', DirectorDashboardViewSet, basename='director-dashboard')

urlpatterns = [
    # Legacy director dashboard endpoint (kept for backward compatibility)
    path('programs/director/dashboard/', director_dashboard, name='director-dashboard'),
    
    # New high-performance cached director dashboard endpoints
    path('director/dashboard/summary/', director_dashboard_summary, name='director-dashboard-summary'),
    path('director/dashboard/cohorts/', director_cohorts_list, name='director-cohorts-list'),
    path('director/dashboard/cohorts/<uuid:cohort_id>/', director_cohort_detail, name='director-cohort-detail'),
    
    # Tracks under programs path: /api/v1/programs/tracks/
    # Must use a specific path pattern to avoid conflicting with /programs/{id}/
    path('programs/tracks/', TrackViewSet.as_view({'get': 'list', 'post': 'create'}), name='program-tracks-list'),
    path('programs/tracks/<uuid:pk>/', TrackViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='program-track-detail'),
    
    # All other routes (includes /programs/ and /programs/{id}/ for ProgramViewSet)
    path('', include(router.urls)),
    path('director/', include(director_router.urls)),
]



