"""
Custom permissions for sponsor-related operations.
"""
from rest_framework.permissions import BasePermission
from django.shortcuts import get_object_or_404
from .models import Sponsor


class IsSponsorUser(BasePermission):
    """
    Permission class to check if user has access to sponsor operations.
    In production, this would check user roles and sponsor relationships.
    """

    def has_permission(self, request, view):
        # For now, allow authenticated users
        # TODO: Implement proper sponsor role checking
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # For now, allow authenticated users to access sponsor objects
        # TODO: Check if user is associated with the sponsor
        return request.user and request.user.is_authenticated


class IsSponsorAdmin(BasePermission):
    """
    Permission class for sponsor admin operations (financial operations, etc.)
    """

    def has_permission(self, request, view):
        # For now, allow authenticated users
        # TODO: Check if user has admin/finance role for the sponsor
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # For now, allow authenticated users
        # TODO: Check if user has admin privileges for the sponsor
        return request.user and request.user.is_authenticated


def check_sponsor_access(user, sponsor_slug):
    """
    Helper function to check if user has access to a sponsor.
    Returns the sponsor object if access is granted, raises PermissionError otherwise.
    """
    if not user or not user.is_authenticated:
        raise PermissionError("Authentication required")

    sponsor = get_object_or_404(Sponsor, slug=sponsor_slug, is_active=True)

    # TODO: Implement proper access control logic
    # For example:
    # - Check if user is in sponsor's team
    # - Check if user has sponsor role
    # - Check if user is sponsor admin

    return sponsor


def check_sponsor_admin_access(user, sponsor_slug):
    """
    Helper function to check if user has admin access to a sponsor.
    Used for financial operations, cohort management, etc.
    """
    if not user or not user.is_authenticated:
        raise PermissionError("Authentication required")

    sponsor = get_object_or_404(Sponsor, slug=sponsor_slug, is_active=True)

    # TODO: Implement admin access control
    # For example:
    # - Check if user has finance_admin or sponsor_admin role
    # - Check if user is sponsor owner/contact

    return sponsor
