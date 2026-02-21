"""
URL configuration for API v1 endpoints.
"""
from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from .views import health_check
from users.views.user_views import UserViewSet
from users.views.admin_views import (
    RoleViewSet,
    PermissionViewSet,
    UserRoleAssignmentView,
    OrganizationViewSet,
    APIKeyViewSet,
)
from users.views.audit_views import AuditLogViewSet
from users.views.student_admin_views import (
    SendOnboardingEmailView,
    TrackOnboardingEmailView,
)
from users.views.student_progress_report_views import (
    StudentProgressReportView,
)

from .views import health_check, dashboard_metrics
from programs.views.director_management_views import director_mentor_analytics_view
from programs.views.public_registration_views import list_public_applications

# Register UserViewSet in a router for /api/v1/users endpoint
# Support both with and without trailing slashes
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('metrics/dashboard', dashboard_metrics, name='dashboard-metrics'),
    
    # User management endpoints (from router) - MUST BE FIRST
    path('', include(router.urls)),
    # Director public applications - explicit route to avoid 404
    path('director/public-applications/', list_public_applications, name='director-public-applications'),
    # Director mentor analytics - must come before generic '' includes to avoid 404
    path('director/mentors/<int:mentor_id>/analytics/', director_mentor_analytics_view, name='director-mentor-analytics'),
    
    # Authentication endpoints (includes password reset)
    path('', include('users.urls')),
    
    # Admin/Management endpoints (RBAC: roles and permissions)
    # Use re_path to accept both with and without trailing slash (APPEND_SLASH=False)
    re_path(r'^permissions/?$', PermissionViewSet.as_view({'get': 'list'}), name='permissions-list'),
    re_path(r'^roles/?$', RoleViewSet.as_view({'get': 'list', 'post': 'create'}), name='roles-list'),
    path('roles/<int:pk>', RoleViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    }), name='roles-detail'),
    path('users/<int:id>/roles', UserRoleAssignmentView.as_view({'post': 'create'}), name='user-role-assign'),
    path('users/<int:id>/roles/<int:role_id>', UserRoleAssignmentView.as_view({'delete': 'destroy'}), name='user-role-revoke'),
    path('orgs/', OrganizationViewSet.as_view({'get': 'list', 'post': 'create'}), name='orgs-list'),
    path('orgs/<int:pk>/', OrganizationViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'}), name='orgs-detail-id'),
    path('orgs/<slug:slug>/', OrganizationViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'}), name='orgs-detail-slug'),
    path('orgs/<slug:slug>/members', OrganizationViewSet.as_view({'post': 'members'}), name='orgs-members'),
    path('api-keys/', APIKeyViewSet.as_view({'post': 'create'}), name='api-keys-create'),
    path('api-keys/<int:id>', APIKeyViewSet.as_view({'delete': 'destroy'}), name='api-keys-detail'),
    
    # Audit logs (also support /audit for compatibility)
    path('audit/', AuditLogViewSet.as_view({'get': 'list'}), name='audit-list'),
    path('audit-logs/', AuditLogViewSet.as_view({'get': 'list'}), name='audit-logs-list'),
    path('audit-logs/stats/', AuditLogViewSet.as_view({'get': 'stats'}), name='audit-logs-stats'),
    
    # Student admin endpoints
    path('admin/students/send-onboarding-email/', SendOnboardingEmailView.as_view(), name='send-onboarding-email'),
    path('admin/students/send-onboarding-email', SendOnboardingEmailView.as_view(), name='send-onboarding-email-no-slash'),
    path('admin/students/<int:user_id>/progress-report/', StudentProgressReportView.as_view(), name='student-progress-report'),
    path('admin/students/<int:user_id>/progress-report', StudentProgressReportView.as_view(), name='student-progress-report-no-slash'),
    
    # Other endpoints
    path('', include('organizations.urls')),
    path('', include('progress.urls')),
    
    # Student Dashboard endpoints
    path('student/', include('student_dashboard.urls')),
    path('student/dashboard/', include('dashboard.urls')),
    
    # Mentorship Coordination Engine (must come FIRST to avoid URL conflicts with programs router)
    path('', include('mentorship_coordination.urls')),

    # Mentor Dashboard (must come before mentorship to avoid URL conflicts)
    path('mentors/', include('mentors.urls')),

    # Mentorship endpoints
    path('', include('mentorship.urls')),
    
    # Programs & Cohorts (must come after mentorship_coordination to avoid conflicts)
    path('', include('programs.urls')),
    
    # Student Journey Modules
    path('', include('profiler.urls')),
    path('foundations/', include('foundations.urls')),
    path('coaching/', include('coaching.urls')),
    path('', include('missions.urls')),
    path('', include('subscriptions.urls')),
    
    # Sponsor Dashboard
    path('sponsor/', include('sponsor_dashboard.urls')),

    # Sponsors Management
    path('sponsors/', include('sponsors.urls')),
    
    # Email tracking endpoint (public, no auth required)
    path('track-onboarding-email/', TrackOnboardingEmailView.as_view(), name='track-onboarding-email'),
    path('track-onboarding-email', TrackOnboardingEmailView.as_view(), name='track-onboarding-email-no-slash'),
    
    # Sponsor/Employer APIs (OCH SMP Technical Specifications)
    path('', include('sponsors.urls_api')),
    
    # Director Dashboard (must come after programs.urls to avoid URL conflicts with director router)
    # Note: director_dashboard.urls only registers 'dashboard' routes, so it won't conflict with 'cohorts'
    path('director/', include('director_dashboard.urls')),
    
    # Support (tickets & problem codes)
    path('support/', include('support.urls')),

    # TalentScope Analytics
    path('talentscope/', include('talentscope.urls')),
    
    # Career / Marketplace module
    path('', include('marketplace.urls')),
    
    # Community Module
    path('community/', include('community.urls')),
    
    # Curriculum Engine
    path('curriculum/', include('curriculum.urls')),
    
    # Recipe Engine
    path('', include('recipes.urls')),
]

