"""
URL configuration for API v1 endpoints.
"""
from django.urls import path, include
from .views import health_check
from users.views.admin_views import (
    RoleViewSet,
    UserRoleAssignmentView,
    OrganizationViewSet,
    APIKeyViewSet,
)
from users.views.audit_views import AuditLogViewSet

from .views import health_check, dashboard_metrics

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('metrics/dashboard', dashboard_metrics, name='dashboard-metrics'),
    
    # Authentication endpoints (includes password reset)
    path('', include('users.urls')),
    
    # Admin/Management endpoints
    path('roles/', RoleViewSet.as_view({'get': 'list', 'post': 'create'}), name='roles-list'),
    path('users/<int:id>/roles', UserRoleAssignmentView.as_view({'post': 'create'}), name='user-role-assign'),
    path('users/<int:id>/roles/<int:role_id>', UserRoleAssignmentView.as_view({'delete': 'destroy'}), name='user-role-revoke'),
    path('orgs/', OrganizationViewSet.as_view({'get': 'list', 'post': 'create'}), name='orgs-list'),
    path('orgs/<slug:slug>/members', OrganizationViewSet.as_view({'post': 'members'}), name='orgs-members'),
    path('api-keys/', APIKeyViewSet.as_view({'post': 'create'}), name='api-keys-create'),
    path('api-keys/<int:id>', APIKeyViewSet.as_view({'delete': 'destroy'}), name='api-keys-detail'),
    
    # Audit logs (also support /audit for compatibility)
    path('audit/', AuditLogViewSet.as_view({'get': 'list'}), name='audit-list'),
    path('audit-logs/', AuditLogViewSet.as_view({'get': 'list'}), name='audit-logs-list'),
    path('audit-logs/stats/', AuditLogViewSet.as_view({'get': 'stats'}), name='audit-logs-stats'),
    
    # Other endpoints
    path('', include('organizations.urls')),
    path('', include('progress.urls')),
    
    # Student Dashboard endpoints
    path('student/', include('student_dashboard.urls')),
    path('student/dashboard/', include('dashboard.urls')),
    
    # Mentorship Coordination Engine (must come FIRST to avoid URL conflicts with programs router)
    path('', include('mentorship_coordination.urls')),
    
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
    
    # Director Dashboard (must come after programs.urls to avoid URL conflicts with director router)
    # Note: director_dashboard.urls only registers 'dashboard' routes, so it won't conflict with 'cohorts'
    path('director/', include('director_dashboard.urls')),
    
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

