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
        
        # Check if user has program_director role
        from users.models import UserRole, Role
        director_role = Role.objects.filter(name='program_director').first()
        if not director_role:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            role=director_role,
            is_active=True
        ).exists()


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

