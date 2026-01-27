"""
Serializers for the Sponsors app.
"""
from rest_framework import serializers
from .models import Sponsor, SponsorCohort, SponsorStudentCohort, SponsorAnalytics


class SponsorSerializer(serializers.ModelSerializer):
    """Serializer for Sponsor model"""
    class Meta:
        model = Sponsor
        fields = [
            'id', 'slug', 'name', 'sponsor_type', 'logo_url',
            'contact_email', 'website', 'country', 'city', 'region',
            'is_active', 'created_at', 'updated_at'
        ]


class SponsorCohortSerializer(serializers.ModelSerializer):
    """Serializer for SponsorCohort model"""
    sponsor = SponsorSerializer(read_only=True)

    class Meta:
        model = SponsorCohort
        fields = [
            'id', 'sponsor', 'name', 'track_slug', 'target_size',
            'students_enrolled', 'start_date', 'expected_graduation_date',
            'is_active', 'completion_rate', 'created_at', 'updated_at'
        ]


class SponsorStudentCohortSerializer(serializers.ModelSerializer):
    """Serializer for SponsorStudentCohort model"""
    sponsor_cohort = SponsorCohortSerializer(read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)

    class Meta:
        model = SponsorStudentCohort
        fields = [
            'id', 'sponsor_cohort', 'student_name', 'student_email',
            'is_active', 'enrollment_status', 'completion_percentage',
            'joined_at', 'completed_at', 'last_activity_at', 'notes'
        ]


class SponsorAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for SponsorAnalytics model"""
    class Meta:
        model = SponsorAnalytics
        fields = [
            'sponsor', 'total_students', 'active_students', 'completion_rate',
            'placement_rate', 'roi_multiplier', 'total_hires', 'hires_last_30d',
            'avg_salary_kes', 'avg_readiness_score', 'last_updated', 'cache_version'
        ]


class TrackPerformanceSerializer(serializers.Serializer):
    """Serializer for track performance data"""
    track_slug = serializers.CharField()
    students_enrolled = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    avg_time_to_complete_days = serializers.IntegerField()
    top_performer = serializers.DictField()
    hiring_outcomes = serializers.DictField()


class TopTalentSerializer(serializers.Serializer):
    """Serializer for top talent data"""
    id = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField()
    readiness_score = serializers.FloatField()
    track_completion_pct = serializers.FloatField()
    top_skills = serializers.ListField(child=serializers.CharField())
    cohort_rank = serializers.IntegerField()
    last_activity_days = serializers.IntegerField()
    mentor_sessions_completed = serializers.IntegerField()
    missions_completed = serializers.IntegerField()


class HiringPipelineSerializer(serializers.Serializer):
    """Serializer for hiring pipeline data"""
    total_candidates = serializers.IntegerField()
    hired_count = serializers.IntegerField()
    overall_conversion_rate = serializers.FloatField()
    avg_time_to_hire_days = serializers.IntegerField()
    stages = serializers.ListField()


class AIAlertSerializer(serializers.Serializer):
    """Serializer for AI alerts"""
    id = serializers.CharField()
    type = serializers.CharField()
    priority = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    cohort_name = serializers.CharField()
    risk_score = serializers.IntegerField(required=False)
    recommended_action = serializers.CharField()
    roi_estimate = serializers.CharField()
    action_url = serializers.URLField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class ExecutiveSummarySerializer(serializers.Serializer):
    """Serializer for executive summary"""
    active_students = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    placement_rate = serializers.FloatField()
    roi = serializers.FloatField()
    hires_last_30d = serializers.IntegerField()
    ai_readiness_avg = serializers.FloatField()


class CohortListSerializer(serializers.Serializer):
    """Serializer for cohort list response"""
    id = serializers.CharField()
    name = serializers.CharField()
    track_slug = serializers.CharField()
    status = serializers.CharField()
    target_size = serializers.IntegerField()
    students_enrolled = serializers.IntegerField()
    active_students = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    start_date = serializers.DateField(allow_null=True)
    target_completion_date = serializers.DateField(allow_null=True)
    budget_allocated = serializers.FloatField()
    ai_interventions_count = serializers.IntegerField()
    placement_goal = serializers.IntegerField()
    value_created_kes = serializers.FloatField()
    avg_readiness_score = serializers.FloatField()
    top_talent_count = serializers.IntegerField()
    at_risk_students = serializers.IntegerField()
    ai_alerts_count = serializers.IntegerField()
    is_over_budget = serializers.BooleanField()
    is_behind_schedule = serializers.BooleanField()
    needs_attention = serializers.BooleanField()


class CohortDetailSerializer(serializers.Serializer):
    """Serializer for detailed cohort information"""
    id = serializers.CharField()
    name = serializers.CharField()
    track_slug = serializers.CharField()
    status = serializers.CharField()
    target_size = serializers.IntegerField()
    students_enrolled = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    start_date = serializers.DateField(allow_null=True)
    target_completion_date = serializers.DateField(allow_null=True)
    budget_allocated = serializers.FloatField()
    ai_interventions_count = serializers.IntegerField()
    placement_goal = serializers.IntegerField()


class StudentRosterSerializer(serializers.Serializer):
    """Serializer for student roster in cohort detail"""
    id = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField()
    readiness_score = serializers.FloatField()
    completion_percentage = serializers.FloatField()
    joined_at = serializers.DateTimeField()
    last_activity_at = serializers.DateTimeField(allow_null=True)
    enrollment_status = serializers.CharField()
    cohort_rank = serializers.IntegerField()
    top_skills = serializers.ListField(child=serializers.CharField())
    last_activity_days = serializers.IntegerField()
    mentor_sessions_completed = serializers.IntegerField()
    missions_completed = serializers.IntegerField()


class CohortPerformanceMetricsSerializer(serializers.Serializer):
    """Serializer for cohort performance metrics"""
    completion_trend = serializers.ListField(child=serializers.FloatField())
    readiness_distribution = serializers.DictField()
    engagement_metrics = serializers.DictField()


class CohortDetailResponseSerializer(serializers.Serializer):
    """Serializer for complete cohort detail response"""
    cohort = CohortDetailSerializer()
    student_roster = StudentRosterSerializer(many=True)
    ai_insights = serializers.DictField()
    performance_metrics = CohortPerformanceMetricsSerializer()


class CohortListResponseSerializer(serializers.Serializer):
    """Serializer for cohort list response"""
    sponsor = serializers.DictField()
    cohorts = CohortListSerializer(many=True)


class SponsorDashboardSerializer(serializers.Serializer):
    """Main serializer for sponsor dashboard data"""
    sponsor = serializers.DictField()
    cohort = serializers.DictField()
    executive_summary = ExecutiveSummarySerializer()
    track_performance = TrackPerformanceSerializer(many=True)
    top_talent = TopTalentSerializer(many=True)
    hiring_pipeline = HiringPipelineSerializer()
    ai_alerts = AIAlertSerializer(many=True)

