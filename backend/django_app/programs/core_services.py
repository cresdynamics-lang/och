"""
Services for Programs app - Auto-graduation logic, enrollment management, and certificate generation.
"""
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Enrollment, ProgramRule, Certificate, Cohort, Waitlist
from progress.models import Progress
import logging

logger = logging.getLogger(__name__)


def evaluate_completion_criteria(enrollment, rule):
    """
    Evaluate if enrollment meets completion criteria.
    
    Args:
        enrollment: Enrollment instance
        rule: ProgramRule instance with criteria
    
    Returns:
        dict: {
            'meets_criteria': bool,
            'attendance_percent': float,
            'portfolio_approved': bool,
            'feedback_score': float,
            'payment_complete': bool,
            'details': dict
        }
    """
    criteria = rule.rule.get('criteria', {})
    details = {}
    
    # Check attendance percentage
    attendance_percent = 0.0
    if 'attendance_percent' in criteria:
        # Calculate from calendar events attendance (mock - should come from actual attendance tracking)
        total_events = enrollment.cohort.calendar_events.filter(
            type__in=['session', 'orientation']
        ).count()
        attended_events = 0  # Mock - should come from attendance records
        attendance_percent = (attended_events / total_events * 100) if total_events > 0 else 0
        details['attendance_percent'] = attendance_percent
        details['attendance_required'] = criteria.get('attendance_percent', 80)
    
    # Check portfolio approval
    portfolio_approved = False
    if 'portfolio_approved' in criteria:
        # Mock - should check actual portfolio approval status
        portfolio_approved = False  # Should query portfolio module
        details['portfolio_approved'] = portfolio_approved
        details['portfolio_required'] = criteria.get('portfolio_approved', True)
    
    # Check feedback score
    feedback_score = 0.0
    if 'feedback_score' in criteria:
        # Mock - should come from feedback/ratings system
        feedback_score = 0.0
        details['feedback_score'] = feedback_score
        details['feedback_required'] = criteria.get('feedback_score', 4.0)
    
    # Check payment status
    payment_complete = enrollment.payment_status == 'paid' or enrollment.payment_status == 'waived'
    details['payment_complete'] = payment_complete
    details['payment_required'] = criteria.get('payment_complete', True)
    
    # Evaluate all criteria
    meets_attendance = attendance_percent >= criteria.get('attendance_percent', 80) if 'attendance_percent' in criteria else True
    meets_portfolio = portfolio_approved if 'portfolio_approved' in criteria else True
    meets_feedback = feedback_score >= criteria.get('feedback_score', 4.0) if 'feedback_score' in criteria else True
    meets_payment = payment_complete if 'payment_complete' in criteria else True
    
    meets_criteria = meets_attendance and meets_portfolio and meets_feedback and meets_payment
    
    return {
        'meets_criteria': meets_criteria,
        'attendance_percent': attendance_percent,
        'portfolio_approved': portfolio_approved,
        'feedback_score': feedback_score,
        'payment_complete': payment_complete,
        'details': details
    }


@transaction.atomic
def auto_graduate_cohort(cohort_id, rule_id=None):
    """
    Auto-graduate students in a cohort based on completion rules.
    
    Args:
        cohort_id: UUID of cohort
        rule_id: Optional UUID of specific rule to use
    
    Returns:
        dict: {
            'completed': int,
            'incomplete': int,
            'certificates_generated': int,
            'errors': list
        }
    """
    try:
        cohort = Cohort.objects.get(id=cohort_id)
    except Cohort.DoesNotExist:
        return {'error': 'Cohort not found'}
    
    # Get active rule for program
    if rule_id:
        rule = ProgramRule.objects.get(id=rule_id, active=True)
    else:
        rule = ProgramRule.objects.filter(
            program=cohort.track.program,
            active=True
        ).order_by('-version').first()
    
    if not rule:
        return {'error': 'No active completion rule found'}
    
    enrollments = Enrollment.objects.filter(
        cohort=cohort,
        status='active'
    )
    
    completed_count = 0
    incomplete_count = 0
    certificates_generated = 0
    errors = []
    
    for enrollment in enrollments:
        try:
            evaluation = evaluate_completion_criteria(enrollment, rule)
            
            if evaluation['meets_criteria']:
                enrollment.status = 'completed'
                enrollment.completed_at = timezone.now()
                enrollment.save()
                completed_count += 1
                
                # Generate certificate if not exists
                if not hasattr(enrollment, 'certificate'):
                    certificate = Certificate.objects.create(
                        enrollment=enrollment,
                        file_uri=''  # Should be generated by certificate service
                    )
                    certificates_generated += 1
                    logger.info(f"Generated certificate for {enrollment.user.email}")
            else:
                enrollment.status = 'incomplete'
                enrollment.save()
                incomplete_count += 1
                logger.info(f"Enrollment {enrollment.id} marked incomplete: {evaluation['details']}")
        
        except Exception as e:
            errors.append(f"Error processing enrollment {enrollment.id}: {str(e)}")
            logger.error(f"Error in auto_graduate_cohort for enrollment {enrollment.id}: {e}")
    
    return {
        'completed': completed_count,
        'incomplete': incomplete_count,
        'certificates_generated': certificates_generated,
        'errors': errors
    }


class EnrollmentService:
    """Service for managing enrollments, waitlists, and seat allocation."""
    
    @staticmethod
    def check_multi_cohort_prevention(user, cohort):
        """
        Prevent enrollment in multiple cohorts of the same program.
        
        Args:
            user: User instance
            cohort: Cohort instance
        
        Returns:
            tuple: (is_allowed: bool, error_message: str)
        """
        # Check if user is already enrolled in another cohort of the same program
        existing_enrollments = Enrollment.objects.filter(
            user=user,
            cohort__track__program=cohort.track.program,
            status__in=['active', 'pending_payment']
        ).exclude(cohort=cohort)
        
        if existing_enrollments.exists():
            existing_cohort = existing_enrollments.first().cohort
            return False, f"User is already enrolled in {existing_cohort.name} of the same program"
        
        return True, None
    
    @staticmethod
    def check_seat_availability(cohort, seat_type='paid'):
        """
        Check if seats are available in cohort.
        
        Args:
            cohort: Cohort instance
            seat_type: Type of seat to check
        
        Returns:
            tuple: (is_available: bool, available_count: int)
        """
        active_enrollments = cohort.enrollments.filter(status__in=['active', 'pending_payment']).count()
        available_seats = cohort.seat_cap - active_enrollments
        
        # Check seat pool if defined
        if cohort.seat_pool:
            pool_seats = cohort.seat_pool.get(seat_type, 0)
            if pool_seats > 0:
                used_seats = cohort.enrollments.filter(
                    status__in=['active', 'pending_payment'],
                    seat_type=seat_type
                ).count()
                available_seats = min(available_seats, pool_seats - used_seats)
        
        return available_seats > 0, max(0, available_seats)
    
    @staticmethod
    def check_entitlements(user, cohort):
        """
        Check if user has entitlements from Billing to enroll.
        This is a placeholder - should integrate with Billing module.
        
        Args:
            user: User instance
            cohort: Cohort instance
        
        Returns:
            tuple: (has_entitlement: bool, error_message: str)
        """
        # TODO: Integrate with Billing module to check:
        # - Active subscription
        # - Payment status
        # - Seat entitlements
        # - Scholarship eligibility
        
        # For now, return True (allow enrollment)
        # In production, this should query the Billing/Subscriptions module
        return True, None
    
    @staticmethod
    @transaction.atomic
    def create_enrollment(user, cohort, enrollment_type='self', seat_type='paid', org=None):
        """
        Create enrollment with validation and waitlist handling.
        
        Args:
            user: User instance
            cohort: Cohort instance
            enrollment_type: Type of enrollment
            seat_type: Type of seat
            org: Optional organization
        
        Returns:
            tuple: (enrollment: Enrollment or Waitlist, is_waitlisted: bool, error_message: str)
        """
        # Check multi-cohort prevention
        is_allowed, error = EnrollmentService.check_multi_cohort_prevention(user, cohort)
        if not is_allowed:
            return None, False, error
        
        # Check entitlements
        has_entitlement, error = EnrollmentService.check_entitlements(user, cohort)
        if not has_entitlement:
            return None, False, error or "User does not have required entitlements"
        
        # Check if already enrolled
        existing = Enrollment.objects.filter(cohort=cohort, user=user).first()
        if existing:
            return existing, False, "User is already enrolled in this cohort"
        
        # Check seat availability
        is_available, available_count = EnrollmentService.check_seat_availability(cohort, seat_type)
        
        if not is_available:
            # Add to waitlist
            waitlist_entry = EnrollmentService.add_to_waitlist(user, cohort, enrollment_type, seat_type, org)
            return waitlist_entry, True, None
        
        # Create enrollment
        enrollment = Enrollment.objects.create(
            user=user,
            cohort=cohort,
            enrollment_type=enrollment_type,
            seat_type=seat_type,
            org=org,
            status='pending_payment' if seat_type == 'paid' else 'active',
            payment_status='pending' if seat_type == 'paid' else 'waived'
        )
        
        logger.info(f"Created enrollment: {enrollment.id} for user {user.email} in cohort {cohort.name}")
        return enrollment, False, None
    
    @staticmethod
    @transaction.atomic
    def add_to_waitlist(user, cohort, enrollment_type='self', seat_type='paid', org=None):
        """
        Add user to waitlist (FIFO queue).
        
        Args:
            user: User instance
            cohort: Cohort instance
            enrollment_type: Type of enrollment
            seat_type: Type of seat
            org: Optional organization
        
        Returns:
            Waitlist instance
        """
        # Check if already on waitlist
        existing = Waitlist.objects.filter(
            cohort=cohort,
            user=user,
            active=True
        ).first()
        
        if existing:
            return existing
        
        # Get next position in queue
        last_entry = Waitlist.objects.filter(
            cohort=cohort,
            active=True
        ).order_by('-position').first()
        
        next_position = (last_entry.position + 1) if last_entry else 1
        
        waitlist_entry = Waitlist.objects.create(
            user=user,
            cohort=cohort,
            enrollment_type=enrollment_type,
            seat_type=seat_type,
            org=org,
            position=next_position,
            active=True
        )
        
        logger.info(f"Added {user.email} to waitlist for {cohort.name} at position {next_position}")
        return waitlist_entry
    
    @staticmethod
    @transaction.atomic
    def promote_from_waitlist(cohort, count=1):
        """
        Promote users from waitlist when seats become available (FIFO).
        
        Args:
            cohort: Cohort instance
            count: Number of users to promote
        
        Returns:
            list: List of created Enrollment instances
        """
        promoted = []
        
        # Get waitlist entries in FIFO order
        waitlist_entries = Waitlist.objects.filter(
            cohort=cohort,
            active=True
        ).order_by('position', 'added_at')[:count]
        
        for waitlist_entry in waitlist_entries:
            # Check seat availability again
            is_available, _ = EnrollmentService.check_seat_availability(cohort, waitlist_entry.seat_type)
            
            if not is_available:
                continue  # Skip if no seats available
            
            # Check entitlements
            has_entitlement, error = EnrollmentService.check_entitlements(waitlist_entry.user, cohort)
            if not has_entitlement:
                logger.warning(f"User {waitlist_entry.user.email} no longer has entitlements, skipping promotion")
                continue
            
            # Create enrollment
            enrollment = Enrollment.objects.create(
                user=waitlist_entry.user,
                cohort=cohort,
                enrollment_type=waitlist_entry.enrollment_type,
                seat_type=waitlist_entry.seat_type,
                org=waitlist_entry.org,
                status='pending_payment' if waitlist_entry.seat_type == 'paid' else 'active',
                payment_status='pending' if waitlist_entry.seat_type == 'paid' else 'waived'
            )
            
            # Mark waitlist entry as promoted
            waitlist_entry.active = False
            waitlist_entry.promoted_at = timezone.now()
            waitlist_entry.save()
            
            # Reorder remaining waitlist positions
            EnrollmentService._reorder_waitlist(cohort)
            
            promoted.append(enrollment)
            logger.info(f"Promoted {waitlist_entry.user.email} from waitlist to enrollment {enrollment.id}")
        
        return promoted
    
    @staticmethod
    def _reorder_waitlist(cohort):
        """Reorder waitlist positions after promotion."""
        active_entries = Waitlist.objects.filter(
            cohort=cohort,
            active=True
        ).order_by('position', 'added_at')
        
        for index, entry in enumerate(active_entries, start=1):
            if entry.position != index:
                entry.position = index
                entry.save(update_fields=['position'])


class ProgramManagementService:
    """Service for program management operations."""
    
    @staticmethod
    def create_cohort_from_template(track, name, start_date, end_date, template_id=None):
        """
        Create cohort from calendar template.
        
        Args:
            track: Track instance
            name: Cohort name
            start_date: Start date
            end_date: End date
            template_id: Optional calendar template ID
        
        Returns:
            Cohort instance
        """
        cohort = Cohort.objects.create(
            track=track,
            name=name,
            start_date=start_date,
            end_date=end_date,
            calendar_template_id=template_id
        )
        
        # TODO: If template_id provided, create calendar events from template
        # This would involve:
        # 1. Loading template calendar events
        # 2. Adjusting dates relative to start_date
        # 3. Creating CalendarEvent instances
        
        return cohort

