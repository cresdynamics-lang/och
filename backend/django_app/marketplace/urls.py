from django.urls import path

from .views import (
    MarketplaceTalentListView,
    MarketplaceProfileMeView,
    EmployerInterestLogView,
    EmployerInterestListView,
    StudentContactRequestsView,
    JobPostingListCreateView,
    JobPostingRetrieveUpdateDestroyView,
)
from .student_job_views import (
    StudentJobBrowseView,
    StudentJobDetailView,
    StudentJobApplicationView,
    StudentJobApplicationsView,
    StudentJobApplicationDetailView,
)
from .employer_application_views import (
    EmployerJobApplicationsView,
    EmployerAllApplicationsView,
    EmployerApplicationDetailView,
    EmployerApplicationStatusUpdateView,
)
from .admin_views import (
    AdminEmployerViewSet,
    AdminMarketplaceProfileViewSet,
    AdminJobPostingViewSet,
    AdminInterestLogViewSet,
    AdminMarketplaceAnalyticsView,
    AdminMarketplaceSettingsView,
)


urlpatterns = [
    # Employer talent browsing
    path(
        'marketplace/talent',
        MarketplaceTalentListView.as_view(),
        name='marketplace-talent-list',
    ),
    # Mentee self-view of marketplace profile
    path(
        'marketplace/profile/me',
        MarketplaceProfileMeView.as_view(),
        name='marketplace-profile-me',
    ),
    # Employer interest logging
    path(
        'marketplace/interest',
        EmployerInterestLogView.as_view(),
        name='marketplace-interest',
    ),
    # Employer interest list (favorites, shortlists, contacts)
    path(
        'marketplace/interest/list',
        EmployerInterestListView.as_view(),
        name='marketplace-interest-list',
    ),
    # Student contact requests
    path(
        'marketplace/contacts',
        StudentContactRequestsView.as_view(),
        name='marketplace-contacts',
    ),
    # Employer job postings
    path(
        'marketplace/jobs',
        JobPostingListCreateView.as_view(),
        name='marketplace-jobs',
    ),
    path(
        'marketplace/jobs/<uuid:id>',
        JobPostingRetrieveUpdateDestroyView.as_view(),
        name='marketplace-jobs-detail',
    ),
    # Student job browsing
    path(
        'marketplace/jobs/browse',
        StudentJobBrowseView.as_view(),
        name='student-job-browse',
    ),
    path(
        'marketplace/jobs/<uuid:id>/detail',
        StudentJobDetailView.as_view(),
        name='student-job-detail',
    ),
    path(
        'marketplace/jobs/<uuid:id>/apply',
        StudentJobApplicationView.as_view(),
        name='student-job-apply',
    ),
    # Student applications
    path(
        'marketplace/applications',
        StudentJobApplicationsView.as_view(),
        name='student-applications',
    ),
    path(
        'marketplace/applications/<uuid:id>',
        StudentJobApplicationDetailView.as_view(),
        name='student-application-detail',
    ),
    # Employer application management
    path(
        'marketplace/jobs/<uuid:job_id>/applications',
        EmployerJobApplicationsView.as_view(),
        name='employer-job-applications',
    ),
    path(
        'marketplace/applications/employer',
        EmployerAllApplicationsView.as_view(),
        name='employer-all-applications',
    ),
    path(
        'marketplace/applications/<uuid:id>/employer',
        EmployerApplicationDetailView.as_view(),
        name='employer-application-detail',
    ),
    path(
        'marketplace/applications/<uuid:id>/status',
        EmployerApplicationStatusUpdateView.as_view(),
        name='employer-application-status',
    ),
    # Admin marketplace management endpoints
    path(
        'admin/marketplace/employers/',
        AdminEmployerViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='admin-employers-list',
    ),
    path(
        'admin/marketplace/employers/<uuid:pk>/',
        AdminEmployerViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='admin-employers-detail',
    ),
    path(
        'admin/marketplace/employers/<uuid:pk>/suspend/',
        AdminEmployerViewSet.as_view({'post': 'suspend'}),
        name='admin-employers-suspend',
    ),
    path(
        'admin/marketplace/employers/<uuid:pk>/unsuspend/',
        AdminEmployerViewSet.as_view({'post': 'unsuspend'}),
        name='admin-employers-unsuspend',
    ),
    path(
        'admin/marketplace/employers/<uuid:pk>/assign-admin/',
        AdminEmployerViewSet.as_view({'post': 'assign_admin'}),
        name='admin-employers-assign-admin',
    ),
    path(
        'admin/marketplace/profiles/',
        AdminMarketplaceProfileViewSet.as_view({'get': 'list'}),
        name='admin-profiles-list',
    ),
    path(
        'admin/marketplace/profiles/<uuid:pk>/',
        AdminMarketplaceProfileViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update'}),
        name='admin-profiles-detail',
    ),
    path(
        'admin/marketplace/jobs/',
        AdminJobPostingViewSet.as_view({'get': 'list'}),
        name='admin-jobs-list',
    ),
    path(
        'admin/marketplace/jobs/<uuid:pk>/',
        AdminJobPostingViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='admin-jobs-detail',
    ),
    path(
        'admin/marketplace/jobs/<uuid:pk>/approve/',
        AdminJobPostingViewSet.as_view({'post': 'approve'}),
        name='admin-jobs-approve',
    ),
    path(
        'admin/marketplace/jobs/<uuid:pk>/reject/',
        AdminJobPostingViewSet.as_view({'post': 'reject'}),
        name='admin-jobs-reject',
    ),
    path(
        'admin/marketplace/interest-logs/',
        AdminInterestLogViewSet.as_view({'get': 'list'}),
        name='admin-interest-logs-list',
    ),
    path(
        'admin/marketplace/interest-logs/<uuid:pk>/',
        AdminInterestLogViewSet.as_view({'get': 'retrieve'}),
        name='admin-interest-logs-detail',
    ),
    path(
        'admin/marketplace/interest-logs/stats/',
        AdminInterestLogViewSet.as_view({'get': 'stats'}),
        name='admin-interest-logs-stats',
    ),
    path(
        'admin/marketplace/analytics/',
        AdminMarketplaceAnalyticsView.as_view(),
        name='admin-marketplace-analytics',
    ),
    path(
        'admin/marketplace/settings/',
        AdminMarketplaceSettingsView.as_view(),
        name='admin-marketplace-settings',
    ),
]


