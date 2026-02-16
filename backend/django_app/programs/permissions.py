"""
ABAC Permissions for Program Director.
"""
from rest_framework import permissions
from programs.services.director_service import DirectorService
from users.utils.policy_engine import check_permission


def _has_any_director_permission(user):
    """Return True if user has at least one director-related RBAC permission (or is staff/superuser)."""
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return True
    director_checks = [
        ('cohort', 'list'), ('cohort', 'manage'), ('track', 'list'), ('track', 'manage'),
        ('mentorship', 'list'), ('mentorship', 'create'), ('analytics', 'read'),
        ('user', 'list'), ('organization', 'list'), ('portfolio', 'list'),
    ]
    for resource_type, action in director_checks:
        if check_permission(user, resource_type, action)[0]:
            return True
    return False


class IsProgramDirector(permissions.BasePermission):
    """RBAC: requires program_director or admin role AND at least one director-related permission."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        # Must have program_director or admin role
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = %s AND r.name IN ('program_director', 'admin') AND ur.is_active = true
                LIMIT 1
            """, [request.user.id])
            if cursor.fetchone() is None:
                return False
        # RBAC: must have at least one director permission (blocks 0-permission directors)
        return _has_any_director_permission(request.user)


class IsDirectorOrAdmin(permissions.BasePermission):
    """RBAC: same as IsProgramDirector - requires role AND at least one director permission."""
    
    def has_permission(self, request, view):
        return IsProgramDirector().has_permission(request, view)


class CanManageProgram(permissions.BasePermission):
    """Permission check for program management."""
    
    def has_object_permission(self, request, view, obj):
        """Check if user can manage the program."""
        if request.user.is_staff:
            return True
        
        return DirectorService.can_manage_program(request.user, obj)


class CanManageTrack(permissions.BasePermission):
    """Permission check for track management."""
    
    def has_object_permission(self, request, view, obj):
        """Check if user can manage the track."""
        if request.user.is_staff:
            return True
        
        return DirectorService.can_manage_track(request.user, obj)


class CanManageCohort(permissions.BasePermission):
    """Permission check for cohort management."""
    
    def has_object_permission(self, request, view, obj):
        """Check if user can manage the cohort."""
        if request.user.is_staff:
            return True
        
        return DirectorService.can_manage_cohort(request.user, obj)


def _is_director_or_admin(user):
    """Return True if user is staff, superuser, or has program_director/admin role with at least one director permission."""
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = %s
              AND r.name IN ('program_director', 'admin')
              AND ur.is_active = true
            LIMIT 1
        """, [user.id])
        if cursor.fetchone() is None:
            return False
    return _has_any_director_permission(user)


class IsDirectorOrAdminOrMentorCohortsReadOnly(permissions.BasePermission):
    """Directors/admins get full access; mentors get list/retrieve only for cohorts they're assigned to."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        if _is_director_or_admin(request.user):
            return True
        from .models import MentorAssignment
        return MentorAssignment.objects.filter(
            cohort=obj,
            mentor=request.user,
            active=True
        ).exists()

