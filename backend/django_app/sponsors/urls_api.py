"""
URL patterns for Sponsor/Employer APIs based on OCH SMP Technical Specifications.
Implements all required API endpoints for sponsor/employer dashboard operations.
"""
from django.urls import path, include
from . import views_api

app_name = 'sponsors_api'

# =============================================================================
# 🔑 Identity & Organization APIs (prefix /api/v1/auth)
# =============================================================================
auth_patterns = [
    path('signup/', views_api.sponsor_signup, name='sponsor-signup'),
    path('orgs/', views_api.create_sponsor_org, name='create-sponsor-org'),
    path('orgs/<uuid:org_id>/members/', views_api.add_org_members, name='add-org-members'),
    path('users/<uuid:user_id>/roles/', views_api.assign_sponsor_roles, name='assign-sponsor-roles'),
    path('me/', views_api.sponsor_profile, name='sponsor-profile'),
    path('consents/', views_api.update_consent_scopes, name='update-consent-scopes'),
]

# =============================================================================
# 📚 Program & Cohort Management APIs (prefix /api/v1/programs)
# =============================================================================
programs_patterns = [
    path('cohorts/', views_api.create_sponsored_cohort, name='create-sponsored-cohort'),
    path('cohorts/assign-sponsors/', views_api.assign_sponsors_to_cohort, name='assign-sponsors-to-cohort'),
    path('cohorts/assignments/', views_api.get_sponsor_assignments, name='get-sponsor-assignments'),
    path('cohorts/<uuid:cohort_id>/enrollments/', views_api.enroll_sponsored_students, name='enroll-sponsored-students'),
    path('cohorts/<uuid:cohort_id>/enrollments/list/', views_api.list_sponsored_students, name='list-sponsored-students'),
    path('cohorts/<uuid:cohort_id>/reports/', views_api.cohort_reports, name='cohort-reports'),
]

# =============================================================================
# 💳 Billing & Finance APIs (prefix /api/v1/billing)
# =============================================================================
billing_patterns = [
    path('catalog/', views_api.billing_catalog, name='billing-catalog'),
    path('checkout/sessions/', views_api.create_checkout_session, name='create-checkout-session'),
    path('invoices/', views_api.sponsor_invoices, name='sponsor-invoices'),
    path('entitlements/', views_api.sponsor_entitlements, name='sponsor-entitlements'),
]

# =============================================================================
# 📊 Platform Finance APIs (prefix /api/v1/finance) – internal Finance role
# =============================================================================
finance_patterns = [
    path('platform/overview/', views_api.platform_finance_overview, name='platform-finance-overview'),
]

# =============================================================================
# 📢 Notifications & Automation APIs (prefix /api/v1/notifications)
# =============================================================================
notifications_patterns = [
    path('send/', views_api.send_sponsor_message, name='send-sponsor-message'),
]

# =============================================================================
# 🔒 Consent & Privacy APIs (prefix /api/v1/privacy)
# =============================================================================
privacy_patterns = [
    path('consents/my/', views_api.sponsor_consents, name='sponsor-consents'),
    path('check/', views_api.check_student_consent, name='check-student-consent'),
]

# =============================================================================
# 📊 Analytics & Reporting APIs (prefix /api/v1/analytics)
# =============================================================================
analytics_patterns = [
    path('metrics/<str:metric_key>/', views_api.sponsor_metrics, name='sponsor-metrics'),
    path('dashboards/<str:dashboard_id>/pdf/', views_api.export_dashboard_pdf, name='export-dashboard-pdf'),
]

# =============================================================================
# Main URL patterns - these will be included in the main API URLs
# =============================================================================
urlpatterns = [
    # Identity & Organization APIs
    path('auth/', include(auth_patterns)),
    
    # Program & Cohort Management APIs  
    path('programs/', include(programs_patterns)),
    
    # Billing & Finance APIs
    path('billing/', include(billing_patterns)),
    # Platform-level Finance (internal Finance, cross-sponsor)
    path('finance/', include(finance_patterns)),
    
    # Notifications & Automation APIs
    path('notifications/', include(notifications_patterns)),
    
    # Consent & Privacy APIs
    path('privacy/', include(privacy_patterns)),
    
    # Analytics & Reporting APIs
    path('analytics/', include(analytics_patterns)),
]