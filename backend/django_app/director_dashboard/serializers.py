"""
Serializers for Director Dashboard API.
"""
from rest_framework import serializers
from .models import DirectorDashboardCache, DirectorCohortHealth


class DirectorDashboardHeroSerializer(serializers.Serializer):
    """Hero metrics serializer."""
    active_programs = serializers.IntegerField()
    active_cohorts = serializers.IntegerField()
    seats_used = serializers.CharField()
    avg_readiness = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=False)
    completion_rate = serializers.CharField()


class AlertSerializer(serializers.Serializer):
    """Alert serializer."""
    priority = serializers.ChoiceField(choices=['high', 'medium', 'low'])
    title = serializers.CharField()
    action = serializers.CharField()
    cohort_id = serializers.UUIDField(required=False, allow_null=True)
    mentor_id = serializers.UUIDField(required=False, allow_null=True)


class QuickStatsSerializer(serializers.Serializer):
    """Quick stats serializer."""
    missions_bottlenecked = serializers.IntegerField()
    seats_overdue = serializers.IntegerField()
    graduates_ready = serializers.IntegerField()


class DirectorDashboardSerializer(serializers.Serializer):
    """Main dashboard serializer."""
    hero = DirectorDashboardHeroSerializer()
    alerts = AlertSerializer(many=True)
    quick_stats = QuickStatsSerializer()


class DirectorCohortHealthSerializer(serializers.ModelSerializer):
    """Cohort health serializer."""
    cohort_id = serializers.UUIDField(source='cohort.id', read_only=True)
    cohort_name = serializers.CharField(read_only=True)
    seats_used = serializers.SerializerMethodField()
    readiness = serializers.DecimalField(source='readiness_avg', max_digits=5, decimal_places=2, coerce_to_string=False)
    completion = serializers.CharField(source='completion_pct', read_only=True)
    mentor_coverage = serializers.CharField(source='mentor_coverage_pct', read_only=True)
    risk_score = serializers.DecimalField(max_digits=4, decimal_places=1, coerce_to_string=False)
    next_milestone = serializers.JSONField(read_only=True)
    risk_flags = serializers.JSONField(read_only=True)
    
    class Meta:
        model = DirectorCohortHealth
        fields = [
            'cohort_id',
            'cohort_name',
            'seats_used',
            'readiness',
            'completion',
            'mentor_coverage',
            'risk_score',
            'next_milestone',
            'risk_flags',
        ]
    
    def get_seats_used(self, obj):
        """Format seats used."""
        cohort = obj.cohort
        return f"{obj.seats_used_total}/{cohort.seat_cap}"

