"""
Consent management utilities.
"""
from django.utils import timezone
from users.models import ConsentScope


def get_user_consent_scopes(user):
    """Get all granted consent scopes for a user."""
    return list(
        ConsentScope.objects.filter(
            user=user,
            granted=True,
            expires_at__isnull=True
        ).values_list('scope_type', flat=True)
    )


def grant_consent(user, scope_type, expires_at=None):
    """Grant a consent scope to a user."""
    consent, created = ConsentScope.objects.get_or_create(
        user=user,
        scope_type=scope_type,
        defaults={
            'granted': True,
            'granted_at': timezone.now(),
            'expires_at': expires_at,
        }
    )
    
    if not created:
        consent.granted = True
        consent.granted_at = timezone.now()
        consent.revoked_at = None
        consent.expires_at = expires_at
        consent.save()
    
    return consent


def revoke_consent(user, scope_type):
    """Revoke a consent scope from a user."""
    try:
        consent = ConsentScope.objects.get(
            user=user,
            scope_type=scope_type
        )
        consent.granted = False
        consent.revoked_at = timezone.now()
        consent.save()
        return consent
    except ConsentScope.DoesNotExist:
        return None


def check_consent(user, scope_type):
    """Check if user has granted a specific consent scope."""
    return ConsentScope.objects.filter(
        user=user,
        scope_type=scope_type,
        granted=True,
        expires_at__isnull=True
    ).exists()


def get_consent_scopes_for_token(user):
    """
    Get consent scopes to embed in JWT token.
    Returns list of scope strings.
    """
    return get_user_consent_scopes(user)


