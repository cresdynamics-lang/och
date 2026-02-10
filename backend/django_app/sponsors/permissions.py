"""
Custom permissions for sponsor-related operations.

Implements ABAC-style checks: org-level segregation and scoped roles
(sponsor_admin, finance, finance_admin, analyst) via OrganizationMember and UserRole.
"""
from rest_framework.permissions import BasePermission
from django.shortcuts import get_object_or_404

from organizations.models import Organization, OrganizationMember
from users.models import UserRole
from .models import Sponsor


def _user_has_active_role(user, role_names):
    """Check if user has any of the given active roles."""
    if not user or not user.is_authenticated:
        return False
    return UserRole.objects.filter(
        user=user,
        role__name__in=role_names,
        is_active=True,
    ).exists()


def _user_sponsor_orgs(user):
    """Return queryset of sponsor-type Organizations the user is associated with."""
    if not user or not user.is_authenticated:
        return Organization.objects.none()
    member_orgs = Organization.objects.filter(
        org_type='sponsor',
        organizationmember__user=user,
    )
    scoped_org_ids = UserRole.objects.filter(
        user=user,
        is_active=True,
        org_id__isnull=False,
        role__name__in=['sponsor_admin', 'finance', 'finance_admin', 'analyst', 'admin'],
    ).values_list('org_id', flat=True).distinct()
    scoped_orgs = Organization.objects.filter(id__in=scoped_org_ids, org_type='sponsor')
    return (member_orgs | scoped_orgs).distinct()


def _user_has_sponsor_org(user):
    return _user_sponsor_orgs(user).exists()


def _user_has_sponsor_admin_scope(user, sponsor_org):
    """Check if user has admin/finance access for the given sponsor organization."""
    if not user or not user.is_authenticated or sponsor_org is None:
        return False
    if OrganizationMember.objects.filter(
        organization=sponsor_org, user=user, role='admin',
    ).exists():
        return True
    return UserRole.objects.filter(
        user=user,
        is_active=True,
        org_id=sponsor_org,
        role__name__in=['sponsor_admin', 'finance_admin', 'finance', 'admin'],
    ).exists()


class IsSponsorUser(BasePermission):
    """
    Permission for sponsor operations. Allowed when user is associated with a sponsor org
    or has scoped sponsor/finance/analyst/admin role.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            return True
        if _user_has_sponsor_org(user):
            return True
        if _user_has_active_role(user, ['sponsor_admin', 'finance', 'finance_admin', 'analyst', 'admin']):
            return True
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            return True
        sponsor = getattr(obj, 'sponsor', obj) if not isinstance(obj, Sponsor) else obj
        if sponsor is None:
            return _user_has_sponsor_org(user)
        sponsor_org = Organization.objects.filter(slug=sponsor.slug, org_type='sponsor').first()
        if sponsor_org is None:
            return _user_has_sponsor_org(user)
        return _user_sponsor_orgs(user).filter(id=sponsor_org.id).exists()


class IsSponsorAdmin(BasePermission):
    """
    Permission for sponsor admin/finance operations. Requires org admin or scoped
    sponsor_admin/finance_admin/finance/admin role.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            return True
        if UserRole.objects.filter(
            user=user,
            is_active=True,
            org_id__isnull=False,
            role__name__in=['sponsor_admin', 'finance_admin', 'finance', 'admin'],
        ).exists():
            return True
        if OrganizationMember.objects.filter(
            organization__org_type='sponsor', user=user, role='admin',
        ).exists():
            return True
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            return True
        sponsor = getattr(obj, 'sponsor', obj) if not isinstance(obj, Sponsor) else obj
        if sponsor is None:
            return False
        sponsor_org = Organization.objects.filter(slug=sponsor.slug, org_type='sponsor').first()
        if sponsor_org is None:
            return False
        return _user_has_sponsor_admin_scope(user, sponsor_org)


def check_sponsor_access(user, sponsor_slug):
    """Return Sponsor if user has access; raise PermissionError otherwise."""
    if not user or not user.is_authenticated:
        raise PermissionError("Authentication required")
    sponsor = get_object_or_404(Sponsor, slug=sponsor_slug, is_active=True)
    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return sponsor
    sponsor_org = Organization.objects.filter(slug=sponsor.slug, org_type='sponsor').first()
    if sponsor_org is None:
        raise PermissionError("Sponsor organization not found")
    if _user_sponsor_orgs(user).filter(id=sponsor_org.id).exists():
        return sponsor
    raise PermissionError("You do not have access to this sponsor")


def check_sponsor_admin_access(user, sponsor_slug):
    """Return Sponsor if user has admin/finance access; raise PermissionError otherwise."""
    if not user or not user.is_authenticated:
        raise PermissionError("Authentication required")
    sponsor = get_object_or_404(Sponsor, slug=sponsor_slug, is_active=True)
    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return sponsor
    sponsor_org = Organization.objects.filter(slug=sponsor.slug, org_type='sponsor').first()
    if sponsor_org is None:
        raise PermissionError("Sponsor organization not found")
    if _user_has_sponsor_admin_scope(user, sponsor_org):
        return sponsor
    raise PermissionError("Admin/finance privileges required for this sponsor")
