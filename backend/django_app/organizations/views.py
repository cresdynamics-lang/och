"""
Organization views for DRF.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from users.models import User, UserRole, Role
from .models import Organization, OrganizationMember
from .serializers import OrganizationSerializer, OrganizationMemberSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Organization model.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """
        Filter organizations by user membership.
        """
        user = self.request.user
        return Organization.objects.filter(
            members=user
        ).distinct()
    
    def perform_create(self, serializer):
        """
        Set the owner when creating an organization.
        """
        serializer.save(owner=self.request.user)


class OrganizationMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for OrganizationMember model.
    Supports member invitation and role assignment for sponsors.
    """
    queryset = OrganizationMember.objects.all()
    serializer_class = OrganizationMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter members by organization."""
        org_slug = self.request.query_params.get('org_slug')
        if org_slug:
            return OrganizationMember.objects.filter(organization__slug=org_slug)
        return OrganizationMember.objects.filter(
            organization__members=self.request.user
        )
    
    @action(detail=False, methods=['post'])
    def invite(self, request):
        """
        POST /api/v1/orgs/members/invite
        Invite a member to the organization and assign a role.
        """
        email = request.data.get('email')
        org_slug = request.data.get('org_slug')
        org_role = request.data.get('org_role', 'member')  # OrganizationMember role
        system_role_name = request.data.get('system_role')  # Optional system role to assign
        
        if not email or not org_slug:
            return Response(
                {'detail': 'email and org_slug are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get organization
        try:
            org = Organization.objects.get(slug=org_slug)
        except Organization.DoesNotExist:
            return Response(
                {'detail': 'Organization not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has permission (must be org admin or owner)
        user = request.user
        is_owner = org.owner == user
        is_admin = OrganizationMember.objects.filter(
            organization=org,
            user=user,
            role='admin'
        ).exists()
        
        if not (is_owner or is_admin):
            return Response(
                {'detail': 'You do not have permission to invite members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create user by email
        try:
            invited_user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create user with pending status
            invited_user = User.objects.create_user(
                username=email,
                email=email,
                account_status='pending_verification',
            )
        
        # Add member to organization
        member, created = OrganizationMember.objects.get_or_create(
            organization=org,
            user=invited_user,
            defaults={'role': org_role}
        )
        
        if not created:
            member.role = org_role
            member.save()
        
        # Assign system role if specified
        if system_role_name:
            try:
                system_role = Role.objects.get(name=system_role_name)
                UserRole.objects.get_or_create(
                    user=invited_user,
                    role=system_role,
                    scope='org',
                    scope_ref=org.id,
                    org_id=org,
                    assigned_by=user,
                    defaults={'is_active': True}
                )
            except Role.DoesNotExist:
                pass
        
        # Send invitation email
        if created:
            try:
                invite_url = f"{settings.FRONTEND_URL or 'http://localhost:3000'}/accept-invite?token={member.id}"
                send_mail(
                    subject=f'Invitation to join {org.name}',
                    message=f'You have been invited to join {org.name}. Click here to accept: {invite_url}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=True,
                )
            except Exception:
                pass  # Don't fail if email fails
        
        serializer = OrganizationMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """
        POST /api/v1/orgs/members/{id}/assign_role
        Assign a role to an organization member.
        """
        member = self.get_object()
        org = member.organization
        system_role_name = request.data.get('system_role')
        
        # Check permission
        user = request.user
        is_owner = org.owner == user
        is_admin = OrganizationMember.objects.filter(
            organization=org,
            user=user,
            role='admin'
        ).exists()
        
        if not (is_owner or is_admin):
            return Response(
                {'detail': 'You do not have permission to assign roles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not system_role_name:
            return Response(
                {'detail': 'system_role is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            system_role = Role.objects.get(name=system_role_name)
        except Role.DoesNotExist:
            return Response(
                {'detail': f'Role "{system_role_name}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Assign role scoped to organization
        user_role, created = UserRole.objects.get_or_create(
            user=member.user,
            role=system_role,
            scope='org',
            scope_ref=org.id,
            org_id=org,
            assigned_by=user,
            defaults={'is_active': True}
        )
        
        if not created:
            user_role.is_active = True
            user_role.assigned_by = user
            user_role.save()
        
        return Response({
            'detail': f'Role "{system_role.display_name}" assigned successfully',
            'user_role_id': str(user_role.id),
        }, status=status.HTTP_200_OK)


