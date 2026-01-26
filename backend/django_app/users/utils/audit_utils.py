"""
Audit logging utilities.

Used across apps (programs, missions, etc.) to record director/admin actions for analytics.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from django.utils import timezone

from users.audit_models import AuditLog


def _get_client_ip(request) -> Optional[str]:
    """Best-effort client IP extraction."""
    if request is None:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        # XFF may contain a list: client, proxy1, proxy2...
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_audit_event(
    *,
    request,
    user,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    result: str = "success",
    metadata: Optional[Dict[str, Any]] = None,
    changes: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None,
) -> Optional[AuditLog]:
    """
    Create an AuditLog entry.

    Notes:
    - We intentionally keep this lightweight and best-effort: failures to log should never
      break the main business action.
    """
    actor_identifier = None
    if user is not None:
        actor_identifier = getattr(user, "email", None) or getattr(user, "username", None) or str(getattr(user, "id", "unknown"))

    try:
        return AuditLog.objects.create(
            user=user if user is not None else None,
            api_key=None,
            actor_type="user" if user is not None else "system",
            actor_identifier=actor_identifier or "system",
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT") if request is not None else None,
            request_id=request.META.get("HTTP_X_REQUEST_ID") if request is not None else None,
            changes=changes or {},
            metadata=metadata or {},
            result=result,
            error_message=error_message,
            timestamp=timezone.now(),
        )
    except Exception:
        # Never block core flows due to audit logging.
        return None


