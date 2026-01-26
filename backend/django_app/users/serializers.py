"""
User serializers for DRF - Updated for comprehensive auth system.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Role, UserRole, ConsentScope, Entitlement
from .identity_models import UserIdentity
from .auth_models import MFAMethod, UserSession
from .audit_models import AuditLog

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    roles = serializers.SerializerMethodField()
    consent_scopes = serializers.SerializerMethodField()
    entitlements = serializers.SerializerMethodField()
    recommended_track = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'bio',
            'avatar_url',
            'phone_number',
            'country',
            'timezone',
            'language',
            'cohort_id',
            'track_key',
            'org_id',
            'account_status',
            'email_verified',
            'mfa_enabled',
            'risk_level',
            'is_active',
            'created_at',
            'updated_at',
            'roles',
            'consent_scopes',
            'entitlements',
            # Student onboarding fields
            'preferred_learning_style',
            'career_goals',
            'cyber_exposure_level',
            # Profiling completion tracking (Tier 0)
            'profiling_complete',
            'profiling_completed_at',
            'profiling_session_id',
            'recommended_track',
            # Foundations completion tracking (Tier 1)
            'foundations_complete',
            'foundations_completed_at',
            # Mentor fields
            'is_mentor',
            'mentor_capacity_weekly',
            'mentor_availability',
            'mentor_specialties',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'account_status', 'email_verified']
    
    def get_roles(self, obj):
        """Get user roles with scope information and user_role ID for revocation."""
        return [
            {
                'id': role.id,
                'role': role.role.name,
                'role_id': role.role.id,
                'scope': role.scope,
                'scope_ref': str(role.scope_ref) if role.scope_ref else None,
            }
            for role in obj.user_roles.filter(is_active=True)
        ]
    
    def get_consent_scopes(self, obj):
        """Get granted consent scopes."""
        return list(
            obj.consent_scopes.filter(granted=True, expires_at__isnull=True)
            .values_list('scope_type', flat=True)
        )
    
    def get_entitlements(self, obj):
        """Get user entitlements."""
        return list(
            obj.entitlements.filter(granted=True, expires_at__isnull=True)
            .values_list('feature', flat=True)
        )
    
    def get_recommended_track(self, obj):
        """Get recommended track from StudentDashboardCache if available."""
        try:
            from student_dashboard.models import StudentDashboardCache
            cache = StudentDashboardCache.objects.get(user=obj)
            return cache.recommended_track if cache.recommended_track else None
        except Exception:
            return None


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for Role model.
    """
    class Meta:
        model = Role
        fields = [
            'id',
            'name',
            'display_name',
            'description',
            'is_system_role',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users (signup).
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = [
            'email',
            'username',
            'password',
            'first_name',
            'last_name',
            'country',
            'timezone',
            'language',
            'cohort_id',
            'track_key',
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        # Set account status based on invite or verification requirement
        if 'cohort_id' in validated_data or 'track_key' in validated_data:
            # If invited, activate immediately
            user.account_status = 'active'
            user.is_active = True
            user.save()
        return user


class SignupSerializer(serializers.Serializer):
    """
    Signup serializer for email/password or passwordless.
    Supports Student onboarding with profile fields.
    """
    email = serializers.EmailField()
    password = serializers.CharField(required=False, validators=[validate_password])
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    country = serializers.CharField(max_length=2, required=False)
    timezone = serializers.CharField(default='UTC')
    language = serializers.CharField(default='en')
    passwordless = serializers.BooleanField(default=False)
    invite_token = serializers.CharField(required=False)  # For invite flow
    cohort_id = serializers.CharField(required=False)
    track_key = serializers.CharField(required=False)
    
    # Student onboarding profile fields (optional during signup, can be completed later)
    preferred_learning_style = serializers.ChoiceField(
        choices=User.LEARNING_STYLE_CHOICES,
        required=False,
        allow_null=True
    )
    career_goals = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cyber_exposure_level = serializers.ChoiceField(
        choices=User.CYBER_EXPOSURE_CHOICES,
        required=False,
        allow_null=True
    )


class LoginSerializer(serializers.Serializer):
    """
    Login serializer for email/password or passwordless.
    """
    email = serializers.EmailField()
    password = serializers.CharField(required=False)
    code = serializers.CharField(required=False)  # For passwordless/magic link
    device_fingerprint = serializers.CharField(required=False)
    device_name = serializers.CharField(required=False)


class MagicLinkRequestSerializer(serializers.Serializer):
    """Request magic link serializer."""
    email = serializers.EmailField()


class MFAEnrollSerializer(serializers.Serializer):
    """MFA enrollment serializer."""
    method = serializers.ChoiceField(choices=['totp', 'sms', 'email'])
    phone_number = serializers.CharField(required=False)  # For SMS


class MFAVerifySerializer(serializers.Serializer):
    """MFA verification serializer."""
    code = serializers.CharField()
    method = serializers.ChoiceField(choices=['totp', 'sms', 'email', 'backup_codes'])


class RefreshTokenSerializer(serializers.Serializer):
    """Refresh token serializer."""
    refresh_token = serializers.CharField()
    device_fingerprint = serializers.CharField(required=False)


class ConsentUpdateSerializer(serializers.Serializer):
    """Update consent scopes serializer."""
    scope_type = serializers.CharField()
    granted = serializers.BooleanField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    """Password reset request serializer."""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Password reset confirmation serializer."""
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])


class AuditLogSerializer(serializers.ModelSerializer):
    """Audit log serializer."""
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor_type',
            'actor_identifier',
            'action',
            'resource_type',
            'resource_id',
            'timestamp',
            'ip_address',
            'user_agent',
            'changes',
            'metadata',
            'result',
        ]
        read_only_fields = fields
