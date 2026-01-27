"""
AI integration services for sponsor dashboards.
Connects to ReadinessScore, DropoutRisk, and NudgeEngine services.
"""
import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from .models import SponsorCohort, SponsorStudentCohort, SponsorAnalytics


class ReadinessScoreService:
    """Service for calculating student readiness scores"""

    @staticmethod
    def calculate_readiness_scores(cohort: SponsorCohort) -> list:
        """
        Calculate readiness scores for students in a cohort.
        Uses curriculum progress, quiz scores, mission completion, and activity patterns.
        """
        students = SponsorStudentCohort.objects.filter(
            sponsor_cohort=cohort,
            is_active=True
        ).select_related('student')

        readiness_scores = []

        for student_cohort in students:
            student = student_cohort.student

            # Mock readiness calculation - in production would integrate with AI service
            # Factors: curriculum completion, quiz performance, activity consistency, mentor engagement
            readiness_score = ReadinessScoreService._calculate_individual_readiness(
                student, student_cohort
            )

            readiness_scores.append({
                'student_id': str(student.id),
                'student_name': student.get_full_name(),
                'student_email': student.email,
                'readiness_score': readiness_score,
                'completion_percentage': float(student_cohort.completion_percentage),
                'last_activity': student_cohort.last_activity_at,
                'cohort_rank': 1  # Would be calculated based on ranking
            })

        # Sort by readiness score descending
        readiness_scores.sort(key=lambda x: x['readiness_score'], reverse=True)

        # Add ranking
        for i, score in enumerate(readiness_scores):
            score['cohort_rank'] = i + 1

        return readiness_scores

    @staticmethod
    def _calculate_individual_readiness(student, student_cohort: SponsorStudentCohort) -> float:
        """Calculate readiness score for individual student"""
        # Mock implementation - would integrate with actual AI service
        base_score = float(student_cohort.completion_percentage)

        # Activity bonus (more recent activity = higher score)
        activity_bonus = 0
        if student_cohort.last_activity_at:
            days_since_activity = (timezone.now() - student_cohort.last_activity_at).days
            if days_since_activity <= 7:
                activity_bonus = 10
            elif days_since_activity <= 30:
                activity_bonus = 5

        # Consistency bonus (regular engagement patterns)
        consistency_bonus = 5  # Mock

        total_score = min(base_score + activity_bonus + consistency_bonus, 100)
        return round(total_score, 1)


class DropoutRiskService:
    """Service for predicting and managing dropout risk"""

    @staticmethod
    def analyze_cohort_risk(cohort: SponsorCohort) -> dict:
        """
        Analyze cohort for dropout risk patterns.
        Returns risk assessment and recommended interventions.
        """
        students = SponsorStudentCohort.objects.filter(
            sponsor_cohort=cohort,
            is_active=True
        )

        # Mock risk analysis - would integrate with actual AI service
        total_students = students.count()
        at_risk_count = max(1, int(total_students * 0.08))  # 8% at risk

        risk_assessment = {
            'cohort_id': str(cohort.id),
            'total_students': total_students,
            'at_risk_students': at_risk_count,
            'risk_percentage': round((at_risk_count / total_students) * 100, 1),
            'risk_factors': [
                'low activity in week 3',
                'quiz performance decline',
                'missed mentor sessions'
            ],
            'predicted_dropout_rate': 12.5,
            'confidence_score': 0.87
        }

        return risk_assessment

    @staticmethod
    def generate_dropout_alerts(cohort: SponsorCohort) -> list:
        """Generate alerts for students at risk of dropping out"""
        risk_assessment = DropoutRiskService.analyze_cohort_risk(cohort)

        alerts = []
        if risk_assessment['at_risk_students'] > 0:
            alerts.append({
                'type': 'dropout_risk',
                'priority': 1,
                'title': f"{risk_assessment['at_risk_students']} Students At Risk (Week 3 Prediction)",
                'description': f"{risk_assessment['at_risk_students']} students showing early warning signs of disengagement based on activity patterns and quiz performance.",
                'cohort_name': cohort.name,
                'risk_score': risk_assessment['predicted_dropout_rate'],
                'recommended_action': 'Deploy mentor 1:1s + recipe nudges',
                'roi_estimate': '3.2x',
                'action_url': f'/sponsor/{cohort.sponsor.slug}/interventions'
            })

        return alerts


class NudgeEngineService:
    """Service for AI-powered completion attribution and nudges"""

    @staticmethod
    def calculate_completion_attribution(cohort: SponsorCohort) -> dict:
        """
        Calculate how interventions contribute to completion rates.
        Uses causal inference to attribute completions to specific interventions.
        """
        # Mock attribution analysis - would integrate with actual AI service
        attribution = {
            'total_completions': 45,
            'attributed_to_interventions': 28,
            'attribution_percentage': 62.2,
            'top_interventions': [
                {
                    'intervention_type': 'mentor_nudge',
                    'completions_attributed': 12,
                    'confidence': 0.89
                },
                {
                    'intervention_type': 'recipe_recommendation',
                    'completions_attributed': 8,
                    'confidence': 0.76
                },
                {
                    'intervention_type': 'peer_group_assignment',
                    'completions_attributed': 8,
                    'confidence': 0.82
                }
            ],
            'roi_by_intervention_type': {
                'mentor_nudge': 3.2,
                'recipe_recommendation': 2.8,
                'peer_group_assignment': 4.1
            }
        }

        return attribution

    @staticmethod
    def generate_completion_alerts(cohort: SponsorCohort) -> list:
        """Generate alerts based on completion attribution insights"""
        attribution = NudgeEngineService.calculate_completion_attribution(cohort)

        alerts = []

        # High attribution success alert
        if attribution['attribution_percentage'] > 60:
            alerts.append({
                'type': 'intervention_success',
                'priority': 3,
                'title': f"{attribution['attribution_percentage']:.1f}% Completions Attributed to Interventions",
                'description': f"AI interventions successfully drove {attribution['attributed_to_interventions']} of {attribution['total_completions']} completions this period.",
                'cohort_name': cohort.name,
                'recommended_action': 'Continue scaling successful intervention patterns',
                'roi_estimate': '2.8x',
                'action_url': f'/sponsor/{cohort.sponsor.slug}/analytics'
            })

        return alerts


class SponsorAIService:
    """Unified AI service interface for sponsor dashboards"""

    @staticmethod
    def get_dashboard_ai_insights(cohort: SponsorCohort) -> dict:
        """Get all AI insights for sponsor dashboard"""
        cache_key = f'sponsor_ai_insights_{cohort.id}'
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data

        # Collect insights from all AI services
        readiness_scores = ReadinessScoreService.calculate_readiness_scores(cohort)
        dropout_risk = DropoutRiskService.analyze_cohort_risk(cohort)
        completion_attribution = NudgeEngineService.calculate_completion_attribution(cohort)

        # Generate alerts
        dropout_alerts = DropoutRiskService.generate_dropout_alerts(cohort)
        completion_alerts = NudgeEngineService.generate_completion_alerts(cohort)

        insights = {
            'readiness_scores': readiness_scores,
            'dropout_risk': dropout_risk,
            'completion_attribution': completion_attribution,
            'ai_alerts': dropout_alerts + completion_alerts,
            'generated_at': timezone.now().isoformat()
        }

        # Cache for 5 minutes
        cache.set(cache_key, insights, 300)

        return insights

    @staticmethod
    def deploy_intervention(cohort: SponsorCohort, intervention_type: str, target_students: list = None) -> dict:
        """Deploy an AI intervention to students"""
        # Mock intervention deployment - would integrate with actual AI services
        deployment_result = {
            'intervention_id': f'int_{cohort.id}_{timezone.now().timestamp()}',
            'intervention_type': intervention_type,
            'cohort_id': str(cohort.id),
            'target_students_count': len(target_students) if target_students else cohort.students_enrolled,
            'deployment_status': 'success',
            'expected_roi': 2.5,
            'estimated_completion_date': (timezone.now() + timezone.timedelta(days=14)).date().isoformat()
        }

        # Create intervention record
        from .models import SponsorIntervention
        intervention = SponsorIntervention.objects.create(
            sponsor_cohort=cohort,
            intervention_type=intervention_type,
            title=f'AI Intervention: {intervention_type}',
            description=f'AI-deployed {intervention_type} intervention for {cohort.name}',
            ai_trigger_reason='Sponsor dashboard deployment',
            expected_roi=deployment_result['expected_roi'],
            status='deployed'
        )

        deployment_result['db_record_id'] = str(intervention.id)

        return deployment_result
