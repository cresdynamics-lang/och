"""
Director Dashboard Service - Aggregation and cache management.
"""
from django.db.models import Q, Count, Avg, Sum, F
from django.utils import timezone
from decimal import Decimal
from typing import Dict, List, Any, Optional
import logging

from programs.models import Program, Track, Cohort, Enrollment, MentorAssignment
from programs.services.director_service import DirectorService
from .models import DirectorDashboardCache, DirectorCohortHealth
from .monitoring import track_performance

logger = logging.getLogger(__name__)


class DirectorDashboardService:
    """Service for director dashboard data aggregation."""
    
    @staticmethod
    def refresh_director_cache(director_id: int) -> DirectorDashboardCache:
        """
        Refresh director dashboard cache.
        
        Args:
            director_id: User ID of the director
        
        Returns:
            DirectorDashboardCache instance
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            director = User.objects.get(id=director_id)
        except User.DoesNotExist:
            raise ValueError(f"Director {director_id} not found")
        
        # Get director's programs and cohorts
        programs = DirectorService.get_director_programs(director)
        cohorts = DirectorService.get_director_cohorts(director)
        
        active_programs = programs.filter(status='active').count()
        active_cohorts = cohorts.filter(status__in=['active', 'running']).count()
        
        # Calculate seat metrics
        total_seats = sum(c.seat_cap for c in cohorts)
        seats_used = Enrollment.objects.filter(
            cohort__in=cohorts,
            status='active'
        ).count()
        seats_pending = Enrollment.objects.filter(
            cohort__in=cohorts,
            status='pending_payment'
        ).count()
        
        # Calculate average readiness (mock - should come from TalentScope)
        readiness_scores = []
        for cohort in cohorts:
            enrollments = Enrollment.objects.filter(cohort=cohort, status='active')
            for enrollment in enrollments:
                readiness_scores.append(75.0)  # TODO: Get from TalentScope
        
        avg_readiness = sum(readiness_scores) / len(readiness_scores) if readiness_scores else Decimal('0.00')
        
        # Calculate average completion rate
        completion_rates = [c.completion_rate for c in cohorts if c.completion_rate > 0]
        avg_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else Decimal('0.00')
        
        # Count cohorts at risk (completion < 60% or readiness < 60)
        # Note: completion_rate is a property, so we need to calculate it manually
        cohorts_at_risk = 0
        for cohort in cohorts:
            if cohort.completion_rate < 60 or cohort.status == 'running':
                cohorts_at_risk += 1
        
        # Count mentors over capacity
        mentors_over_capacity = 0
        for cohort in cohorts:
            workload = DirectorService.get_mentor_workload(cohort)
            mentors_over_capacity += len([w for w in workload if w['is_overloaded']])
        
        # Count mission bottlenecks (mock - should come from Missions module)
        mission_bottlenecks = 4  # TODO: Query Missions module
        
        # Count payment overdue seats
        payment_overdue_seats = Enrollment.objects.filter(
            cohort__in=cohorts,
            payment_status='overdue'
        ).count()
        
        # Create or update cache
        cache, created = DirectorDashboardCache.objects.get_or_create(
            director=director,
            defaults={
                'active_programs_count': active_programs,
                'active_cohorts_count': active_cohorts,
                'total_seats': total_seats,
                'seats_used': seats_used,
                'seats_pending': seats_pending,
                'avg_readiness': avg_readiness,
                'avg_completion_rate': avg_completion_rate,
                'cohorts_at_risk': cohorts_at_risk,
                'mentors_over_capacity': mentors_over_capacity,
                'mission_bottlenecks': mission_bottlenecks,
                'payment_overdue_seats': payment_overdue_seats,
            }
        )
        
        if not created:
            cache.active_programs_count = active_programs
            cache.active_cohorts_count = active_cohorts
            cache.total_seats = total_seats
            cache.seats_used = seats_used
            cache.seats_pending = seats_pending
            cache.avg_readiness = avg_readiness
            cache.avg_completion_rate = avg_completion_rate
            cache.cohorts_at_risk = cohorts_at_risk
            cache.mentors_over_capacity = mentors_over_capacity
            cache.mission_bottlenecks = mission_bottlenecks
            cache.payment_overdue_seats = payment_overdue_seats
            cache.save()
        
        # Refresh cohort health records
        DirectorDashboardService.refresh_cohort_health(director, cohorts)
        
        logger.info(f"Refreshed dashboard cache for director {director.email}")
        return cache
    
    @staticmethod
    def refresh_cohort_health(director, cohorts: List[Cohort]):
        """Refresh cohort health records."""
        for cohort in cohorts:
            enrollments = Enrollment.objects.filter(cohort=cohort, status='active')
            seats_used_total = enrollments.count()
            
            # Calculate readiness (mock)
            readiness_avg = 75.0  # TODO: Get from TalentScope
            
            # Get completion percentage
            completion_pct = cohort.completion_rate
            
            # Calculate mentor coverage
            mentor_assignments = MentorAssignment.objects.filter(
                cohort=cohort,
                active=True
            ).count()
            mentor_coverage_pct = (mentor_assignments / seats_used_total * 100) if seats_used_total > 0 else 0
            
            # Calculate risk score (0-10)
            risk_score = 0.0
            risk_flags = []
            
            if completion_pct < 60:
                risk_score += 3.0
                risk_flags.append('low_completion')
            
            if readiness_avg < 60:
                risk_score += 2.0
                risk_flags.append('low_readiness')
            
            # Check mentor overload
            workload = DirectorService.get_mentor_workload(cohort)
            overloaded = [w for w in workload if w['is_overloaded']]
            if overloaded:
                risk_score += 2.0
                risk_flags.append('mentor_overload')
            
            # Check seat utilization
            utilization = cohort.seat_utilization
            if utilization < 50:
                risk_score += 1.0
                risk_flags.append('low_utilization')
            
            # Get next milestone (mock)
            next_milestone = {
                'title': 'Portfolio Submission',
                'date': cohort.end_date.isoformat() if cohort.end_date else None,
            }
            
            # Create or update health record
            DirectorCohortHealth.objects.update_or_create(
                director=director,
                cohort=cohort,
                defaults={
                    'cohort_name': cohort.name,
                    'seats_used_total': seats_used_total,
                    'readiness_avg': readiness_avg,
                    'completion_pct': completion_pct,
                    'mentor_coverage_pct': mentor_coverage_pct,
                    'risk_score': risk_score,
                    'next_milestone': next_milestone,
                    'risk_flags': risk_flags,
                }
            )
    
    @staticmethod
    @track_performance
    def get_dashboard_data(director_id: int) -> Dict[str, Any]:
        """Get complete dashboard data."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        director = User.objects.get(id=director_id)
        
        # Get or refresh cache
        cache, created = DirectorDashboardCache.objects.get_or_create(director=director)
        
        # Refresh if cache is stale (>5 minutes)
        if (timezone.now() - cache.cache_updated_at).total_seconds() > 300:
            cache = DirectorDashboardService.refresh_director_cache(director_id)
        
        # Build hero metrics
        hero = {
            'active_programs': cache.active_programs_count,
            'active_cohorts': cache.active_cohorts_count,
            'seats_used': f"{cache.seats_used}/{cache.total_seats} ({int(cache.seats_used / cache.total_seats * 100) if cache.total_seats > 0 else 0}%)",
            'avg_readiness': float(cache.avg_readiness),
            'completion_rate': f"{cache.avg_completion_rate:.1f}%",
        }
        
        # Build alerts
        alerts = []
        
        # High priority: Cohorts at risk
        cohorts = DirectorService.get_director_cohorts(director)
        at_risk_cohorts = DirectorCohortHealth.objects.filter(
            director=director,
            risk_score__gte=7.0
        )[:3]
        
        for health in at_risk_cohorts:
            alerts.append({
                'priority': 'high',
                'title': f"{health.cohort_name}: {health.completion_pct:.1f}% completion (Week 8 expected: 82%)",
                'action': 'View Cohort',
                'cohort_id': str(health.cohort.id),
            })
        
        # Medium priority: Mentor overload
        if cache.mentors_over_capacity > 0:
            alerts.append({
                'priority': 'medium',
                'title': f"{cache.mentors_over_capacity} mentors over capacity (112% utilization)",
                'action': 'Rebalance Mentors',
            })
        
        # Medium priority: Payment overdue
        if cache.payment_overdue_seats > 0:
            alerts.append({
                'priority': 'medium',
                'title': f"{cache.payment_overdue_seats} seats with overdue payments",
                'action': 'Review Payments',
            })
        
        # Quick stats
        quick_stats = {
            'missions_bottlenecked': cache.mission_bottlenecks,
            'seats_overdue': cache.payment_overdue_seats,
            'graduates_ready': 0,  # TODO: Calculate from completed enrollments
        }
        
        return {
            'hero': hero,
            'alerts': alerts,
            'quick_stats': quick_stats,
        }
    
    @staticmethod
    def get_cohorts_table(director_id: int, risk_level: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get cohorts table data."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        director = User.objects.get(id=director_id)
        
        # Get cohort health records
        health_records = DirectorCohortHealth.objects.filter(director=director)
        
        if risk_level == 'high':
            health_records = health_records.filter(risk_score__gte=7.0)
        elif risk_level == 'medium':
            health_records = health_records.filter(risk_score__gte=4.0, risk_score__lt=7.0)
        elif risk_level == 'low':
            health_records = health_records.filter(risk_score__lt=4.0)
        
        health_records = health_records[:limit]
        
        # Serialize
        cohorts_data = []
        for health in health_records:
            cohort = health.cohort
            cohorts_data.append({
                'cohort_id': str(cohort.id),
                'name': health.cohort_name,
                'seats_used': f"{health.seats_used_total}/{cohort.seat_cap}",
                'readiness': float(health.readiness_avg),
                'completion': f"{health.completion_pct:.1f}%",
                'mentor_coverage': f"{health.mentor_coverage_pct:.1f}%",
                'risk_score': float(health.risk_score),
                'next_milestone': health.next_milestone.get('title', 'N/A'),
                'risk_flags': health.risk_flags,
            })
        
        return cohorts_data

