"""
Admin and organization management views.
Role and permission management use CanManageRoles (RBAC user.manage or is_staff).
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from organizations.models import Organization, OrganizationMember
from organizations.serializers import OrganizationSerializer
from users.models import Role, UserRole, Permission
from users.api_models import APIKey
from users.permissions import CanManageRoles
from django.utils import timezone
from users.serializers import UserSerializer, RoleSerializer, PermissionSerializer

User = get_user_model()


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/permissions/ - List all permissions (admin / user.manage only).
    Read-only; permissions are managed via roles.
    No pagination so the admin roles UI can show all permissions at once.
    """
    queryset = Permission.objects.all().order_by('resource_type', 'action')
    permission_classes = [permissions.IsAuthenticated, CanManageRoles]
    serializer_class = PermissionSerializer
    pagination_class = None


class RoleViewSet(viewsets.ModelViewSet):
    """
    GET /api/v1/roles/ - List roles (with permissions)
    GET /api/v1/roles/<id>/ - Retrieve role with permissions
    POST /api/v1/roles/ - Create role (admin / user.manage only)
    PATCH /api/v1/roles/<id>/ - Update role and assign permissions (admin / user.manage only)
    PUT /api/v1/roles/<id>/ - Full update (admin / user.manage only)
    """
    queryset = Role.objects.all().prefetch_related('permissions')
    permission_classes = [permissions.IsAuthenticated, CanManageRoles]
    serializer_class = RoleSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if getattr(instance, 'is_system_role', True):
            return Response(
                {'detail': 'System roles cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserRoleAssignmentView(viewsets.ViewSet):
    """
    POST /api/v1/users/{id}/roles
    DELETE /api/v1/users/{id}/roles/{id}
    Assign/revoke role to user with scope.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, id=None):
        """Assign role to user."""
        # Check permissions (only admin or program_director can assign roles)
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            is_director = UserRole.objects.filter(
                user=request.user,
                role=director_role,
                is_active=True
            ).exists() if director_role else False
            
            if not is_director:
                return Response(
                    {'detail': 'Only administrators and program directors can assign roles'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        role_id = request.data.get('role_id')
        scope = request.data.get('scope', 'global')
        scope_ref = request.data.get('scope_ref')
        
        if not role_id:
            return Response(
                {'detail': 'role_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            role = Role.objects.get(id=role_id)
        except Role.DoesNotExist:
            return Response(
                {'detail': 'Role not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if role assignment already exists (check all unique_together combinations)
        existing_user_role = UserRole.objects.filter(
            user=user,
            role=role,
            scope=scope,
            scope_ref=scope_ref,
            is_active=True
        ).first()
        
        # Also check legacy unique_together fields
        if not existing_user_role and scope == 'global':
            existing_user_role = UserRole.objects.filter(
                user=user,
                role=role,
                cohort_id__isnull=True,
                track_key__isnull=True,
                org_id__isnull=True,
                is_active=True
            ).first()
        
        if existing_user_role:
            return Response({
                'detail': 'Role already assigned to this user',
                'user_role': {
                    'id': existing_user_role.id,
                    'role': role.name,
                    'scope': existing_user_role.scope,
                    'scope_ref': str(existing_user_role.scope_ref) if existing_user_role.scope_ref else None,
                }
            }, status=status.HTTP_200_OK)
        
        # Create new role assignment
        try:
            user_role = UserRole.objects.create(
                user=user,
                role=role,
                scope=scope,
                scope_ref=scope_ref,
                assigned_by=request.user,
            )
        except Exception as e:
            # Handle unique constraint violations gracefully
            error_msg = str(e)
            if 'unique' in error_msg.lower() or 'duplicate' in error_msg.lower():
                return Response(
                    {'detail': 'This role is already assigned to the user with the same scope'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'detail': f'Failed to assign role: {error_msg}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'detail': 'Role assigned successfully',
            'user_role': {
                'id': user_role.id,
                'role': role.name,
                'scope': scope,
                'scope_ref': str(scope_ref) if scope_ref else None,
            }
        }, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, id=None, role_id=None):
        """Revoke role from user."""
        # Check permissions (only admin or program_director can revoke roles)
        if not request.user.is_staff:
            director_role = Role.objects.filter(name='program_director').first()
            is_director = UserRole.objects.filter(
                user=request.user,
                role=director_role,
                is_active=True
            ).exists() if director_role else False
            
            if not is_director:
                return Response(
                    {'detail': 'Only administrators and program directors can revoke roles'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # role_id is the user_role id, id is the user id
        try:
            user_role = UserRole.objects.get(id=role_id, user_id=id)
        except UserRole.DoesNotExist:
            return Response(
                {'detail': 'User role assignment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_role.is_active = False
        user_role.save()
        
        return Response(
            {'detail': 'Role revoked successfully'},
            status=status.HTTP_200_OK
        )


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    POST /api/v1/orgs
    Organization management.
    Supports both ID and slug lookups.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_object(self):
        """
        Override to support both ID and slug lookups.
        If pk is numeric, use ID lookup; otherwise use slug lookup.
        """
        # Check if we have 'pk' in kwargs (ID-based lookup)
        if 'pk' in self.kwargs:
            lookup_value = self.kwargs['pk']
            try:
                # Try to parse as integer
                org_id = int(lookup_value)
                # Use ID lookup - check both filtered queryset and all orgs for better error message
                queryset = self.get_queryset()
                obj = queryset.filter(id=org_id).first()
                
                # If not found in filtered queryset, check if org exists at all (for better error message)
                if not obj:
                    org_exists = Organization.objects.filter(id=org_id).exists()
                    if org_exists:
                        # Org exists but user doesn't have permission
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied('You do not have permission to access this organization')
                    else:
                        # Org doesn't exist
                        from rest_framework.exceptions import NotFound
                        raise NotFound('Organization not found')
                
                self.check_object_permissions(self.request, obj)
                return obj
            except (ValueError, TypeError):
                # Not numeric, treat as slug
                pass
        
        # Check if we have 'slug' in kwargs (slug-based lookup)
        if 'slug' in self.kwargs:
            # Temporarily set lookup_field to slug for super().get_object()
            original_lookup_field = self.lookup_field
            self.lookup_field = 'slug'
            try:
                return super().get_object()
            finally:
                self.lookup_field = original_lookup_field
        
        # If neither pk nor slug, raise error
        from rest_framework.exceptions import NotFound
        raise NotFound('Organization not found')
    
    def get_queryset(self):
        """Filter organizations by user membership or role."""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Organization.objects.all()
        
        # Check if user is admin or program director
        user_roles = getattr(user, 'user_roles', None)
        if user_roles:
            has_admin_or_director_role = user_roles.filter(
                role__name__in=['admin', 'program_director'],
                is_active=True
            ).exists()
            if has_admin_or_director_role:
                return Organization.objects.all()
        
        # Otherwise, only return organizations where user is a member
        return Organization.objects.filter(members=user).distinct()
    
    def perform_create(self, serializer):
        """Set owner when creating organization."""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def members(self, request, slug=None):
        """Add member to organization."""
        org = self.get_object()
        user_id = request.data.get('user_id')
        role_id = request.data.get('role_id')
        
        try:
            user = User.objects.get(id=user_id)
            role = Role.objects.get(id=role_id)
        except (User.DoesNotExist, Role.DoesNotExist):
            return Response(
                {'detail': 'User or role not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        org_member, created = OrganizationMember.objects.get_or_create(
            organization=org,
            user=user,
            defaults={'role': 'member'}
        )
        
        # Also assign role in UserRole
        UserRole.objects.create(
            user=user,
            role=role,
            scope='org',
            scope_ref=org.id,
            assigned_by=request.user,
        )
        
        return Response({
            'detail': 'Member added successfully',
        }, status=status.HTTP_201_CREATED)


class APIKeyViewSet(viewsets.ModelViewSet):
    """
    POST /api/v1/api-keys
    API key management.
    """
    queryset = APIKey.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter API keys by owner."""
        user = self.request.user
        if user.is_staff:
            return APIKey.objects.all()
        return APIKey.objects.filter(user=user)
    
    def create(self, request):
        """Create API key."""
        from users.api_models import APIKey
        
        name = request.data.get('name')
        key_type = request.data.get('key_type', 'service')
        scopes = request.data.get('scopes', [])
        
        # Generate key
        key_value, key_prefix, key_hash = APIKey.generate_key()
        
        api_key = APIKey.objects.create(
            name=name,
            key_type=key_type,
            key_prefix=key_prefix,
            key_hash=key_hash,
            key_value=key_value,  # Only shown once
            user=request.user,
            scopes=scopes,
        )
        
        return Response({
            'id': api_key.id,
            'name': api_key.name,
            'key_prefix': key_prefix,
            'key': key_value,  # Show only once
            'detail': 'Store this key securely. It will not be shown again.',
        }, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, id=None):
        """Revoke API key."""
        try:
            api_key = APIKey.objects.get(id=id)
        except APIKey.DoesNotExist:
            return Response(
                {'detail': 'API key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not request.user.is_staff and api_key.user != request.user:
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        api_key.revoked_at = timezone.now()
        api_key.is_active = False
        api_key.save()
        
        return Response(
            {'detail': 'API key revoked successfully'},
            status=status.HTTP_200_OK
        )

