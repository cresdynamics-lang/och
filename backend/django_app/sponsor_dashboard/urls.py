"""
URL configuration for sponsor dashboard.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SponsorDashboardViewSet

router = DefaultRouter()
router.register(r'dashboard', SponsorDashboardViewSet, basename='sponsor-dashboard')

urlpatterns = [
    path('', include(router.urls)),
    # Additional action endpoints (matching spec)
    path('seats/assign', SponsorDashboardViewSet.as_view({'post': 'seats_assign'}), name='sponsor-seats-assign'),
    path('codes/generate', SponsorDashboardViewSet.as_view({'post': 'codes_generate'}), name='sponsor-codes-generate'),
    path('codes', SponsorDashboardViewSet.as_view({'get': 'codes'}), name='sponsor-codes-list'),
    path('invoices', SponsorDashboardViewSet.as_view({'get': 'invoices'}), name='sponsor-invoices'),
    path('reports/export', SponsorDashboardViewSet.as_view({'post': 'reports_export'}), name='sponsor-reports-export'),
]

