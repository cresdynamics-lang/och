"""
Authentication utilities for passwordless, MFA, and token management.
"""
import secrets
import hashlib
import hmac
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from users.auth_models import MFACode, UserSession, DeviceTrust, MFAMethod

User = get_user_model()


def generate_magic_link_code():
    """Generate a secure magic link code."""
    return secrets.token_urlsafe(32)


def generate_otp_code(length=6):
    """Generate a numeric OTP code."""
    return ''.join([str(secrets.randbelow(10)) for _ in range(length)])


def hash_refresh_token(token):
    """Hash refresh token for storage (opaque token)."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_mfa_code(user, method='email', expires_minutes=10):
    """
    Create an MFA code (OTP or magic link).
    Returns the code (to be sent to user) and the MFACode object.
    """
    if method == 'magic_link':
        code = generate_magic_link_code()
    else:
        code = generate_otp_code()
    
    expires_at = timezone.now() + timedelta(minutes=expires_minutes)
    
    mfa_code = MFACode.objects.create(
        user=user,
        code=code,
        method=method,
        expires_at=expires_at,
    )
    
    return code, mfa_code


def verify_mfa_code(user, code, method='email'):
    """
    Verify an MFA code.
    Returns True if valid, False otherwise.
    """
    try:
        mfa_code = MFACode.objects.get(
            user=user,
            code=code,
            method=method,
            used=False,
            expires_at__gt=timezone.now()
        )
        mfa_code.used = True
        mfa_code.used_at = timezone.now()
        mfa_code.save()
        return True
    except MFACode.DoesNotExist:
        return False


def create_user_session(user, device_fingerprint, device_name=None, ip_address=None, user_agent=None):
    """
    Create a user session with refresh token.
    Returns (access_token, refresh_token, session)
    """
    # Validate user is active before creating tokens
    if not user.is_active:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f'Attempted to create token for inactive user: {user.id}. If this is not intentional, consider checking the user\'s status before calling the `for_user` method.')
        raise ValueError(f'Cannot create session for inactive user: {user.id}')
    
    # Validate user is active before creating tokens
    if not user.is_active:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f'Attempted to create token for inactive user: {user.id}. If this is not intentional, consider checking the user\'s status before calling the `for_user` method.')
        raise ValueError(f'Cannot create session for inactive user: {user.id}')
    
    # Generate refresh token
    refresh = RefreshToken.for_user(user)
    refresh_token_str = str(refresh)
    refresh_token_hash = hash_refresh_token(refresh_token_str)
    
    # Create session
    expires_at = timezone.now() + timedelta(days=30)  # 30 days per spec
    
    session = UserSession.objects.create(
        user=user,
        device_fingerprint=device_fingerprint,
        device_name=device_name or 'Unknown Device',
        device_type=_detect_device_type(user_agent),
        ip_address=ip_address,
        ua=user_agent,
        refresh_token_hash=refresh_token_hash,
        expires_at=expires_at,
        mfa_verified=False,  # Will be set to True after MFA verification
    )
    
    # Get access token (15 min lifetime)
    access_token = refresh.access_token
    
    return str(access_token), refresh_token_str, session


def verify_refresh_token(refresh_token):
    """
    Verify refresh token and return session.
    Returns (session, user) if valid, (None, None) otherwise.
    """
    refresh_token_hash = hash_refresh_token(refresh_token)
    
    try:
        session = UserSession.objects.get(
            refresh_token_hash=refresh_token_hash,
            revoked_at__isnull=True,
            expires_at__gt=timezone.now()
        )
        return session, session.user
    except UserSession.DoesNotExist:
        return None, None


def rotate_refresh_token(old_refresh_token, device_fingerprint):
    """
    Rotate refresh token (invalidate old, create new).
    Returns (new_access_token, new_refresh_token, session)
    """
    session, user = verify_refresh_token(old_refresh_token)
    
    if not session:
        return None, None, None
    
    # Revoke old session
    session.revoked_at = timezone.now()
    session.save()
    
    # Create new session with new refresh token
    return create_user_session(
        user=user,
        device_fingerprint=device_fingerprint,
        device_name=session.device_name,
        ip_address=session.ip_address,
        user_agent=session.ua
    )


def revoke_session(session_id=None, refresh_token=None, user=None, device_fingerprint=None):
    """
    Revoke a session (logout).
    Can revoke by session_id, refresh_token, or all sessions for user/device.
    """
    if session_id:
        UserSession.objects.filter(id=session_id).update(revoked_at=timezone.now())
    elif refresh_token:
        refresh_token_hash = hash_refresh_token(refresh_token)
        UserSession.objects.filter(refresh_token_hash=refresh_token_hash).update(revoked_at=timezone.now())
    elif user and device_fingerprint:
        UserSession.objects.filter(
            user=user,
            device_fingerprint=device_fingerprint
        ).update(revoked_at=timezone.now())
    elif user:
        # Global sign-out
        UserSession.objects.filter(user=user).update(revoked_at=timezone.now())


def check_device_trust(user, device_fingerprint):
    """Check if device is trusted (skip MFA)."""
    return DeviceTrust.objects.filter(
        user=user,
        device_fingerprint=device_fingerprint,
        revoked_at__isnull=True,
        expires_at__gt=timezone.now()
    ).exists()


def trust_device(user, device_fingerprint, device_name, device_type, ip_address=None, user_agent=None, expires_days=90):
    """Mark a device as trusted."""
    expires_at = timezone.now() + timedelta(days=expires_days)
    
    device_trust, created = DeviceTrust.objects.get_or_create(
        user=user,
        device_fingerprint=device_fingerprint,
        defaults={
            'device_name': device_name,
            'device_type': device_type,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'expires_at': expires_at,
        }
    )
    
    if not created:
        device_trust.last_used_at = timezone.now()
        device_trust.save()
    
    return device_trust


def generate_totp_backup_codes(count=10):
    """
    Generate backup codes for TOTP MFA.
    Returns list of plain codes (to be shown once) and hashed codes (for storage).
    """
    import hashlib
    backup_codes = []
    hashed_codes = []
    
    for _ in range(count):
        code = secrets.token_urlsafe(16)  # 16-character backup code
        backup_codes.append(code)
        # Hash for storage
        hashed_codes.append(hashlib.sha256(code.encode()).hexdigest())
    
    return backup_codes, hashed_codes


def verify_totp_backup_code(user, code):
    """
    Verify a TOTP backup code.
    Returns True if valid, False otherwise.
    """
    import hashlib
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    
    mfa_method = MFAMethod.objects.filter(
        user=user,
        method_type='totp',
        enabled=True
    ).first()
    
    if not mfa_method or not mfa_method.totp_backup_codes:
        return False
    
    # Check if code matches any backup code
    if code_hash in mfa_method.totp_backup_codes:
        # Remove used backup code
        mfa_method.totp_backup_codes.remove(code_hash)
        mfa_method.save()
        return True
    
    return False


def _detect_device_type(user_agent):
    """Detect device type from user agent string."""
    if not user_agent:
        return 'unknown'
    
    ua_lower = user_agent.lower()
    if 'mobile' in ua_lower or 'android' in ua_lower or 'iphone' in ua_lower:
        return 'mobile'
    elif 'tablet' in ua_lower or 'ipad' in ua_lower:
        return 'tablet'
    else:
        return 'desktop'

