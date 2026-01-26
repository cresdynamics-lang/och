"""
Serializers for Sponsor Dashboard API.
"""
from rest_framework import serializers
from .models import (
    SponsorDashboardCache,
    SponsorCohortDashboard,
    SponsorStudentAggregates,
    SponsorCode
)


class SponsorDashboardSummarySerializer(serializers.ModelSerializer):
    """Serializer for sponsor dashboard summary."""
    org_id = serializers.SerializerMethodField()
    
    def get_org_id(self, obj):
        """Safely get org ID."""
        return obj.org.id if obj.org else None
    alerts = serializers.SerializerMethodField()
    budget_total = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    budget_used = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    budget_used_pct = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=False)
    avg_readiness = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=False)
    avg_completion_pct = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=False)
    
    class Meta:
        model = SponsorDashboardCache
        fields = [
            'org_id',
            'seats_total',
            'seats_used',
            'seats_at_risk',
            'budget_total',
            'budget_used',
            'budget_used_pct',
            'avg_readiness',
            'avg_completion_pct',
            'graduates_count',
            'active_cohorts_count',
            'alerts',
            'cache_updated_at',
        ]
    
    def get_alerts(self, obj):
        """Generate alerts based on cache data."""
        alerts = []
        if obj.low_utilization_cohorts > 0:
            alerts.append(f"{obj.low_utilization_cohorts} cohorts under 50% utilization")
        if obj.overdue_invoices_count > 0:
            alerts.append(f"{obj.overdue_invoices_count} invoices overdue")
        if obj.seats_at_risk > 0:
            alerts.append(f"{obj.seats_at_risk} seats at risk of dropout")
        return alerts


class SponsorCohortListSerializer(serializers.ModelSerializer):
    """Serializer for sponsor cohort list."""
    cohort_id = serializers.SerializerMethodField()
    budget_remaining = serializers.SerializerMethodField()
    
    def get_cohort_id(self, obj):
        """Safely get cohort ID."""
        if obj.cohort:
            return str(obj.cohort.id)
        return None
    
    class Meta:
        model = SponsorCohortDashboard
        fields = [
            'cohort_id',
            'cohort_name',
            'track_name',
            'seats_total',
            'seats_used',
            'seats_sponsored',
            'seats_remaining',
            'avg_readiness',
            'completion_pct',
            'graduates_count',
            'at_risk_count',
            'next_milestone',
            'flags',
            'budget_remaining',
        ]
    
    def get_budget_remaining(self, obj):
        """Calculate budget remaining (placeholder - integrate with billing)."""
        # TODO: Integrate with billing service
        return None


class SponsorCohortDetailSerializer(serializers.ModelSerializer):
    """Serializer for sponsor cohort detail."""
    cohort_id = serializers.UUIDField(source='cohort.id', read_only=True)
    seats = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    budget = serializers.SerializerMethodField()
    shared_profiles = serializers.SerializerMethodField()
    next_events = serializers.SerializerMethodField()
    
    class Meta:
        model = SponsorCohortDashboard
        fields = [
            'cohort_id',
            'cohort_name',
            'seats',
            'progress',
            'top_graduates',
            'budget',
            'shared_profiles',
            'next_events',
        ]
    
    def get_seats(self, obj):
        return {
            'total': obj.seats_total,
            'used': obj.seats_used,
            'sponsored': obj.seats_sponsored,
            'remaining': obj.seats_remaining,
            'at_risk': obj.at_risk_count,
        }
    
    def get_progress(self, obj):
        return {
            'avg_readiness': float(obj.avg_readiness) if obj.avg_readiness else None,
            'completion_pct': float(obj.completion_pct) if obj.completion_pct else None,
            'portfolio_health': float(obj.portfolio_health_avg) if obj.portfolio_health_avg else None,
        }
    
    def get_budget(self, obj):
        # TODO: Integrate with billing service
        return {
            'allocated': None,
            'spent': None,
            'remaining': None,
        }
    
    def get_shared_profiles(self, obj):
        """Count of students with consent_employer_share=True."""
        return SponsorStudentAggregates.objects.filter(
            org=obj.org,
            cohort=obj.cohort,
            consent_employer_share=True
        ).count()
    
    def get_next_events(self, obj):
        """Return upcoming events."""
        return obj.upcoming_events or []
    
    def get_top_graduates(self, obj):
        """Return count of top graduates."""
        return obj.graduates_count


class SponsorStudentAggregateSerializer(serializers.ModelSerializer):
    """Serializer for sponsor student aggregates (consent-gated)."""
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    
    class Meta:
        model = SponsorStudentAggregates
        fields = [
            'student_id',
            'name_anonymized',
            'readiness_score',
            'completion_pct',
            'portfolio_items',
            'consent_employer_share',
        ]


class SponsorCodeSerializer(serializers.ModelSerializer):
    """Serializer for sponsor codes."""
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = SponsorCode
        fields = [
            'id',
            'code',
            'seats',
            'value_per_seat',
            'valid_from',
            'valid_until',
            'usage_count',
            'max_usage',
            'status',
            'is_valid',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SponsorCodeGenerateSerializer(serializers.Serializer):
    """Serializer for generating sponsor codes."""
    seats = serializers.IntegerField(min_value=1)
    value_per_seat = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    valid_from = serializers.DateField(required=False, allow_null=True)
    valid_until = serializers.DateField(required=False, allow_null=True)
    max_usage = serializers.IntegerField(
        min_value=1,
        required=False,
        allow_null=True
    )
    count = serializers.IntegerField(min_value=1, max_value=100, default=1)


class SponsorSeatAssignSerializer(serializers.Serializer):
    """Serializer for bulk seat assignment."""
    cohort_id = serializers.UUIDField()
    user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    code = serializers.CharField(required=False, allow_blank=True)


class SponsorInvoiceSerializer(serializers.Serializer):
    """Serializer for sponsor invoices (placeholder - integrate with billing)."""
    invoice_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField()
    due_date = serializers.DateField()
    created_at = serializers.DateTimeField()

