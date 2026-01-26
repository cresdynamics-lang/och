"""
Services for Sponsor Dashboard data aggregation and cache management.
"""
import os
import requests
from decimal import Decimal
from typing import Dict, List, Any, Optional
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from django.db import transaction
from organizations.models import Organization
from programs.models import Cohort, Enrollment
from users.models import ConsentScope
from .models import (
    SponsorDashboardCache,
    SponsorCohortDashboard,
    SponsorStudentAggregates,
    SponsorCode
)


class SponsorDashboardService:
    """Service for sponsor dashboard cache management."""
    
    @staticmethod
    def refresh_sponsor_cache(org_id: int, sync_students: bool = True) -> SponsorDashboardCache:
        """
        Refresh sponsor dashboard cache for an organization.
        Aggregates data from cohorts, enrollments, and external services.
        """
        try:
            org = Organization.objects.get(id=org_id, org_type='sponsor')
        except Organization.DoesNotExist:
            raise ValueError(f"Organization {org_id} not found or not a sponsor")
        
        # Get sponsored cohorts
        sponsored_cohorts = Cohort.objects.filter(
            enrollments__org=org,
            enrollments__seat_type='sponsored'
        ).distinct()
        
        # Calculate seat metrics
        enrollments = Enrollment.objects.filter(
            org=org,
            seat_type='sponsored'
        )
        
        seats_total = enrollments.count()
        seats_used = enrollments.filter(status='active').count()
        
        # Calculate seats at risk (students with low completion)
        # Count enrollments that are active but not completed
        # For now, we'll use a simpler heuristic: active enrollments in cohorts that are past halfway point
        seats_at_risk = 0
        active_enrollments = enrollments.filter(status='active')
        for enrollment in active_enrollments:
            cohort = enrollment.cohort
            if cohort and cohort.start_date and cohort.end_date:
                total_days = (cohort.end_date - cohort.start_date).days
                days_elapsed = (timezone.now().date() - cohort.start_date).days
                if total_days > 0 and (days_elapsed / total_days) > 0.5:
                    # Past halfway, consider at risk if not completed
                    seats_at_risk += 1
        
        # Get financial metrics from billing service
        billing_metrics = BillingService.get_sponsor_metrics(org.id)
        budget_total = billing_metrics.get('total', Decimal('0.00'))
        budget_used = billing_metrics.get('used', Decimal('0.00'))
        overdue_invoices_count = billing_metrics.get('overdue', 0)
        
        # Get talent metrics from TalentScope service (aggregates only)
        talent_metrics = TalentScopeService.get_sponsor_aggregates(org.id)
        avg_readiness = Decimal(str(talent_metrics.get('avg_readiness', 0)))
        avg_completion_pct = Decimal(str(talent_metrics.get('avg_completion', 0)))
        
        # Also calculate from student aggregates if available
        aggregates = SponsorStudentAggregates.objects.filter(org=org)
        if aggregates.exists():
            aggregate_readiness = aggregates.aggregate(avg=Avg('readiness_score'))['avg']
            aggregate_completion_pct_val = aggregates.aggregate(avg=Avg('completion_pct'))['avg']
            if aggregate_readiness is not None:
                avg_readiness = Decimal(str(aggregate_readiness))
            if aggregate_completion_pct_val is not None:
                avg_completion_pct = Decimal(str(aggregate_completion_pct_val))
        
        graduates_count = 0
        active_cohorts_count = sponsored_cohorts.filter(
            status__in=['active', 'running']
        ).count()
        
        # Count graduates (completed enrollments)
        graduates_count = enrollments.filter(status='completed').count()
        
        # Calculate budget percentage
        budget_used_pct = Decimal('0.00')
        if budget_total > 0:
            budget_used_pct = (budget_used / budget_total) * 100
        
        # Count low utilization cohorts
        low_utilization_cohorts = 0
        for cohort in sponsored_cohorts:
            try:
                # Try to get seat utilization (property or calculate)
                if hasattr(cohort, 'seat_utilization'):
                    utilization = getattr(cohort, 'seat_utilization', 0)
                    if isinstance(utilization, (int, float)) and utilization < 50:
                        low_utilization_cohorts += 1
                else:
                    # Calculate utilization manually if property doesn't exist
                    total_seats = getattr(cohort, 'seat_cap', 0) or 0
                    used_seats = enrollments.filter(cohort=cohort, status='active').count()
                    utilization = (used_seats / total_seats * 100) if total_seats > 0 else 0
                    if utilization < 50:
                        low_utilization_cohorts += 1
            except (AttributeError, ZeroDivisionError, TypeError):
                # Skip if we can't calculate utilization
                pass
        
        # Sync student aggregates if requested
        if sync_students:
            try:
                SponsorDashboardService.sync_student_aggregates(org_id)
            except Exception:
                pass  # Don't fail cache refresh if student sync fails
        
        # Create or update cache
        cache, created = SponsorDashboardCache.objects.update_or_create(
            org=org,
            defaults={
                'seats_total': seats_total,
                'seats_used': seats_used,
                'seats_at_risk': seats_at_risk,
                'budget_total': budget_total,
                'budget_used': budget_used,
                'budget_used_pct': budget_used_pct,
                'avg_readiness': avg_readiness,
                'avg_completion_pct': avg_completion_pct,
                'graduates_count': graduates_count,
                'active_cohorts_count': active_cohorts_count,
                'overdue_invoices_count': overdue_invoices_count,
                'low_utilization_cohorts': low_utilization_cohorts,
                'cache_updated_at': timezone.now(),
            }
        )
        
        return cache
    
    @staticmethod
    def refresh_cohort_details(org_id: int, cohort_id: str) -> SponsorCohortDashboard:
        """
        Refresh sponsor cohort dashboard details.
        """
        try:
            org = Organization.objects.get(id=org_id, org_type='sponsor')
        except Organization.DoesNotExist:
            raise ValueError(f"Organization {org_id} not found or not a sponsor")
        
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            raise ValueError(f"Cohort {cohort_id} not found")
        
        # Get sponsor enrollments for this cohort
        sponsor_enrollments = Enrollment.objects.filter(
            org=org,
            cohort=cohort,
            seat_type='sponsored'
        )
        
        seats_total = getattr(cohort, 'seat_cap', 0) or 0
        seats_used = sponsor_enrollments.filter(status='active').count()
        seats_sponsored = sponsor_enrollments.count()
        seats_remaining = max(0, seats_total - seats_used) if seats_total else 0
        
        # Calculate progress metrics
        student_aggregates = SponsorStudentAggregates.objects.filter(
            org=org,
            cohort=cohort
        )
        
        avg_readiness = None
        completion_pct = None
        portfolio_health_avg = None
        
        if student_aggregates.exists():
            avg_readiness = student_aggregates.aggregate(
                avg=Avg('readiness_score')
            )['avg']
            completion_pct = student_aggregates.aggregate(
                avg=Avg('completion_pct')
            )['avg']
        
        # Count graduates and at-risk
        graduates_count = sponsor_enrollments.filter(status='completed').count()
        at_risk_count = sponsor_enrollments.filter(
            status='active'
        ).count()  # TODO: Calculate actual at-risk based on completion < 50%
        
        # Get next milestone (from cohort calendar events)
        next_milestone = {}
        upcoming_events = []
        
        try:
            # Try to access calendar_events if it exists
            if hasattr(cohort, 'calendar_events'):
                next_event = cohort.calendar_events.filter(
                    status='scheduled',
                    start_ts__gte=timezone.now()
                ).order_by('start_ts').first()
                
                if next_event:
                    next_milestone = {
                        'title': next_event.title,
                        'date': next_event.start_ts.isoformat(),
                        'type': getattr(next_event, 'type', 'milestone'),
                    }
                
                # Get upcoming events
                upcoming_events = list(
                    cohort.calendar_events.filter(
                        status='scheduled',
                        start_ts__gte=timezone.now()
                    ).order_by('start_ts')[:5].values('title', 'start_ts', 'type')
                )
        except (AttributeError, Exception):
            # Calendar events not available, use empty defaults
            pass
        
        # Compute flags
        flags = []
        if completion_pct and completion_pct < 50:
            flags.append('low_completion')
        if seats_used < seats_total * 0.5:
            flags.append('low_utilization')
        
        # Create or update cohort dashboard
        dashboard, created = SponsorCohortDashboard.objects.update_or_create(
            org=org,
            cohort=cohort,
            defaults={
                'cohort_name': getattr(cohort, 'name', 'Unknown Cohort'),
                'track_name': cohort.track.name if hasattr(cohort, 'track') and cohort.track else '',
                'start_date': getattr(cohort, 'start_date', None),
                'end_date': getattr(cohort, 'end_date', None),
                'mode': getattr(cohort, 'mode', ''),
                'seats_total': seats_total,
                'seats_used': seats_used,
                'seats_sponsored': seats_sponsored,
                'seats_remaining': seats_remaining,
                'avg_readiness': avg_readiness,
                'completion_pct': completion_pct,
                'portfolio_health_avg': portfolio_health_avg,
                'graduates_count': graduates_count,
                'at_risk_count': at_risk_count,
                'next_milestone': next_milestone,
                'upcoming_events': upcoming_events,
                'flags': flags,
                'updated_at': timezone.now(),
            }
        )
        
        return dashboard


class SponsorCodeService:
    """Service for sponsor code generation and management."""
    
    @staticmethod
    def generate_code(org_id: int, seats: int, **kwargs) -> SponsorCode:
        """
        Generate a sponsor code.
        Format: SPNSR-{ORG_SLUG[:3].upper()}-{RANDOM}-{YEAR}
        """
        org = Organization.objects.get(id=org_id)
        
        import random
        import string
        year = timezone.now().year
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        org_prefix = org.slug[:3].upper() if org.slug else 'SPN'
        code = f"SPNSR-{org_prefix}-{random_part}-{year}"
        
        # Ensure uniqueness
        while SponsorCode.objects.filter(code=code).exists():
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code = f"SPNSR-{org_prefix}-{random_part}-{year}"
        
        sponsor_code = SponsorCode.objects.create(
            org=org,
            code=code,
            seats=seats,
            value_per_seat=kwargs.get('value_per_seat'),
            valid_from=kwargs.get('valid_from'),
            valid_until=kwargs.get('valid_until'),
            max_usage=kwargs.get('max_usage'),
        )
        
        return sponsor_code
    
    @staticmethod
    def redeem_code(code: str, cohort_id: str, user_ids: List[str]) -> Dict[str, Any]:
        """
        Redeem a sponsor code and assign seats.
        """
        try:
            sponsor_code = SponsorCode.objects.get(code=code, status='active')
        except SponsorCode.DoesNotExist:
            raise ValueError("Invalid or expired sponsor code")
        
        if not sponsor_code.is_valid:
            raise ValueError("Sponsor code is not valid")
        
        if sponsor_code.max_usage and sponsor_code.usage_count >= sponsor_code.max_usage:
            raise ValueError("Sponsor code has reached maximum usage")
        
        if len(user_ids) > sponsor_code.seats:
            raise ValueError(f"Too many users. Code provides {sponsor_code.seats} seats")
        
        cohort = Cohort.objects.get(id=cohort_id)
        
        # Assign seats
        assigned = []
        with transaction.atomic():
            for user_id in user_ids[:sponsor_code.seats]:
                enrollment, created = Enrollment.objects.get_or_create(
                    cohort=cohort,
                    user_id=user_id,
                    defaults={
                        'org': sponsor_code.org,
                        'enrollment_type': 'sponsor',
                        'seat_type': 'sponsored',
                        'payment_status': 'waived',
                        'status': 'active',
                    }
                )
                assigned.append(enrollment.id)
            
            # Increment usage count
            sponsor_code.usage_count += len(assigned)
            sponsor_code.save(update_fields=['usage_count'])
        
        return {
            'code': sponsor_code.code,
            'seats_assigned': len(assigned),
            'enrollment_ids': assigned,
        }


class TalentScopeService:
    """Mock service for TalentScope integration."""
    
    @staticmethod
    def get_sponsor_aggregates(org_id: int) -> Dict[str, Any]:
        """
        Get sponsor talent aggregates from TalentScope service.
        Returns aggregate metrics only (no PII).
        """
        api_url = os.environ.get('TALENTSCOPE_API_URL', 'http://localhost:8002/api/v1')
        api_key = os.environ.get('TALENTSCOPE_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/sponsor/{org_id}/aggregates",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    return response.json()
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data
        return {
            'avg_readiness': 72.4,
            'avg_completion': 68.2,
        }


class BillingService:
    """Mock service for billing integration."""
    
    @staticmethod
    def get_sponsor_metrics(org_id: int) -> Dict[str, Any]:
        """
        Get sponsor billing metrics.
        """
        api_url = os.environ.get('BILLING_API_URL', 'http://localhost:8003/api/v1')
        api_key = os.environ.get('BILLING_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/sponsors/{org_id}/metrics",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    return response.json()
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data
        return {
            'total': Decimal('60000.00'),
            'used': Decimal('45000.00'),
            'overdue': 2,
        }
    
    @staticmethod
    def sync_student_aggregates(org_id: int, cohort_id: Optional[str] = None):
        """
        Sync student aggregates from enrollments and TalentScope.
        Checks consent_employer_share from ConsentScope model.
        """
        try:
            org = Organization.objects.get(id=org_id, org_type='sponsor')
        except Organization.DoesNotExist:
            raise ValueError(f"Organization {org_id} not found or not a sponsor")
        
        # Get sponsored enrollments
        enrollments = Enrollment.objects.filter(
            org=org,
            seat_type='sponsored'
        )
        
        if cohort_id:
            enrollments = enrollments.filter(cohort_id=cohort_id)
        
        # Sync each student's aggregate data
        for enrollment in enrollments:
            student = enrollment.user
            cohort = enrollment.cohort
            
            # Check consent_employer_share from ConsentScope
            consent_employer_share = ConsentScope.objects.filter(
                user=student,
                scope_type='employer_share',
                granted=True,
                expires_at__isnull=True
            ).exists()
            
            # Get readiness and completion from TalentScope or student dashboard
            readiness_score = None
            completion_pct = None
            portfolio_items = 0
            
            # Try to get from TalentScope
            talent_data = TalentScopeService.get_sponsor_aggregates(org.id)
            # For individual student, would need a different endpoint
            # For now, use enrollment status to estimate completion
            if enrollment.status == 'completed':
                completion_pct = Decimal('100.00')
            elif enrollment.status == 'active':
                # Estimate based on cohort progress
                completion_pct = Decimal(str(cohort.completion_rate)) if hasattr(cohort, 'completion_rate') else None
            
            # Count portfolio items (with consent check)
            try:
                from progress.models import PortfolioItem
                portfolio_items = PortfolioItem.objects.filter(user=student).count()
            except ImportError:
                pass
            
            # Anonymize name if no consent
            if consent_employer_share:
                name_anonymized = f"{student.first_name} {student.last_name}".strip() or student.email
            else:
                # Generate anonymized name
                student_num = enrollment.id.hex[:8] if hasattr(enrollment.id, 'hex') else str(enrollment.id)[:8]
                name_anonymized = f"Student #{student_num}"
            
            # Create or update aggregate
            SponsorStudentAggregates.objects.update_or_create(
                org=org,
                cohort=cohort,
                student=student,
                defaults={
                    'name_anonymized': name_anonymized,
                    'readiness_score': readiness_score,
                    'completion_pct': completion_pct,
                    'portfolio_items': portfolio_items,
                    'consent_employer_share': consent_employer_share,
                    'updated_at': timezone.now(),
                }
            )

