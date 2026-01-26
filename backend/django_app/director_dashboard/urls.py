"""
URL configuration for Director Dashboard app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DirectorDashboardViewSet

router = DefaultRouter()
router.register(r'dashboard', DirectorDashboardViewSet, basename='director-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

