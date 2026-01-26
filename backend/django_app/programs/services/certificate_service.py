"""
Certificate Service - Certificate generation and issuance triggers.
"""
from django.db import transaction
from django.utils import timezone
from typing import Optional, Dict, Any
import logging

from programs.models import Enrollment, Certificate, Cohort
from programs.core_services import auto_graduate_cohort

logger = logging.getLogger(__name__)


class CertificateService:
    """Service for certificate management."""
    
    @staticmethod
    @transaction.atomic
    def issue_certificate(enrollment: Enrollment, auto_approve: bool = False) -> Certificate:
        """
        Issue certificate for a completed enrollment.
        
        Args:
            enrollment: Enrollment instance
            auto_approve: If True, automatically approve without manual review
        
        Returns:
            Certificate instance
        """
        if enrollment.status != 'completed':
            raise ValueError(f"Enrollment {enrollment.id} is not completed")
        
        # Check if certificate already exists
        if hasattr(enrollment, 'certificate'):
            return enrollment.certificate
        
        # Generate certificate file URI (mock - should integrate with certificate generation service)
        certificate_uri = f"https://certificates.och.com/{enrollment.id}.pdf"
        
        certificate = Certificate.objects.create(
            enrollment=enrollment,
            file_uri=certificate_uri,
        )
        
        logger.info(f"Issued certificate {certificate.id} for enrollment {enrollment.id}")
        return certificate
    
    @staticmethod
    @transaction.atomic
    def trigger_cohort_certificates(cohort: Cohort, auto_approve: bool = False) -> Dict[str, Any]:
        """
        Trigger certificate issuance for all completed enrollments in a cohort.
        
        Args:
            cohort: Cohort instance
            auto_approve: If True, automatically approve all certificates
        
        Returns:
            Dict with issuance statistics
        """
        # First, auto-graduate eligible students
        graduation_result = auto_graduate_cohort(cohort.id)
        
        # Issue certificates for completed enrollments
        completed_enrollments = Enrollment.objects.filter(
            cohort=cohort,
            status='completed'
        )
        
        issued_count = 0
        skipped_count = 0
        errors = []
        
        for enrollment in completed_enrollments:
            try:
                # Check if certificate already exists
                if hasattr(enrollment, 'certificate'):
                    skipped_count += 1
                    continue
                
                CertificateService.issue_certificate(enrollment, auto_approve)
                issued_count += 1
            except Exception as e:
                errors.append(f"Error issuing certificate for enrollment {enrollment.id}: {str(e)}")
                logger.error(f"Certificate issuance error: {e}")
        
        result = {
            'cohort_id': str(cohort.id),
            'graduated': graduation_result.get('completed', 0),
            'certificates_issued': issued_count,
            'certificates_skipped': skipped_count,
            'errors': errors,
        }
        
        logger.info(f"Certificate trigger completed for cohort {cohort.id}: {result}")
        return result
    
    @staticmethod
    @transaction.atomic
    def archive_cohort_and_issue_certificates(cohort: Cohort) -> Dict[str, Any]:
        """
        Archive a cohort and trigger certificate issuance.
        This is called when cohort status changes to 'closed'.
        
        Args:
            cohort: Cohort instance
        
        Returns:
            Dict with archive and certificate statistics
        """
        if cohort.status != 'closing':
            raise ValueError(f"Cohort {cohort.id} must be in 'closing' status before archiving")
        
        # Trigger certificate issuance
        certificate_result = CertificateService.trigger_cohort_certificates(cohort, auto_approve=True)
        
        # Update cohort status to closed
        cohort.status = 'closed'
        cohort.save()
        
        # TODO: Trigger analytics pipeline
        # TODO: Generate final reports
        # TODO: Notify stakeholders
        
        result = {
            'cohort_id': str(cohort.id),
            'status': 'closed',
            'certificates': certificate_result,
            'archived_at': timezone.now().isoformat(),
        }
        
        logger.info(f"Cohort {cohort.id} archived: {result}")
        return result

