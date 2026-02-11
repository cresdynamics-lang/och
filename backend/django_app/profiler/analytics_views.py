"""
Analytics views for Profiler success metrics.

These endpoints are intentionally lightweight so that the Django server can
start even if full analytics implementation is not yet complete.

They are wired from `profiler/urls.py`:
  - GET /api/v1/profiler/admin/analytics/acceptance-rate
  - GET /api/v1/profiler/admin/analytics/role-mapping-accuracy
"""

from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ProfilerSession


def _is_admin_or_analyst(user) -> bool:
    """
    Helper for analytics access: admin or analyst role (read-only for analyst).
    """
    user_roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)]
    return user.is_staff or "admin" in user_roles or "analyst" in user_roles


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_track_acceptance_analytics(request):
    """
    GET /api/v1/profiler/admin/analytics/acceptance-rate

    Basic implementation of the "90% accept the recommended track" metric.
    Calculates acceptance rate from `ProfilerSession.result_accepted`.

    Optional query params:
      - cohort_id: UUID of a cohort to filter by (if your data model supports it)
      - days: integer window size (e.g. 7, 30) for recent data; defaults to 30
    """
    user = request.user
    if not _is_admin_or_analyst(user):
        return Response(
            {"error": "Admin or Analyst access required"},
            status=403,
        )
    # Time window
    try:
        days = int(request.query_params.get("days", 30))
    except (TypeError, ValueError):
        days = 30
    from users.utils.audit_utils import log_analytics_access
    log_analytics_access(request, user, "profiler_acceptance_rate", metadata={"days": days})

    window_start = timezone.now() - timedelta(days=days)

    # Base queryset: finished/locked sessions with a recorded acceptance flag
    sessions = ProfilerSession.objects.filter(
        completed_at__gte=window_start,
        result_accepted__isnull=False,
    )

    total_with_decision = sessions.count()
    accepted_count = sessions.filter(result_accepted=True).count()
    overridden_count = sessions.filter(result_accepted=False).count()

    acceptance_rate = (
        (accepted_count / total_with_decision) * 100 if total_with_decision > 0 else 0.0
    )

    data = {
        "window_days": days,
        "from": window_start.isoformat(),
        "to": timezone.now().isoformat(),
        "total_with_decision": total_with_decision,
        "accepted_count": accepted_count,
        "overridden_count": overridden_count,
        "acceptance_rate": round(acceptance_rate, 2),
        "target_acceptance_rate": 90.0,
        "meets_target": acceptance_rate >= 90.0,
    }

    return Response(data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_role_mapping_accuracy(request):
    """
    GET /api/v1/profiler/admin/analytics/role-mapping-accuracy

    Placeholder endpoint for the "Role mappings accurate >85%" metric.
    The full implementation depends on a MentorTrackFeedback (or similar)
    model that records mentor validation of recommended tracks.

    For now, it returns a descriptive payload so the frontend and URL
    configuration remain stable.
    """
    user = request.user
    if not _is_admin_or_analyst(user):
        return Response(
            {"error": "Admin or Analyst access required"},
            status=403,
        )
    from users.utils.audit_utils import log_analytics_access
    log_analytics_access(request, user, "profiler_role_mapping_accuracy", metadata={})

    payload = {
        "status": "placeholder",
        "message": (
            "Role-mapping accuracy analytics endpoint is available, but the "
            "feedback data model (e.g., MentorTrackFeedback) has not been "
            "implemented yet. Once feedback records exist, this endpoint "
            "should compute the percentage of mentor-confirmed track "
            "assignments and compare it against the 85% target."
        ),
        "target_accuracy_rate": 85.0,
        "current_accuracy_rate": None,
    }

    return Response(payload, status=200)

