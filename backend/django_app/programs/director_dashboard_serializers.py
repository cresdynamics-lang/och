"""
Serializers for Director Dashboard models.
"""
from rest_framework import serializers
from programs.director_dashboard_models import DirectorDashboardCache, DirectorCohortDashboard


class DirectorDashboardCacheSerializer(serializers.ModelSerializer):
    """Serializer for director dashboard cache."""
    
    class Meta:
        model = DirectorDashboardCache
        fields = [
            'active_programs_count',
            'active_cohorts_count',
            'total_seats',
            'seats_used',
            'seats_pending',
            'avg_readiness_score',
            'avg_completion_rate',
            'avg_portfolio_health',
            'avg_mission_approval_time_minutes',
            'mentor_coverage_pct',
            'mentor_session_completion_pct',
            'mentors_over_capacity_count',
            'mentee_at_risk_count',
            'cohorts_flagged_count',
            'mentors_flagged_count',
            'missions_bottlenecked_count',
            'payments_overdue_count',
            'cache_updated_at',
        ]
        read_only_fields = ['cache_updated_at']


class DirectorCohortDashboardSerializer(serializers.ModelSerializer):
    """Serializer for cohort dashboard detail."""
    cohort_id = serializers.UUIDField(source='cohort.id', read_only=True)
    
    class Meta:
        model = DirectorCohortDashboard
        fields = [
            'id',
            'cohort_id',
            'cohort_name',
            'track_name',
            'start_date',
            'end_date',
            'mode',
            'seats_total',
            'seats_used',
            'seats_scholarship',
            'seats_sponsored',
            'enrollment_status',
            'readiness_avg',
            'completion_pct',
            'mentor_coverage_pct',
            'mentor_session_completion_pct',
            'mission_approval_time_avg',
            'portfolio_health_avg',
            'at_risk_mentees',
            'milestones_upcoming',
            'calendar_events',
            'flags_active',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class DirectorDashboardSummarySerializer(serializers.Serializer):
    """Serializer for director dashboard summary endpoint."""
    active_programs_count = serializers.IntegerField()
    active_cohorts_count = serializers.IntegerField()
    seats_total = serializers.IntegerField()
    seats_used = serializers.IntegerField()
    avg_readiness_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    avg_completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    mentor_coverage_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    mentors_over_capacity_count = serializers.IntegerField()
    at_risk_mentees_count = serializers.IntegerField()
    alerts = serializers.ListField(child=serializers.CharField())
    cache_updated_at = serializers.DateTimeField()

