"""
Risk assessment utilities for authentication security.
"""
from django.utils import timezone
from datetime import timedelta
from users.auth_models import UserSession, DeviceTrust
from users.audit_models import AuditLog


def calculate_risk_score(user, ip_address, device_fingerprint, user_agent):
    """
    Calculate risk score based on:
    - New device detection
    - Geo-velocity (IP changes)
    - TOR/VPN detection (placeholder)
    - Previous failed attempts
    """
    risk_score = 0.0
    
    # Check if device is new
    if not DeviceTrust.objects.filter(
        user=user,
        device_fingerprint=device_fingerprint
    ).exists():
        risk_score += 0.3  # New device
    
    # Check recent IP addresses
    recent_sessions = UserSession.objects.filter(
        user=user,
        created_at__gte=timezone.now() - timedelta(hours=24)
    ).exclude(ip_address__isnull=True).values_list('ip_address', flat=True).distinct()
    
    if ip_address and ip_address not in recent_sessions:
        risk_score += 0.2  # New IP address
    
    # Check for rapid IP changes (geo-velocity)
    if len(recent_sessions) > 3:
        risk_score += 0.2
    
    # Check failed login attempts (from audit log)
    recent_failures = AuditLog.objects.filter(
        user=user,
        action='login',
        result='failure',
        timestamp__gte=timezone.now() - timedelta(minutes=15)
    ).count()
    
    if recent_failures > 0:
        risk_score += min(recent_failures * 0.1, 0.5)  # Cap at 0.5
    
    # TOR/VPN detection (placeholder - implement with external service)
    if _is_tor_or_vpn(ip_address):
        risk_score += 0.3
    
    return min(risk_score, 1.0)  # Cap at 1.0


def requires_mfa(risk_score, user_role=None):
    """
    Determine if MFA is required based on risk score and role.
    Finance/Admin roles always require MFA.
    """
    from django.conf import settings
    
    # In development, skip MFA for test users if DEBUG is True
    if settings.DEBUG:
        # Allow bypassing MFA for test users in development
        # This can be overridden by user.mfa_enabled flag
        pass
    
    # Role-based MFA requirement
    if user_role in ['finance', 'admin']:
        return True
    
    # Risk-based MFA requirement
    if risk_score >= 0.5:
        return True
    
    return False


def _is_tor_or_vpn(ip_address):
    """
    Check if IP is TOR or VPN (placeholder).
    TODO: Integrate with TOR exit node list or VPN detection service.
    """
    # Placeholder implementation
    return False

