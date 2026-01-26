"""
Director Dashboard API Views
High-performance cached endpoints for director dashboard.
"""
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from programs.director_dashboard_models import DirectorDashboardCache, DirectorCohortDashboard
from programs.director_dashboard_services import DirectorDashboardAggregationService
from programs.director_dashboard_serializers import (
    DirectorDashboardCacheSerializer,
    DirectorCohortDashboardSerializer,
    DirectorDashboardSummarySerializer
)
from programs.models import Cohort, Enrollment, MentorAssignment, CalendarEvent
from programs.director_dashboard_tasks import refresh_director_dashboard_cache_task


@extend_schema(
    summary='Get Director Dashboard Summary',
    description='Returns cached overview aggregating across all programs/cohorts. Falls back to real-time calculation if cache is stale (>5 minutes).',
    tags=['Director Dashboard'],
    responses={
        200: DirectorDashboardSummarySerializer,
        403: {'description': 'You do not have director access'},
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_dashboard_summary(request):
    """
    GET /api/v1/director/dashboard/summary
    
    Returns cached overview aggregating across all programs/cohorts.
    Falls back to real-time calculation if cache is stale (>5 minutes).
    
    RLS: Directors can only see their own dashboard data.
    """
    director = request.user
    
    # RLS: Ensure director has access (they must direct at least one track)
    if not director.is_staff:
        if not director.directed_tracks.exists():
            return Response(
                {'detail': 'You do not have director access'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Check cache freshness (5 minutes)
    cache_age_threshold = timezone.now() - timedelta(minutes=5)
    
    try:
        cache = DirectorDashboardCache.objects.get(director=director)
        
        # If cache is stale, trigger refresh in background
        if cache.cache_updated_at < cache_age_threshold:
            refresh_director_dashboard_cache_task.delay(director.id)
        
        # Build alerts list
        alerts = []
        if cache.cohorts_flagged_count > 0:
            alerts.append(f"{cache.cohorts_flagged_count} cohorts flagged for low readiness")
        if cache.mentors_over_capacity_count > 0:
            alerts.append(f"{cache.mentors_over_capacity_count} mentors over capacity")
        if cache.payments_overdue_count > 0:
            alerts.append(f"Payment overdue on {cache.payments_overdue_count} seats")
        if cache.missions_bottlenecked_count > 0:
            alerts.append(f"{cache.missions_bottlenecked_count} missions bottlenecked")
        
        summary_data = {
            'active_programs_count': cache.active_programs_count,
            'active_cohorts_count': cache.active_cohorts_count,
            'seats_total': cache.total_seats,
            'seats_used': cache.seats_used,
            'avg_readiness_score': float(cache.avg_readiness_score),
            'avg_completion_rate': float(cache.avg_completion_rate),
            'mentor_coverage_pct': float(cache.mentor_coverage_pct),
            'mentors_over_capacity_count': cache.mentors_over_capacity_count,
            'at_risk_mentees_count': cache.mentee_at_risk_count,
            'alerts': alerts,
            'cache_updated_at': cache.cache_updated_at.isoformat(),
        }
        
        serializer = DirectorDashboardSummarySerializer(data=summary_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)
        
    except DirectorDashboardCache.DoesNotExist:
        # Cache doesn't exist, calculate on-demand and create cache
        cache = DirectorDashboardAggregationService.refresh_director_cache(director)
        
        alerts = []
        if cache.cohorts_flagged_count > 0:
            alerts.append(f"{cache.cohorts_flagged_count} cohorts flagged")
        if cache.mentors_over_capacity_count > 0:
            alerts.append(f"{cache.mentors_over_capacity_count} mentors over capacity")
        if cache.payments_overdue_count > 0:
            alerts.append(f"Payment overdue on {cache.payments_overdue_count} seats")
        
        summary_data = {
            'active_programs_count': cache.active_programs_count,
            'active_cohorts_count': cache.active_cohorts_count,
            'seats_total': cache.total_seats,
            'seats_used': cache.seats_used,
            'avg_readiness_score': float(cache.avg_readiness_score),
            'avg_completion_rate': float(cache.avg_completion_rate),
            'mentor_coverage_pct': float(cache.mentor_coverage_pct),
            'mentors_over_capacity_count': cache.mentors_over_capacity_count,
            'at_risk_mentees_count': cache.mentee_at_risk_count,
            'alerts': alerts,
            'cache_updated_at': cache.cache_updated_at.isoformat(),
        }
        
        serializer = DirectorDashboardSummarySerializer(data=summary_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


@extend_schema(
    summary='List Director Cohorts',
    description='Returns paginated array of detailed cohort cards. Uses cached cohort dashboard data for performance.',
    tags=['Director Dashboard'],
    parameters=[
        OpenApiParameter('page', OpenApiTypes.INT, description='Page number', required=False),
        OpenApiParameter('page_size', OpenApiTypes.INT, description='Items per page', required=False),
        OpenApiParameter('status', OpenApiTypes.STR, description='Filter by cohort status', required=False),
    ],
    responses={
        200: DirectorCohortDashboardSerializer(many=True),
        403: {'description': 'You do not have director access'},
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_cohorts_list(request):
    """
    GET /api/v1/director/dashboard/cohorts
    
    Returns paginated array of detailed cohort cards.
    Uses cached cohort dashboard data for performance.
    
    RLS: Directors can only see cohorts they manage.
    """
    director = request.user
    
    # RLS: Ensure director has access
    if not director.is_staff:
        if not director.directed_tracks.exists():
            return Response(
                {'detail': 'You do not have director access'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Get pagination params
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    offset = (page - 1) * page_size
    
    # Get cached cohort dashboards
    cohort_dashboards = DirectorCohortDashboard.objects.filter(
        director=director
    ).select_related('cohort', 'cohort__track', 'cohort__track__program')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        cohort_dashboards = cohort_dashboards.filter(
            cohort__status=status_filter
        )
    
    # Sort by updated_at (most recently active first)
    cohort_dashboards = cohort_dashboards.order_by('-updated_at')
    
    # Pagination
    total = cohort_dashboards.count()
    cohort_dashboards = cohort_dashboards[offset:offset + page_size]
    
    serializer = DirectorCohortDashboardSerializer(cohort_dashboards, many=True)
    
    return Response({
        'count': total,
        'next': f'/api/v1/director/dashboard/cohorts?page={page + 1}' if offset + page_size < total else None,
        'previous': f'/api/v1/director/dashboard/cohorts?page={page - 1}' if page > 1 else None,
        'results': serializer.data
    })


@extend_schema(
    summary='Get Cohort Detail',
    description='Deep analytics for a specific cohort. Includes enrollment, mentors, readiness distributions, competency heatmaps.',
    tags=['Director Dashboard'],
    responses={
        200: {
            'description': 'Detailed cohort analytics',
            'examples': {
                'application/json': {
                    'cohort_id': 'uuid',
                    'name': 'Cyber Builders Jan 2026',
                    'enrollment': {'active': 45, 'paid': 40},
                    'mentors': [],
                    'metrics': {'readiness_avg': 68.1},
                }
            }
        },
        403: {'description': 'You do not have access to this cohort'},
        404: {'description': 'Cohort not found'},
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_cohort_detail(request, cohort_id):
    """
    GET /api/v1/director/dashboard/cohorts/{cohort_id}
    
    Deep analytics for a specific cohort.
    Includes enrollment, mentors, readiness distributions, competency heatmaps.
    """
    director = request.user
    
    try:
        cohort = Cohort.objects.get(id=cohort_id)
        
        # Verify director has access
        if not director.is_staff:
            programs = DirectorDashboardAggregationService.get_director_programs(director)
            if cohort.track.program not in programs:
                return Response(
                    {'detail': 'You do not have access to this cohort'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get or refresh cohort dashboard cache
        # For staff/admin users, use any director's cache or create a generic one
        if director.is_staff:
            # For admins/staff, try to get any director's cache for this cohort, or create a generic one
            try:
                cohort_dashboard = DirectorCohortDashboard.objects.filter(
                    cohort=cohort
                ).first()
                if not cohort_dashboard:
                    # Create a generic dashboard cache for admin viewing
                    cohort_dashboard = DirectorDashboardAggregationService.refresh_cohort_dashboard(
                        director, cohort
                    )
            except Exception:
                # Fallback: create a new dashboard cache
                cohort_dashboard = DirectorDashboardAggregationService.refresh_cohort_dashboard(
                    director, cohort
                )
        else:
            # For directors, use their specific cache
            try:
                cohort_dashboard = DirectorCohortDashboard.objects.get(
                    director=director,
                    cohort=cohort
                )
            except DirectorCohortDashboard.DoesNotExist:
                cohort_dashboard = DirectorDashboardAggregationService.refresh_cohort_dashboard(
                    director, cohort
                )
            except Exception:
                # Fallback: create a new dashboard cache
                cohort_dashboard = DirectorDashboardAggregationService.refresh_cohort_dashboard(
                    director, cohort
                )
        # Get detailed enrollment breakdown
        enrollments = cohort.enrollments.all()
        enrollment_detail = {
            'active': enrollments.filter(status='active').count(),
            'pending': enrollments.filter(status='pending').count(),
            'withdrawn': enrollments.filter(status='withdrawn').count(),
            'paid': enrollments.filter(status='active', payment_status='paid').count(),
            'scholarship': enrollments.filter(status='active', seat_type='scholarship').count(),
            'sponsored': enrollments.filter(status='active', seat_type='sponsored').count(),
        }
        
        # Get mentor details
        mentor_assignments = MentorAssignment.objects.filter(
            cohort=cohort,
            active=True
        ).select_related('mentor')
        
        mentors = [
            {
                'mentor_id': str(ma.mentor.id),
                'name': ma.mentor.get_full_name() or ma.mentor.email,
                'sessions_completed': 0,  # TODO: From Mentorship OS
                'capacity_used': 0,  # TODO: Calculate from assignments
            }
            for ma in mentor_assignments
        ]
        
        # Mock readiness distribution (should come from TalentScope)
        readiness_distribution = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0,
        }
        
        # Mock competency heatmap (should come from TalentScope)
        competency_heatmap = {}
        
        # Mock mission funnel (should come from Missions MXP)
        mission_funnel = {
            'assigned': 0,
            'in_review': 0,
            'approved': 0,
            'stuck': 0,
        }
        
        # Mock portfolio health (should come from Portfolio Engine)
        portfolio_health = {}
        
        # Payment details
        payments = {
            'total_due': 0,  # TODO: From billing
            'overdue': 0,  # TODO: From billing
            'refunds': 0,  # TODO: From billing
        }
        
        # Alerts
        alerts = cohort_dashboard.flags_active.copy()
        
        return Response({
            'cohort_id': str(cohort.id),
            'name': cohort.name,
            'program_name': cohort.track.program.name if cohort.track and cohort.track.program else '',
            'enrollment': enrollment_detail,
            'mentors': mentors,
            'competency_heatmap': competency_heatmap,
            'mission_funnel': mission_funnel,
            'portfolio_health': portfolio_health,
            'payments': payments,
            'alerts': alerts,
            'metrics': {
                'readiness_avg': float(cohort_dashboard.readiness_avg),
                'completion_pct': float(cohort_dashboard.completion_pct),
                'mentor_coverage_pct': float(cohort_dashboard.mentor_coverage_pct),
                'portfolio_health_avg': float(cohort_dashboard.portfolio_health_avg),
            }
        })
        
    except Cohort.DoesNotExist:
        return Response(
            {'detail': 'Cohort not found'},
            status=status.HTTP_404_NOT_FOUND
        )

