"""
Director Dashboard Services
Aggregates data from multiple modules for director dashboard.
"""
import logging
from django.db.models import Q, Count, Avg, Sum, F, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
from programs.models import Program, Track, Cohort, Enrollment, CalendarEvent, MentorAssignment
from programs.director_dashboard_models import DirectorDashboardCache, DirectorCohortDashboard
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class DirectorDashboardAggregationService:
    """
    Aggregates data from multiple services for director dashboard.
    """
    
    @staticmethod
    def get_director_programs(director):
        """Get all programs a director manages."""
        if director.is_staff:
            return Program.objects.filter(status='active')
        return Program.objects.filter(
            tracks__director=director,
            status='active'
        ).distinct()
    
    @staticmethod
    def get_director_cohorts(director):
        """Get all cohorts a director manages."""
        programs = DirectorDashboardAggregationService.get_director_programs(director)
        program_ids = programs.values_list('id', flat=True)
        
        if director.is_staff:
            cohorts = Cohort.objects.filter(
                track__program_id__in=program_ids,
                status__in=['active', 'running']
            )
        else:
            cohorts = Cohort.objects.filter(
                Q(track__program_id__in=program_ids) | Q(mentor_assignments__mentor=director),
                status__in=['active', 'running']
            ).distinct()
        
        return cohorts
    
    @staticmethod
    def aggregate_program_metrics(director):
        """Aggregate program-level metrics."""
        programs = DirectorDashboardAggregationService.get_director_programs(director)
        cohorts = DirectorDashboardAggregationService.get_director_cohorts(director)
        
        active_programs_count = programs.count()
        active_cohorts_count = cohorts.count()
        
        # Seat metrics
        total_seats = sum(c.seat_cap for c in cohorts)
        seats_used = sum(
            c.enrollments.filter(status='active').count() 
            for c in cohorts
        )
        seats_pending = Enrollment.objects.filter(
            cohort__in=cohorts,
            status='active',
            payment_status='pending'
        ).count()
        
        return {
            'active_programs_count': active_programs_count,
            'active_cohorts_count': active_cohorts_count,
            'total_seats': total_seats,
            'seats_used': seats_used,
            'seats_pending': seats_pending,
        }
    
    @staticmethod
    def aggregate_talent_metrics(director):
        """Aggregate TalentScope analytics (readiness, completion, portfolio)."""
        cohorts = DirectorDashboardAggregationService.get_director_cohorts(director)
        
        # TODO: Replace with actual TalentScope service calls
        # For now, calculate from cohort completion rates
        completion_rates = [
            c.completion_rate for c in cohorts 
            if c.completion_rate is not None
        ]
        avg_completion_rate = (
            sum(completion_rates) / len(completion_rates) 
            if completion_rates else 0
        )
        
        # Mock readiness scores (should come from TalentScope)
        avg_readiness_score = 65.0  # TODO: Aggregate from student_dashboard_cache
        
        # Mock portfolio health (should come from Portfolio Engine)
        avg_portfolio_health = 70.0  # TODO: Aggregate from portfolio data
        
        # Mock mission approval time (should come from Missions MXP)
        avg_mission_approval_time_minutes = None  # TODO: Calculate from mission submissions
        
        return {
            'avg_readiness_score': avg_readiness_score,
            'avg_completion_rate': avg_completion_rate,
            'avg_portfolio_health': avg_portfolio_health,
            'avg_mission_approval_time_minutes': avg_mission_approval_time_minutes,
        }
    
    @staticmethod
    def aggregate_mentorship_metrics(director):
        """Aggregate Mentorship OS metrics."""
        cohorts = DirectorDashboardAggregationService.get_director_cohorts(director)
        
        # Get all mentor assignments
        mentor_assignments = MentorAssignment.objects.filter(
            cohort__in=cohorts,
            active=True
        ).select_related('mentor', 'cohort')
        
        # Calculate mentor coverage
        total_cohorts = cohorts.count()
        cohorts_with_mentors = cohorts.filter(
            mentor_assignments__active=True
        ).distinct().count()
        mentor_coverage_pct = (
            (cohorts_with_mentors / total_cohorts * 100) 
            if total_cohorts > 0 else 0
        )
        
        # Mock session completion (should come from Mentorship OS)
        mentor_session_completion_pct = 85.0  # TODO: Calculate from session data
        
        # Mock mentors over capacity (should come from Mentorship OS)
        mentors_over_capacity_count = 0  # TODO: Check mentor capacity vs assignments
        
        # Mock at-risk mentees (should come from Mentorship OS)
        mentee_at_risk_count = 0  # TODO: Calculate from mentorship risk signals
        
        return {
            'mentor_coverage_pct': mentor_coverage_pct,
            'mentor_session_completion_pct': mentor_session_completion_pct,
            'mentors_over_capacity_count': mentors_over_capacity_count,
            'mentee_at_risk_count': mentee_at_risk_count,
        }
    
    @staticmethod
    def aggregate_alert_metrics(director):
        """Aggregate alert and flag counts."""
        cohorts = DirectorDashboardAggregationService.get_director_cohorts(director)
        
        # Cohorts flagged (low completion, low readiness, etc.)
        cohorts_flagged = 0
        for cohort in cohorts:
            enrolled_count = cohort.enrollments.filter(status='active').count()
            utilization = (enrolled_count / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0
            
            if (cohort.completion_rate or 0) < 50:
                cohorts_flagged += 1
            elif utilization < 60 and enrolled_count > 0:
                cohorts_flagged += 1
            elif utilization >= 95:
                cohorts_flagged += 1
        
        # Mock other flags (should come from respective services)
        mentors_flagged_count = 0  # TODO: From Mentorship OS
        missions_bottlenecked_count = 0  # TODO: From Missions MXP
        payments_overdue_count = Enrollment.objects.filter(
            cohort__in=cohorts,
            payment_status='pending',
            status='active'
        ).count()
        
        return {
            'cohorts_flagged_count': cohorts_flagged,
            'mentors_flagged_count': mentors_flagged_count,
            'missions_bottlenecked_count': missions_bottlenecked_count,
            'payments_overdue_count': payments_overdue_count,
        }
    
    @staticmethod
    def refresh_director_cache(director):
        """Refresh director dashboard cache with aggregated data."""
        try:
            program_metrics = DirectorDashboardAggregationService.aggregate_program_metrics(director)
            talent_metrics = DirectorDashboardAggregationService.aggregate_talent_metrics(director)
            mentorship_metrics = DirectorDashboardAggregationService.aggregate_mentorship_metrics(director)
            alert_metrics = DirectorDashboardAggregationService.aggregate_alert_metrics(director)
            
            cache_data = {
                **program_metrics,
                **talent_metrics,
                **mentorship_metrics,
                **alert_metrics,
                'cache_updated_at': timezone.now(),
            }
            
            cache, created = DirectorDashboardCache.objects.update_or_create(
                director=director,
                defaults=cache_data
            )
            
            logger.info(f"Refreshed dashboard cache for director {director.id}")
            return cache
            
        except Exception as e:
            logger.error(f"Error refreshing director cache: {e}", exc_info=True)
            raise
    
    @staticmethod
    def refresh_cohort_dashboard(director, cohort):
        """Refresh detailed cohort dashboard data."""
        try:
            # Enrollment stats
            enrollments = cohort.enrollments.all()
            enrollment_status = {
                'active': enrollments.filter(status='active').count(),
                'pending': enrollments.filter(status='pending').count(),
                'withdrawn': enrollments.filter(status='withdrawn').count(),
                'completed': enrollments.filter(status='completed').count(),
            }
            
            seats_used = enrollment_status['active']
            seats_scholarship = enrollments.filter(
                status='active',
                seat_type='scholarship'
            ).count()
            seats_sponsored = enrollments.filter(
                status='active',
                seat_type='sponsored'
            ).count()
            
            # Mentor metrics
            mentor_assignments = cohort.mentor_assignments.filter(active=True)
            mentor_coverage_pct = 100.0 if mentor_assignments.exists() else 0.0
            mentor_session_completion_pct = 85.0  # TODO: From Mentorship OS
            
            # Talent metrics
            readiness_avg = 65.0  # TODO: From TalentScope
            completion_pct = cohort.completion_rate or 0
            portfolio_health_avg = 70.0  # TODO: From Portfolio Engine
            mission_approval_time_avg = None  # TODO: From Missions MXP
            at_risk_mentees = 0  # TODO: From Mentorship OS
            
            # Upcoming milestones
            upcoming_events = CalendarEvent.objects.filter(
                cohort=cohort,
                start_ts__gte=timezone.now()
            ).order_by('start_ts')[:5]
            
            milestones_upcoming = [
                {
                    'title': event.title,
                    'date': event.start_ts.isoformat(),
                    'type': event.type
                }
                for event in upcoming_events
            ]
            
            calendar_events = milestones_upcoming.copy()
            
            # Flags
            flags_active = []
            utilization = (seats_used / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0
            if completion_pct < 50:
                flags_active.append('Low completion rate')
            if utilization < 60 and seats_used > 0:
                flags_active.append('Under-filled')
            if utilization >= 95:
                flags_active.append('Near capacity')
            
            cohort_data = {
                'director': director,
                'cohort': cohort,
                'cohort_name': cohort.name,
                'track_name': cohort.track.name if cohort.track else '',
                'start_date': cohort.start_date,
                'end_date': cohort.end_date,
                'mode': cohort.mode,
                'seats_total': cohort.seat_cap,
                'seats_used': seats_used,
                'seats_scholarship': seats_scholarship,
                'seats_sponsored': seats_sponsored,
                'enrollment_status': enrollment_status,
                'readiness_avg': readiness_avg,
                'completion_pct': completion_pct,
                'mentor_coverage_pct': mentor_coverage_pct,
                'mentor_session_completion_pct': mentor_session_completion_pct,
                'mission_approval_time_avg': mission_approval_time_avg,
                'portfolio_health_avg': portfolio_health_avg,
                'at_risk_mentees': at_risk_mentees,
                'milestones_upcoming': milestones_upcoming,
                'calendar_events': calendar_events,
                'flags_active': flags_active,
                'updated_at': timezone.now(),
            }
            
            dashboard, created = DirectorCohortDashboard.objects.update_or_create(
                director=director,
                cohort=cohort,
                defaults=cohort_data
            )
            
            logger.info(f"Refreshed cohort dashboard for {cohort.id}")
            return dashboard
            
        except Exception as e:
            logger.error(f"Error refreshing cohort dashboard: {e}", exc_info=True)
            raise

