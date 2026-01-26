"""
Admin configuration for users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import (
    Role,
    Permission,
    UserRole,
    ConsentScope,
    Entitlement,
)
from .identity_models import UserIdentity
from .auth_models import (
    MFAMethod,
    MFACode,
    SSOProvider,
    SSOConnection,
    UserSession,
    DeviceTrust,
)
from .api_models import (
    APIKey,
    WebhookEndpoint,
    WebhookDelivery,
)
from .audit_models import (
    AuditLog,
    DataExport,
    DataErasure,
)
from .policy_models import Policy

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin interface for User model.
    """
    list_display = [
        'email',
        'username',
        'first_name',
        'last_name',
        'account_status',
        'email_verified',
        'mfa_enabled',
        'is_active',
        'created_at',
    ]
    list_filter = [
        'account_status',
        'email_verified',
        'is_active',
        'is_staff',
        'mfa_enabled',
        'risk_level',
        'created_at',
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Account Status', {
            'fields': ('account_status', 'email_verified', 'email_verified_at', 'activated_at', 'deactivated_at')
        }),
        ('ABAC Attributes', {
            'fields': ('cohort_id', 'track_key', 'org_id', 'country', 'timezone')
        }),
        ('Security', {
            'fields': ('risk_level', 'mfa_enabled', 'mfa_method', 'password_changed_at', 'last_login_ip')
        }),
        ('Profile', {
            'fields': ('bio', 'avatar_url', 'phone_number')
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'is_system_role', 'created_at']
    list_filter = ['is_system_role', 'created_at']
    search_fields = ['name', 'display_name', 'description']
    filter_horizontal = ['permissions']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'resource_type', 'action', 'description']
    list_filter = ['resource_type', 'action']
    search_fields = ['name', 'description']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'cohort_id', 'track_key', 'org_id', 'is_active', 'assigned_at']
    list_filter = ['role', 'is_active', 'assigned_at']
    search_fields = ['user__email', 'cohort_id', 'track_key']


@admin.register(ConsentScope)
class ConsentScopeAdmin(admin.ModelAdmin):
    list_display = ['user', 'scope_type', 'granted', 'granted_at', 'revoked_at']
    list_filter = ['scope_type', 'granted', 'granted_at']
    search_fields = ['user__email']


@admin.register(Entitlement)
class EntitlementAdmin(admin.ModelAdmin):
    list_display = ['user', 'feature', 'granted', 'granted_at', 'expires_at']
    list_filter = ['feature', 'granted', 'granted_at']
    search_fields = ['user__email', 'feature']


@admin.register(MFAMethod)
class MFAMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'method_type', 'is_primary', 'is_verified', 'created_at']
    list_filter = ['method_type', 'is_primary', 'is_verified', 'created_at']
    search_fields = ['user__email', 'phone_number', 'email']


@admin.register(MFACode)
class MFACodeAdmin(admin.ModelAdmin):
    list_display = ['user', 'code', 'method', 'used', 'expires_at', 'created_at']
    list_filter = ['method', 'used', 'expires_at']
    search_fields = ['user__email', 'code']


@admin.register(SSOProvider)
class SSOProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider_type', 'is_active', 'created_at']
    list_filter = ['provider_type', 'is_active']
    search_fields = ['name', 'issuer', 'entity_id']


@admin.register(SSOConnection)
class SSOConnectionAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'external_id', 'external_email', 'is_active', 'linked_at']
    list_filter = ['provider', 'is_active', 'linked_at']
    search_fields = ['user__email', 'external_id', 'external_email']


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_name', 'is_trusted', 'mfa_verified', 'ip_address', 'created_at', 'expires_at']
    list_filter = ['is_trusted', 'mfa_verified', 'created_at']
    search_fields = ['user__email', 'device_fingerprint', 'device_name']


@admin.register(DeviceTrust)
class DeviceTrustAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_name', 'device_type', 'trusted_at', 'last_used_at', 'expires_at']
    list_filter = ['device_type', 'trusted_at']
    search_fields = ['user__email', 'device_name', 'device_fingerprint']


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'key_type', 'key_prefix', 'user', 'organization', 'is_active', 'created_at', 'expires_at']
    list_filter = ['key_type', 'is_active', 'created_at']
    search_fields = ['name', 'key_prefix', 'user__email', 'organization__name']
    readonly_fields = ['key_prefix', 'key_hash', 'created_at']


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'organization', 'is_active', 'created_at', 'last_triggered_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'url', 'organization__name']


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(admin.ModelAdmin):
    list_display = ['endpoint', 'event_type', 'status', 'attempt_count', 'created_at', 'delivered_at']
    list_filter = ['status', 'event_type', 'created_at']
    search_fields = ['endpoint__name', 'event_type']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['actor_identifier', 'action', 'resource_type', 'result', 'timestamp']
    list_filter = ['action', 'result', 'resource_type', 'timestamp']
    search_fields = ['actor_identifier', 'resource_type', 'resource_id', 'request_id']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(DataExport)
class DataExportAdmin(admin.ModelAdmin):
    list_display = ['user', 'export_type', 'status', 'format', 'created_at', 'completed_at', 'expires_at']
    list_filter = ['export_type', 'status', 'format', 'created_at']
    search_fields = ['user__email']


@admin.register(DataErasure)
class DataErasureAdmin(admin.ModelAdmin):
    list_display = ['user', 'erasure_type', 'status', 'records_erased', 'created_at', 'completed_at']
    list_filter = ['erasure_type', 'status', 'created_at']
    search_fields = ['user__email']


@admin.register(UserIdentity)
class UserIdentityAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'provider_sub', 'is_active', 'linked_at']
    list_filter = ['provider', 'is_active', 'linked_at']
    search_fields = ['user__email', 'provider_sub']


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'effect', 'resource', 'version', 'active', 'created_at']
    list_filter = ['effect', 'resource', 'active', 'version']
    search_fields = ['name', 'description', 'resource']
