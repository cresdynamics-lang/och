"""
Custom permissions for OCH platform.
Role-based access control for different user types.
Uses RBAC (Role→Permission) + ABAC (policy_engine) when HasResourcePermission is used.
"""
from rest_framework.permissions import BasePermission
from django.core.exceptions import ObjectDoesNotExist


class HasResourcePermission(BasePermission):
    """
    Permission class that checks (resource_type, action) via the central RBAC+ABAC engine.
    Use for full RBAC: ensure roles have the right Permission and policies allow.
    """
    resource_type = None
    action = None

    def __init__(self, resource_type=None, action=None):
        self.resource_type = resource_type or getattr(self.__class__, 'resource_type', None)
        self.action = action or getattr(self.__class__, 'action', None)

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        resource_type = self.resource_type or getattr(view, 'required_resource_type', None)
        action = self.action or getattr(view, 'required_action', None)
        if not resource_type or not action:
            return False
        from users.utils.policy_engine import check_permission
        allowed, _ = check_permission(request.user, resource_type, action, context=None)
        return allowed


class CanManageRoles(BasePermission):
    """
    Allow staff or any user with RBAC permission user.manage (e.g. admin role).
    Use for role/permission management endpoints.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_staff', False):
            return True
        from users.utils.policy_engine import check_permission
        allowed, _ = check_permission(request.user, 'user', 'manage', context=None)
        return allowed


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


class IsAdmin(BasePermission):
    """
    Permission class for admin access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        user_roles = getattr(request.user, 'user_roles', None)
        if not user_roles:
            return False
        return user_roles.filter(
            role__name='admin',
            is_active=True
        ).exists()


class IsAdminOrDirector(BasePermission):
    """
    Permission class for admin or program director access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        user_roles = getattr(request.user, 'user_roles', None)
        if not user_roles:
            return False
        return user_roles.filter(
            role__name__in=['admin', 'program_director'],
            is_active=True
        ).exists()
