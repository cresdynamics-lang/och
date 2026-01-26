"""
URL configuration for organizations app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, OrganizationMemberViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'organization-members', OrganizationMemberViewSet, basename='organization-member')

urlpatterns = [
    path('', include(router.urls)),
]


