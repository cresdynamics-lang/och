"""
Program Director Service - Comprehensive director operations.
Handles all director-specific business logic for programs, tracks, cohorts, and analytics.
"""
from django.db.models import Q, Count, Avg, Sum, F, Case, When, IntegerField
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from typing import Dict, List, Optional, Any
import logging

from programs.models import (
    Program, Track, Cohort, Enrollment, MentorAssignment,
    CalendarEvent, ProgramRule, Certificate, Waitlist
)
from progress.models import Progress
from users.models import User

logger = logging.getLogger(__name__)


class DirectorService:
    """Service for Program Director operations."""
    
    @staticmethod
    def get_director_programs(user: User) -> List[Program]:
        """Get all programs where user is a director."""
        return Program.objects.filter(
            tracks__director=user
        ).distinct()
    
    @staticmethod
    def get_director_tracks(user: User, program_id: Optional[str] = None) -> 'QuerySet[Track]':
        """Get all tracks where user is a director."""
        # For admin users, return all tracks (they can see everything)
        if user.is_staff:
            queryset = Track.objects.all()
        else:
            # Directors can see tracks they direct OR tracks in programs they direct
            queryset = Track.objects.filter(
                Q(director=user) | Q(program__tracks__director=user)
            ).distinct()
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        return queryset
    
    @staticmethod
    def get_director_cohorts(user: User, status: Optional[str] = None) -> List[Cohort]:
        """Get all cohorts where user is a director."""
        queryset = Cohort.objects.filter(track__director=user)
        if status:
            queryset = queryset.filter(status=status)
        return queryset.distinct()
    
    @staticmethod
    def can_manage_program(user: User, program: Program) -> bool:
        """Check if user can manage a program."""
        if user.is_staff:
            return True
        return program.tracks.filter(director=user).exists()
    
    @staticmethod
    def can_manage_track(user: User, track: Track) -> bool:
        """Check if user can manage a track."""
        if user.is_staff:
            logger.debug(f"User {user.email} is staff - allowing track management")
            return True
        
        # Check if user is the direct director of the track
        if track.director == user:
            logger.debug(f"User {user.email} is director of track {track.id} - allowing track management")
            return True
        
        # Check if user has program_director role
        # Program directors can manage any track (consistent with how they can see all tracks)
        from users.models import UserRole, Role
        director_role = Role.objects.filter(name='program_director').first()
        if director_role:
            has_director_role = UserRole.objects.filter(
                user=user,
                role=director_role,
                is_active=True
            ).exists()
            
            if has_director_role:
                logger.debug(f"User {user.email} has program_director role - allowing track management")
                return True
        
        logger.debug(f"User {user.email} cannot manage track {track.id} - track director: {track.director}, user: {user}")
        return False
    
    @staticmethod
    def can_manage_cohort(user: User, cohort: Cohort) -> bool:
        """Check if user can manage a cohort."""
        if user.is_staff:
            logger.debug(f"User {user.email} is staff - allowing cohort management")
            return True
        
        # Safety check: cohort must have a track
        if not cohort.track:
            logger.warning(f"Cohort {cohort.id} has no track assigned")
            return False
        
        # Check if user is the direct director of the cohort's track
        if cohort.track.director == user:
            logger.debug(f"User {user.email} is director of track {cohort.track.id} - allowing cohort management")
            return True
        
        # Check if user has program_director role
        # Program directors can manage cohorts (consistent with TrackViewSet behavior)
        from users.models import UserRole, Role
        director_role = Role.objects.filter(name='program_director').first()
        if director_role:
            has_director_role = UserRole.objects.filter(
                user=user,
                role=director_role,
                is_active=True
            ).exists()
            
            if has_director_role:
                logger.debug(f"User {user.email} has program_director role - allowing cohort management")
                # Program directors can manage any cohort (consistent with how they can see all tracks)
                return True
        
        logger.debug(f"User {user.email} cannot manage cohort {cohort.id} - track director: {cohort.track.director}, user: {user}")
        return False
    
    @staticmethod
    @transaction.atomic
    def create_program(
        user: User,
        name: str,
        description: str,
        duration_weeks: int,
        pricing: Dict[str, Any],
        outcomes: List[str],
        **kwargs
    ) -> Program:
        """Create a new program."""
        program = Program.objects.create(
            name=name,
            description=description,
            duration_weeks=duration_weeks,
            pricing=pricing,
            outcomes=outcomes,
            **kwargs
        )
        logger.info(f"Program {program.id} created by director {user.email}")
        return program
    
    @staticmethod
    @transaction.atomic
    def create_track(
        user: User,
        program: Program,
        name: str,
        key: str,
        competencies: List[str],
        missions: List[str],
        **kwargs
    ) -> Track:
        """Create a new track."""
        if not DirectorService.can_manage_program(user, program):
            raise PermissionError("User cannot manage this program")
        
        track = Track.objects.create(
            program=program,
            name=name,
            key=key,
            director=user,
            competencies=competencies,
            missions=missions,
            **kwargs
        )
        logger.info(f"Track {track.id} created by director {user.email}")
        return track
    
    @staticmethod
    @transaction.atomic
    def create_cohort(
        user: User,
        track: Track,
        name: str,
        start_date,
        end_date,
        mode: str,
        seat_cap: int,
        mentor_ratio: float,
        seat_pool: Optional[Dict[str, int]] = None,
        calendar_template_id: Optional[str] = None,
        **kwargs
    ) -> Cohort:
        """Create a new cohort."""
        if not DirectorService.can_manage_track(user, track):
            raise PermissionError("User cannot manage this track")
        
        cohort = Cohort.objects.create(
            track=track,
            name=name,
            start_date=start_date,
            end_date=end_date,
            mode=mode,
            seat_cap=seat_cap,
            mentor_ratio=mentor_ratio,
            seat_pool=seat_pool or {},
            calendar_template_id=calendar_template_id,
            status='draft',
            **kwargs
        )
        logger.info(f"Cohort {cohort.id} created by director {user.email}")
        return cohort
    
    @staticmethod
    @transaction.atomic
    def update_cohort_status(cohort: Cohort, new_status: str, user: User) -> Cohort:
        """Update cohort status with state machine validation."""
        valid_transitions = {
            'draft': ['active'],
            'active': ['running', 'cancelled'],
            'running': ['closing', 'cancelled'],
            'closing': ['closed'],
            'closed': [],  # Terminal state
            'cancelled': []  # Terminal state
        }
        
        current_status = cohort.status
        if new_status not in valid_transitions.get(current_status, []):
            raise ValueError(f"Invalid status transition: {current_status} -> {new_status}")
        
        cohort.status = new_status
        cohort.save()
        
        # Trigger actions based on status
        if new_status == 'closed':
            # Trigger certificate generation and analytics pipeline
            DirectorService._trigger_cohort_closure(cohort, user)
        
        logger.info(f"Cohort {cohort.id} status updated: {current_status} -> {new_status}")
        return cohort
    
    @staticmethod
    def _trigger_cohort_closure(cohort: Cohort, user: User):
        """Trigger cohort closure actions."""
        from programs.services.certificate_service import CertificateService
        # Archive cohort and issue certificates
        result = CertificateService.archive_cohort_and_issue_certificates(cohort)
        logger.info(f"Cohort closure triggered: {result}")
        
        # TODO: Trigger analytics pipeline
        # TODO: Generate closure report
        # TODO: Notify stakeholders
    
    @staticmethod
    @transaction.atomic
    def manage_seat_pool(cohort: Cohort, seat_pool: Dict[str, int], user: User) -> Cohort:
        """Update cohort seat pool allocations."""
        if not DirectorService.can_manage_cohort(user, cohort):
            raise PermissionError("User cannot manage this cohort")
        
        # Validate seat pool totals don't exceed seat_cap
        total_allocated = sum(seat_pool.values())
        if total_allocated > cohort.seat_cap:
            raise ValueError(f"Seat pool total ({total_allocated}) exceeds seat cap ({cohort.seat_cap})")
        
        cohort.seat_pool = seat_pool
        cohort.save()
        logger.info(f"Seat pool updated for cohort {cohort.id}")
        return cohort
    
    @staticmethod
    @transaction.atomic
    def approve_enrollment(enrollment: Enrollment, user: User) -> Enrollment:
        """Approve enrollment (override payment requirement)."""
        if not DirectorService.can_manage_cohort(user, enrollment.cohort):
            raise PermissionError("User cannot manage this cohort")
        
        enrollment.status = 'active'
        enrollment.payment_status = 'waived'  # Director override
        enrollment.save()
        logger.info(f"Enrollment {enrollment.id} approved by director {user.email}")
        return enrollment
    
    @staticmethod
    @transaction.atomic
    def bulk_approve_enrollments(cohort: Cohort, enrollment_ids: List[str], user: User) -> Dict[str, Any]:
        """Bulk approve enrollments."""
        if not DirectorService.can_manage_cohort(user, cohort):
            raise PermissionError("User cannot manage this cohort")
        
        enrollments = Enrollment.objects.filter(
            id__in=enrollment_ids,
            cohort=cohort,
            status='pending_payment'
        )
        
        approved_count = 0
        for enrollment in enrollments:
            enrollment.status = 'active'
            enrollment.payment_status = 'waived'
            enrollment.save()
            approved_count += 1
        
        logger.info(f"Bulk approved {approved_count} enrollments for cohort {cohort.id}")
        return {'approved': approved_count, 'total': len(enrollment_ids)}

    @staticmethod
    @transaction.atomic
    def bulk_update_enrollments_status(
        cohort: Cohort,
        enrollment_ids: List[str],
        new_status: str,
        user: User
    ) -> Dict[str, Any]:
        """Bulk update enrollment status for a cohort."""
        if not DirectorService.can_manage_cohort(user, cohort):
            raise PermissionError("User cannot manage this cohort")

        valid_statuses = {s for s, _ in Enrollment.STATUS_CHOICES}
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status: {new_status}")

        qs = Enrollment.objects.filter(cohort=cohort, id__in=enrollment_ids)

        updated = 0
        for e in qs:
            if new_status == 'active':
                # Equivalent to approve (director override)
                e.status = 'active'
                e.payment_status = 'waived'
            else:
                e.status = new_status
            if new_status == 'completed':
                e.completed_at = timezone.now()
            e.save()
            updated += 1

        logger.info(f"Bulk updated {updated} enrollments to {new_status} for cohort {cohort.id}")
        return {'updated': updated, 'total': len(enrollment_ids), 'status': new_status}

    @staticmethod
    @transaction.atomic
    def bulk_remove_enrollments(cohort: Cohort, enrollment_ids: List[str], user: User) -> Dict[str, Any]:
        """Bulk delete enrollments for a cohort."""
        if not DirectorService.can_manage_cohort(user, cohort):
            raise PermissionError("User cannot manage this cohort")

        qs = Enrollment.objects.filter(cohort=cohort, id__in=enrollment_ids)
        deleted_count = qs.count()
        qs.delete()
        logger.info(f"Bulk removed {deleted_count} enrollments for cohort {cohort.id}")
        return {'deleted': deleted_count, 'total': len(enrollment_ids)}
    
    @staticmethod
    @transaction.atomic
    def bulk_create_enrollments(
        cohort: Cohort,
        user_ids: List[str],
        user: User,
        seat_type: str = 'paid',
        enrollment_type: str = 'director'
    ) -> Dict[str, Any]:
        """Bulk create enrollments for multiple users."""
        if not DirectorService.can_manage_cohort(user, cohort):
            raise PermissionError("User cannot manage this cohort")
        
        from programs.core_services import EnrollmentService
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        
        created = []
        waitlisted = []
        errors = []
        
        for user_id in user_ids:
            try:
                # Convert user_id to int if needed
                if isinstance(user_id, str):
                    try:
                        user_id = int(user_id)
                    except ValueError:
                        errors.append({'user_id': str(user_id), 'error': 'Invalid user ID format'})
                        continue
                
                # Get user
                try:
                    target_user = UserModel.objects.get(id=user_id)
                except UserModel.DoesNotExist:
                    errors.append({'user_id': str(user_id), 'error': 'User not found'})
                    continue
                
                # Create enrollment using EnrollmentService
                enrollment, is_waitlisted, error = EnrollmentService.create_enrollment(
                    user=target_user,
                    cohort=cohort,
                    enrollment_type=enrollment_type,
                    seat_type=seat_type,
                    org=None
                )
                
                if error:
                    errors.append({'user_id': str(user_id), 'error': error})
                elif is_waitlisted:
                    waitlisted.append({
                        'user_id': str(user_id),
                        'waitlist_id': str(enrollment.id) if enrollment else None
                    })
                else:
                    created.append({
                        'id': str(enrollment.id),
                        'user_id': str(user_id),
                        'status': enrollment.status
                    })
                    
            except Exception as e:
                logger.error(f"Error creating enrollment for user {user_id}: {e}")
                errors.append({'user_id': str(user_id), 'error': str(e)})
        
        logger.info(f"Bulk created {len(created)} enrollments, {len(waitlisted)} waitlisted, {len(errors)} errors for cohort {cohort.id}")
        
        return {
            'created': created,
            'waitlisted': waitlisted,
            'errors': errors,
            'requested': len(user_ids),
            'created_count': len(created),
            'waitlisted_count': len(waitlisted),
            'error_count': len(errors)
        }
    
    @staticmethod
    def get_cohort_readiness_analytics(cohort: Cohort) -> Dict[str, Any]:
        """Get cohort readiness dashboard data."""
        enrollments = Enrollment.objects.filter(cohort=cohort, status='active')
        
        # Calculate readiness scores (mock - should come from TalentScope)
        readiness_scores = []
        for enrollment in enrollments:
            # Mock readiness score (0-100)
            readiness_scores.append(75.0)  # TODO: Get from TalentScope
        
        avg_readiness = sum(readiness_scores) / len(readiness_scores) if readiness_scores else 0
        
        # Distribution buckets
        distribution = {
            'excellent': len([s for s in readiness_scores if s >= 90]),
            'good': len([s for s in readiness_scores if 70 <= s < 90]),
            'fair': len([s for s in readiness_scores if 50 <= s < 70]),
            'poor': len([s for s in readiness_scores if s < 50]),
        }
        
        return {
            'cohort_id': str(cohort.id),
            'avg_readiness': round(avg_readiness, 2),
            'distribution': distribution,
            'total_students': len(readiness_scores),
            'trend': []  # TODO: Historical trend data
        }
    
    @staticmethod
    def get_mission_funnel_analytics(cohort: Cohort) -> Dict[str, Any]:
        """Get mission completion funnel analytics."""
        enrollments = Enrollment.objects.filter(cohort=cohort, status='active')
        
        # Mission completion stats (mock - should come from Missions module)
        mission_stats = {
            'total_missions': 20,
            'completed': 150,
            'in_progress': 80,
            'not_started': 170,
            'bottlenecks': [
                {'mission_id': 'SIEM-02', 'stuck_count': 15, 'avg_days_stuck': 5.2},
                {'mission_id': 'SOC-05', 'stuck_count': 8, 'avg_days_stuck': 3.1},
            ],
            'approval_times': {
                'avg_hours': 24.5,
                'p95_hours': 48.0,
            }
        }
        
        return mission_stats
    
    @staticmethod
    def get_portfolio_coverage_heatmap(cohort: Cohort) -> Dict[str, Any]:
        """Get portfolio coverage heatmap by competency."""
        # Mock data - should query Portfolio module
        competencies = cohort.track.competencies or []
        
        heatmap = {}
        for competency in competencies:
            heatmap[competency] = {
                'covered': 0.75,  # Percentage of students with this competency
                'avg_items': 3.2,  # Average portfolio items per student
                'gap_count': 5,  # Students missing this competency
            }
        
        return {
            'cohort_id': str(cohort.id),
            'competencies': heatmap,
            'overall_coverage': 0.68,  # Overall portfolio coverage
        }
    
    @staticmethod
    def get_at_risk_students(cohort: Cohort) -> List[Dict[str, Any]]:
        """Get list of at-risk students."""
        enrollments = Enrollment.objects.filter(cohort=cohort, status='active')
        
        at_risk = []
        for enrollment in enrollments:
            risk_factors = []
            risk_score = 0
            
            # Check engagement (mock - should come from analytics)
            if False:  # Low engagement
                risk_factors.append('low_engagement')
                risk_score += 30
            
            # Check broken streaks (mock)
            if False:  # Broken streak
                risk_factors.append('broken_streak')
                risk_score += 20
            
            # Check payment issues
            if enrollment.payment_status == 'pending':
                risk_factors.append('payment_pending')
                risk_score += 25
            
            # Check low completion
            if enrollment.cohort.completion_rate < 50:
                risk_factors.append('low_completion')
                risk_score += 25
            
            if risk_score > 0:
                at_risk.append({
                    'enrollment_id': str(enrollment.id),
                    'user_id': str(enrollment.user.id),
                    'user_email': enrollment.user.email,
                    'risk_score': risk_score,
                    'risk_factors': risk_factors,
                })
        
        return sorted(at_risk, key=lambda x: x['risk_score'], reverse=True)
    
    @staticmethod
    @transaction.atomic
    def assign_mentor(
        cohort: Cohort,
        mentor: User,
        mentee: User,
        is_primary: bool = True,
        user: User = None
    ) -> MentorAssignment:
        """Assign mentor to mentee."""
        if user and not DirectorService.can_manage_cohort(user, cohort):
            raise PermissionError("User cannot manage this cohort")
        
        # Check if assignment already exists
        existing = MentorAssignment.objects.filter(
            cohort=cohort,
            mentor=mentor,
            mentee=mentee,
            active=True
        ).first()
        
        if existing:
            existing.is_primary = is_primary
            existing.save()
            return existing
        
        assignment = MentorAssignment.objects.create(
            cohort=cohort,
            mentor=mentor,
            mentee=mentee,
            is_primary=is_primary,
            active=True
        )
        logger.info(f"Mentor {mentor.email} assigned to {mentee.email} in cohort {cohort.id}")
        return assignment
    
    @staticmethod
    def get_mentor_workload(cohort: Cohort) -> List[Dict[str, Any]]:
        """Get mentor workload analysis."""
        assignments = MentorAssignment.objects.filter(
            cohort=cohort,
            active=True
        ).values('mentor').annotate(
            mentee_count=Count('mentee'),
            primary_count=Count('id', filter=Q(is_primary=True))
        )
        
        workload = []
        for assignment in assignments:
            mentor = User.objects.get(id=assignment['mentor'])
            workload.append({
                'mentor_id': str(mentor.id),
                'mentor_email': mentor.email,
                'mentee_count': assignment['mentee_count'],
                'primary_count': assignment['primary_count'],
                'is_overloaded': assignment['mentee_count'] > (cohort.mentor_ratio * 10),  # Threshold
            })
        
        return workload
    
    @staticmethod
    @transaction.atomic
    def rebalance_mentors(cohort: Cohort, user: User) -> Dict[str, Any]:
        """Rebalance mentor assignments to optimize workload."""
        if not DirectorService.can_manage_cohort(user, cohort):
            raise PermissionError("User cannot manage this cohort")
        
        workload = DirectorService.get_mentor_workload(cohort)
        overloaded = [w for w in workload if w['is_overloaded']]
        
        # TODO: Implement rebalancing algorithm
        # For now, return analysis
        return {
            'overloaded_count': len(overloaded),
            'recommendations': [
                f"Mentor {w['mentor_email']} has {w['mentee_count']} mentees (recommended: {int(cohort.mentor_ratio * 10)})"
                for w in overloaded
            ]
        }
    
    @staticmethod
    def generate_cohort_closure_pack(cohort: Cohort) -> Dict[str, Any]:
        """Generate cohort closure report pack."""
        enrollments = Enrollment.objects.filter(cohort=cohort)
        
        stats = {
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'total_enrolled': enrollments.count(),
            'completed': enrollments.filter(status='completed').count(),
            'incomplete': enrollments.filter(status='incomplete').count(),
            'avg_readiness': DirectorService.get_cohort_readiness_analytics(cohort)['avg_readiness'],
            'completion_rate': cohort.completion_rate,
            'certificates_issued': Certificate.objects.filter(enrollment__cohort=cohort).count(),
            'closure_date': timezone.now().isoformat(),
        }
        
        return stats
    
    @staticmethod
    def export_cohort_data(cohort: Cohort, format: str = 'json') -> bytes:
        """Export cohort data in specified format."""
        enrollments = Enrollment.objects.filter(cohort=cohort)
        
        data = []
        for enrollment in enrollments:
            data.append({
                'user_id': str(enrollment.user.id),
                'email': enrollment.user.email,
                'status': enrollment.status,
                'payment_status': enrollment.payment_status,
                'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                'completed_at': enrollment.completed_at.isoformat() if enrollment.completed_at else None,
            })
        
        if format == 'json':
            import json
            return json.dumps(data, indent=2).encode('utf-8')
        elif format == 'csv':
            import csv
            import io
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=data[0].keys() if data else [])
            writer.writeheader()
            writer.writerows(data)
            return output.getvalue().encode('utf-8')
        else:
            raise ValueError(f"Unsupported format: {format}")

