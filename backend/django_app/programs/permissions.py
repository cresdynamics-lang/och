"""
ABAC Permissions for Program Director.
"""
from rest_framework import permissions
from programs.services.director_service import DirectorService


class IsProgramDirector(permissions.BasePermission):
    """Permission check for Program Director role."""
    
    def has_permission(self, request, view):
        """Check if user has program_director role."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Use raw SQL to avoid UUID/bigint issues
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = %s AND r.name = 'program_director' AND ur.is_active = true
                LIMIT 1
            """, [request.user.id])
            
            return cursor.fetchone() is not None


class IsDirectorOrAdmin(permissions.BasePermission):
    """Permission check for Program Director or Admin role."""
    
    def has_permission(self, request, view):
        """Check if user has program_director or admin role."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Use raw SQL to avoid UUID/bigint issues
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = %s AND r.name = 'program_director' AND ur.is_active = true
                LIMIT 1
            """, [request.user.id])
            
            return cursor.fetchone() is not None


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

