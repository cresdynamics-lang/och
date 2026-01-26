"""
Admin configuration for organizations app.
"""
from django.contrib import admin
from .models import Organization, OrganizationMember


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """
    Admin interface for Organization model.
    """
    list_display = ['name', 'slug', 'owner', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    """
    Admin interface for OrganizationMember model.
    """
    list_display = ['organization', 'user', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['organization__name', 'user__email']


