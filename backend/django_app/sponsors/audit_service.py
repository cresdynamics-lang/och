"""
Audit logging service for sponsor actions.
Tracks all sponsor interactions for compliance and analytics.
"""
import json
from django.utils import timezone
from users.audit_models import AuditLog
from .models import Sponsor, SponsorIntervention


class SponsorAuditService:
    """Service for logging sponsor-related actions"""

    ACTION_TYPES = {
        'dashboard_view': 'Dashboard accessed',
        'export_generated': 'Report exported',
        'intervention_deployed': 'AI intervention deployed',
        'cohort_created': 'Cohort created',
        'cohort_updated': 'Cohort updated',
        'student_enrolled': 'Student enrolled',
        'student_removed': 'Student removed',
        'alert_acknowledged': 'Alert acknowledged',
    }

    @staticmethod
    def log_dashboard_access(user, sponsor: Sponsor, cohort=None, additional_data=None):
        """Log when a sponsor dashboard is accessed"""
        data = {
            'sponsor_id': str(sponsor.id),
            'sponsor_slug': sponsor.slug,
            'sponsor_name': sponsor.name,
            'cohort_id': str(cohort.id) if cohort else None,
            'cohort_name': cohort.name if cohort else None,
        }
        if additional_data:
            data.update(additional_data)

        AuditLog.objects.create(
            user=user,
            action='dashboard_view',
            resource_type='sponsor_dashboard',
            resource_id=str(sponsor.id),
            details=json.dumps(data),
            ip_address=None,  # Would be populated by middleware
            user_agent=None,  # Would be populated by middleware
        )

    @staticmethod
    def log_export_action(user, sponsor: Sponsor, export_format: str, cohort=None):
        """Log when an export is generated"""
        data = {
            'sponsor_id': str(sponsor.id),
            'sponsor_slug': sponsor.slug,
            'export_format': export_format,
            'cohort_id': str(cohort.id) if cohort else None,
            'cohort_name': cohort.name if cohort else None,
            'export_timestamp': timezone.now().isoformat(),
        }

        AuditLog.objects.create(
            user=user,
            action='export_generated',
            resource_type='sponsor_export',
            resource_id=str(sponsor.id),
            details=json.dumps(data),
            ip_address=None,
            user_agent=None,
        )

    @staticmethod
    def log_intervention_deployment(user, intervention: SponsorIntervention):
        """Log when an AI intervention is deployed"""
        data = {
            'intervention_id': str(intervention.id),
            'sponsor_id': str(intervention.sponsor_cohort.sponsor.id),
            'sponsor_slug': intervention.sponsor_cohort.sponsor.slug,
            'cohort_id': str(intervention.sponsor_cohort.id),
            'cohort_name': intervention.sponsor_cohort.name,
            'intervention_type': intervention.intervention_type,
            'title': intervention.title,
            'expected_roi': float(intervention.expected_roi),
            'target_students_count': intervention.target_students.count(),
            'ai_trigger_reason': intervention.ai_trigger_reason,
            'deployment_timestamp': intervention.deployed_at.isoformat(),
        }

        AuditLog.objects.create(
            user=user,
            action='intervention_deployed',
            resource_type='sponsor_intervention',
            resource_id=str(intervention.id),
            details=json.dumps(data),
            ip_address=None,
            user_agent=None,
        )

    @staticmethod
    def log_cohort_action(user, cohort, action: str, additional_data=None):
        """Log cohort-related actions"""
        data = {
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'sponsor_id': str(cohort.sponsor.id),
            'sponsor_slug': cohort.sponsor.slug,
            'track_slug': cohort.track_slug,
            'students_enrolled': cohort.students_enrolled,
            'completion_rate': float(cohort.completion_rate),
        }
        if additional_data:
            data.update(additional_data)

        AuditLog.objects.create(
            user=user,
            action=action,
            resource_type='sponsor_cohort',
            resource_id=str(cohort.id),
            details=json.dumps(data),
            ip_address=None,
            user_agent=None,
        )

    @staticmethod
    def log_student_enrollment_action(user, student_cohort, action: str):
        """Log student enrollment/unenrollment actions"""
        data = {
            'student_cohort_id': str(student_cohort.id),
            'student_id': str(student_cohort.student.id),
            'student_email': student_cohort.student.email,
            'cohort_id': str(student_cohort.sponsor_cohort.id),
            'cohort_name': student_cohort.sponsor_cohort.name,
            'sponsor_id': str(student_cohort.sponsor_cohort.sponsor.id),
            'sponsor_slug': student_cohort.sponsor_cohort.sponsor.slug,
            'enrollment_status': student_cohort.enrollment_status,
            'completion_percentage': float(student_cohort.completion_percentage),
            'joined_at': student_cohort.joined_at.isoformat(),
            'notes': student_cohort.notes,
        }

        AuditLog.objects.create(
            user=user,
            action=action,
            resource_type='sponsor_student_enrollment',
            resource_id=str(student_cohort.id),
            details=json.dumps(data),
            ip_address=None,
            user_agent=None,
        )

    @staticmethod
    def get_sponsor_audit_log(sponsor: Sponsor, limit=100):
        """Get audit log entries for a specific sponsor"""
        return AuditLog.objects.filter(
            resource_type__in=['sponsor_dashboard', 'sponsor_export', 'sponsor_intervention', 'sponsor_cohort', 'sponsor_student_enrollment'],
            details__contains=f'"sponsor_id": "{sponsor.id}"'
        ).order_by('-created_at')[:limit]

    @staticmethod
    def get_privacy_safe_data(data: dict) -> dict:
        """
        Remove or mask PII from audit data.
        Ensures compliance with data protection regulations.
        """
        safe_data = data.copy()

        # Mask email addresses
        if 'student_email' in safe_data:
            email = safe_data['student_email']
            if '@' in email:
                local, domain = email.split('@')
                masked_local = local[:2] + '*' * (len(local) - 2) if len(local) > 2 else local
                safe_data['student_email'] = f"{masked_local}@{domain}"

        # Remove sensitive notes if they contain PII
        if 'notes' in safe_data and safe_data['notes']:
            # Check for potential PII patterns (simplified)
            notes = safe_data['notes'].lower()
            if any(keyword in notes for keyword in ['phone', 'address', 'ssn', 'passport']):
                safe_data['notes'] = '[REDACTED - Contains PII]'

        return safe_data
