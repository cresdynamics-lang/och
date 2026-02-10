"""
Audit logging service for sponsor and finance actions.
Tracks all sponsor/financial interactions for compliance (Botswana DPA/GDPR).
Uses users.audit_models.AuditLog (metadata field; valid action types).
"""
from django.utils import timezone
from users.audit_models import AuditLog
from .models import Sponsor, SponsorIntervention


def _actor_identifier(user):
    if user is None:
        return "system"
    return getattr(user, "email", None) or getattr(user, "username", None) or str(getattr(user, "id", "unknown"))


class SponsorAuditService:
    """Service for logging sponsor-related and financial actions."""

    @staticmethod
    def log_dashboard_access(user, sponsor: Sponsor, cohort=None, additional_data=None):
        """Log when a sponsor dashboard is accessed."""
        data = {
            "sponsor_id": str(sponsor.id),
            "sponsor_slug": sponsor.slug,
            "sponsor_name": sponsor.name,
            "cohort_id": str(cohort.id) if cohort else None,
            "cohort_name": cohort.name if cohort else None,
        }
        if additional_data:
            data.update(additional_data)
        try:
            AuditLog.objects.create(
                user=user,
                actor_type="user",
                actor_identifier=_actor_identifier(user),
                action="read",
                resource_type="sponsor_dashboard",
                resource_id=str(sponsor.id),
                metadata=data,
                timestamp=timezone.now(),
            )
        except Exception:
            pass

    @staticmethod
    def log_export_action(user, sponsor: Sponsor, export_format: str, cohort=None):
        """Log when an export is generated (data_exported for compliance)."""
        data = {
            "sponsor_id": str(sponsor.id),
            "sponsor_slug": sponsor.slug,
            "export_format": export_format,
            "cohort_id": str(cohort.id) if cohort else None,
            "cohort_name": cohort.name if cohort else None,
            "export_timestamp": timezone.now().isoformat(),
        }
        try:
            AuditLog.objects.create(
                user=user,
                actor_type="user",
                actor_identifier=_actor_identifier(user),
                action="data_exported",
                resource_type="sponsor_export",
                resource_id=str(sponsor.id),
                metadata=data,
                timestamp=timezone.now(),
            )
        except Exception:
            pass

    @staticmethod
    def log_intervention_deployment(user, intervention: SponsorIntervention):
        """Log when an AI intervention is deployed."""
        data = {
            "intervention_id": str(intervention.id),
            "sponsor_id": str(intervention.sponsor_cohort.sponsor.id),
            "cohort_id": str(intervention.sponsor_cohort.id),
            "intervention_type": intervention.intervention_type,
            "deployment_timestamp": intervention.deployed_at.isoformat(),
        }
        try:
            AuditLog.objects.create(
                user=user,
                actor_type="user",
                actor_identifier=_actor_identifier(user),
                action="create",
                resource_type="sponsor_intervention",
                resource_id=str(intervention.id),
                metadata=data,
                timestamp=timezone.now(),
            )
        except Exception:
            pass

    @staticmethod
    def log_cohort_action(user, cohort, action: str, additional_data=None):
        """Log cohort-related actions (e.g. cohort_created, invoice_generated, payment_marked)."""
        data = {
            "cohort_id": str(cohort.id) if cohort else None,
            "cohort_name": cohort.name if cohort else None,
            "sponsor_id": str(cohort.sponsor.id) if cohort else None,
            "sponsor_slug": cohort.sponsor.slug if cohort else None,
            "event": action,
        }
        if additional_data:
            data.update(SponsorAuditService.get_privacy_safe_data(additional_data))
        try:
            AuditLog.objects.create(
                user=user,
                actor_type="user",
                actor_identifier=_actor_identifier(user),
                action="update" if action in ("payment_marked", "payment_processed", "invoice_generated") else "create",
                resource_type="sponsor_cohort",
                resource_id=str(cohort.id) if cohort else None,
                metadata=data,
                timestamp=timezone.now(),
            )
        except Exception:
            pass

    @staticmethod
    def log_financial_action(user, action: str, resource_type: str, resource_id: str, metadata: dict = None):
        """Log financial actions (invoices, refunds, payments) for full audit trail."""
        safe = SponsorAuditService.get_privacy_safe_data(metadata or {})
        try:
            AuditLog.objects.create(
                user=user,
                actor_type="user",
                actor_identifier=_actor_identifier(user),
                action="create" if action in ("invoice_generated", "refund_approved") else "update",
                resource_type=resource_type,
                resource_id=resource_id,
                metadata={"event": action, **safe},
                timestamp=timezone.now(),
            )
        except Exception:
            pass

    @staticmethod
    def log_student_enrollment_action(user, student_cohort, action: str):
        """Log student enrollment/unenrollment (PII masked in metadata)."""
        data = SponsorAuditService.get_privacy_safe_data({
            "student_cohort_id": str(student_cohort.id),
            "student_id": str(student_cohort.student.id),
            "student_email": student_cohort.student.email,
            "cohort_id": str(student_cohort.sponsor_cohort.id),
            "cohort_name": student_cohort.sponsor_cohort.name,
            "sponsor_id": str(student_cohort.sponsor_cohort.sponsor.id),
            "sponsor_slug": student_cohort.sponsor_cohort.sponsor.slug,
            "enrollment_status": student_cohort.enrollment_status,
            "completion_percentage": float(student_cohort.completion_percentage),
            "joined_at": student_cohort.joined_at.isoformat(),
            "notes": student_cohort.notes,
        })
        try:
            AuditLog.objects.create(
                user=user,
                actor_type="user",
                actor_identifier=_actor_identifier(user),
                action="create" if action == "student_enrolled" else "update",
                resource_type="sponsor_student_enrollment",
                resource_id=str(student_cohort.id),
                metadata=data,
                timestamp=timezone.now(),
            )
        except Exception:
            pass

    @staticmethod
    def get_sponsor_audit_log(sponsor: Sponsor, limit=100):
        """Get audit log entries for a specific sponsor (uses metadata JSON)."""
        from django.db.models import Q
        return AuditLog.objects.filter(
            Q(metadata__sponsor_id=str(sponsor.id)) | Q(resource_type="sponsor_dashboard", resource_id=str(sponsor.id)),
            resource_type__in=[
                "sponsor_dashboard", "sponsor_export", "sponsor_intervention",
                "sponsor_cohort", "sponsor_student_enrollment", "billing", "invoice",
            ],
        ).order_by("-timestamp")[:limit]

    @staticmethod
    def get_privacy_safe_data(data: dict) -> dict:
        """Remove or mask PII from audit data (GDPR/DPA compliance)."""
        safe_data = dict(data)
        if "student_email" in safe_data and safe_data["student_email"]:
            email = str(safe_data["student_email"])
            if "@" in email:
                local, _, domain = email.partition("@")
                masked = (local[:2] + "*" * (len(local) - 2)) if len(local) > 2 else local
                safe_data["student_email"] = f"{masked}@{domain}"
        if "notes" in safe_data and safe_data.get("notes"):
            notes = str(safe_data["notes"]).lower()
            if any(k in notes for k in ("phone", "address", "ssn", "passport")):
                safe_data["notes"] = "[REDACTED - PII]"
        return safe_data
