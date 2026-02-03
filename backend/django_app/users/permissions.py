"""
Custom permissions for OCH platform.
Role-based access control for different user types.
"""
from rest_framework.permissions import BasePermission
from django.core.exceptions import ObjectDoesNotExist


class IsMentor(BasePermission):
    """
    Permission class for mentor-only access.
    Ensures user has mentor role and mentor profile exists.
    """

    def has_permission(self, request, view):
        """Check if user is authenticated and has mentor role."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has mentor role
        user_roles = getattr(request.user, 'user_roles', None)
        if not user_roles:
            return False

        has_mentor_role = user_roles.filter(
            role__name='mentor',
            is_active=True
        ).exists()

        if not has_mentor_role:
            return False

        # Check if user has a mentor profile
        try:
            mentor_profile = request.user.mentor_profile
            return mentor_profile is not None
        except ObjectDoesNotExist:
            return False


class IsProgramDirector(BasePermission):
    """
    Permission class for program director access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_roles = getattr(request.user, 'user_roles', None)
        if not user_roles:
            return False

        return user_roles.filter(
            role__name='program_director',
            is_active=True
        ).exists()


class IsSponsorAdmin(BasePermission):
    """
    Permission class for sponsor admin access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_roles = getattr(request.user, 'user_roles', None)
        if not user_roles:
            return False

        return user_roles.filter(
            role__name='sponsor_admin',
            is_active=True
        ).exists()


class IsFinance(BasePermission):
    """
    Permission class for finance access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_roles = getattr(request.user, 'user_roles', None)
        if not user_roles:
            return False

        return user_roles.filter(
            role__name__in=['finance', 'finance_admin'],
            is_active=True
        ).exists()


class IsAnalyst(BasePermission):
    """
    Permission class for analyst access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_roles = getattr(request.user, 'user_roles', None)
        if not user_roles:
            return False

        return user_roles.filter(
            role__name='analyst',
            is_active=True
        ).exists()
