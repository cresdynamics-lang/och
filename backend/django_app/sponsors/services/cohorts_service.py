"""
Sponsor Cohorts Service - Aggregates cohort data from multiple sources.
"""
from typing import List, Dict, Any, Optional
from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from ..models import Sponsor, SponsorCohort, SponsorStudentCohort
from ..services import ReadinessScoreService, DropoutRiskService, NudgeEngineService

User = get_user_model()


class SponsorCohortsService:
    """Service for managing sponsor cohort data and analytics"""

    @staticmethod
    def get_cohorts_list(sponsor: Sponsor) -> List[Dict[str, Any]]:
        """
        Get list of cohorts for a sponsor with performance metrics.
        Uses the database view for efficient aggregation.
        """
        cache_key = f'sponsor_cohorts_list_{sponsor.id}'
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM cohort_performance_summary
                WHERE cohort_id IN (
                    SELECT id FROM sponsor_cohorts WHERE sponsor_id = %s
                )
                ORDER BY created_at DESC
            """, [sponsor.id])

            columns = [col[0] for col in cursor.description]
            cohorts_data = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # Enhance with real AI data
        enhanced_cohorts = []
        for cohort_data in cohorts_data:
            cohort = SponsorCohort.objects.get(id=cohort_data['cohort_id'])

            # Get AI insights
            ai_insights = ReadinessScoreService.calculate_readiness_scores(cohort)
            risk_analysis = DropoutRiskService.analyze_cohort_risk(cohort)

            # Calculate value metrics (mock for now)
            value_metrics = SponsorCohortsService._calculate_value_metrics(cohort, ai_insights)

            enhanced_cohort = {
                'id': str(cohort.id),
                'name': cohort_data['cohort_name'],
                'track_slug': cohort_data['track_slug'],
                'status': cohort_data['status'],
                'target_size': cohort_data['target_size'],
                'students_enrolled': cohort_data['students_enrolled'],
                'active_students': cohort_data['active_students'],
                'completion_rate': float(cohort_data['avg_curriculum_completion']),
                'start_date': cohort_data['start_date'].isoformat() if cohort_data['start_date'] else None,
                'target_completion_date': cohort_data['target_completion_date'].isoformat() if cohort_data['target_completion_date'] else None,
                'budget_allocated': float(cohort_data['budget_allocated']),
                'ai_interventions_count': cohort_data['ai_interventions_count'],
                'placement_goal': cohort_data['placement_goal'],

                # Enhanced metrics
                'value_created_kes': value_metrics['value_created'],
                'avg_readiness_score': ai_insights[0]['readiness_score'] if ai_insights else 0,
                'top_talent_count': len([s for s in ai_insights if s['readiness_score'] >= 80]),
                'at_risk_students': risk_analysis['at_risk_students'],
                'ai_alerts_count': len(DropoutRiskService.generate_dropout_alerts(cohort)),

                # Status indicators
                'is_over_budget': value_metrics['is_over_budget'],
                'is_behind_schedule': value_metrics['is_behind_schedule'],
                'needs_attention': risk_analysis['at_risk_students'] > 0 or cohort_data['avg_curriculum_completion'] < 50
            }

            enhanced_cohorts.append(enhanced_cohort)

        # Cache for 5 minutes
        cache.set(cache_key, enhanced_cohorts, 300)
        return enhanced_cohorts

    @staticmethod
    def get_cohort_detail(cohort: SponsorCohort) -> Dict[str, Any]:
        """Get detailed information for a specific cohort including student roster"""
        cache_key = f'cohort_detail_{cohort.id}'
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data

        # Basic cohort info
        cohort_data = {
            'id': str(cohort.id),
            'name': cohort.name,
            'track_slug': cohort.track_slug,
            'status': cohort.status,
            'target_size': cohort.target_size,
            'students_enrolled': cohort.students_enrolled,
            'completion_rate': float(cohort.completion_rate),
            'start_date': cohort.start_date.isoformat() if cohort.start_date else None,
            'target_completion_date': cohort.target_completion_date.isoformat() if cohort.target_completion_date else None,
            'budget_allocated': float(cohort.budget_allocated),
            'ai_interventions_count': cohort.ai_interventions_count,
            'placement_goal': cohort.placement_goal,
        }

        # Student roster with AI insights
        students = SponsorStudentCohort.objects.filter(
            sponsor_cohort=cohort,
            is_active=True
        ).select_related('student')

        ai_insights = ReadinessScoreService.calculate_readiness_scores(cohort)
        readiness_map = {s['student_id']: s for s in ai_insights}

        student_roster = []
        for enrollment in students:
            student = enrollment.student
            readiness_data = readiness_map.get(str(student.id), {})

            student_info = {
                'id': str(student.id),
                'name': student.get_full_name(),
                'email': student.email,
                'readiness_score': readiness_data.get('readiness_score', 0),
                'completion_percentage': float(enrollment.completion_percentage),
                'joined_at': enrollment.joined_at.isoformat(),
                'last_activity_at': enrollment.last_activity_at.isoformat() if enrollment.last_activity_at else None,
                'enrollment_status': enrollment.enrollment_status,
                'cohort_rank': readiness_data.get('cohort_rank', 0),
                'top_skills': readiness_data.get('top_skills', []),
                'last_activity_days': readiness_data.get('last_activity_days', 0),
                'mentor_sessions_completed': readiness_data.get('mentor_sessions_completed', 0),
                'missions_completed': readiness_data.get('missions_completed', 0),
            }
            student_roster.append(student_info)

        # Sort by readiness score descending
        student_roster.sort(key=lambda x: x['readiness_score'], reverse=True)

        # AI alerts and insights
        risk_analysis = DropoutRiskService.analyze_cohort_risk(cohort)
        dropout_alerts = DropoutRiskService.generate_dropout_alerts(cohort)
        completion_alerts = NudgeEngineService.generate_completion_alerts(cohort)

        ai_insights = {
            'dropout_risk': risk_analysis,
            'alerts': dropout_alerts + completion_alerts,
            'recommendations': SponsorCohortsService._generate_ai_recommendations(cohort, risk_analysis)
        }

        # Performance metrics
        performance_metrics = {
            'completion_trend': [68, 72, 75, 78],  # Mock weekly trend
            'readiness_distribution': {
                'excellent': len([s for s in ai_insights if s['readiness_score'] >= 90]),
                'strong': len([s for s in ai_insights if 80 <= s['readiness_score'] < 90]),
                'good': len([s for s in ai_insights if 70 <= s['readiness_score'] < 80]),
                'developing': len([s for s in ai_insights if s['readiness_score'] < 70]),
            },
            'engagement_metrics': {
                'active_last_7d': len([s for s in student_roster if s['last_activity_days'] <= 7]),
                'completed_missions_avg': sum(s['missions_completed'] for s in student_roster) / len(student_roster) if student_roster else 0,
                'mentor_sessions_avg': sum(s['mentor_sessions_completed'] for s in student_roster) / len(student_roster) if student_roster else 0,
            }
        }

        result = {
            'cohort': cohort_data,
            'student_roster': student_roster,
            'ai_insights': ai_insights,
            'performance_metrics': performance_metrics
        }

        # Cache for 10 minutes (shorter for detailed data)
        cache.set(cache_key, result, 600)
        return result

    @staticmethod
    def create_cohort(sponsor: Sponsor, cohort_data: Dict[str, Any]) -> SponsorCohort:
        """Create a new cohort for the sponsor"""
        cohort = SponsorCohort.objects.create(
            sponsor=sponsor,
            name=cohort_data['name'],
            track_slug=cohort_data['track_slug'],
            target_size=cohort_data.get('target_size', 100),
            start_date=cohort_data.get('start_date'),
            target_completion_date=cohort_data.get('target_completion_date'),
            budget_allocated=cohort_data.get('budget_allocated', 0),
            placement_goal=cohort_data.get('placement_goal', 0),
            status='draft'  # Start as draft, sponsor can activate later
        )

        # Clear cache
        cache_key = f'sponsor_cohorts_list_{sponsor.id}'
        cache.delete(cache_key)

        return cohort

    @staticmethod
    def add_students_to_cohort(cohort: SponsorCohort, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add students to a cohort via various methods"""
        added_count = 0
        skipped_count = 0

        if student_data.get('method') == 'csv':
            # Handle CSV upload
            csv_data = student_data.get('csv_data', [])
            for row in csv_data:
                try:
                    user = User.objects.get(email=row['email'])
                    enrollment, created = SponsorStudentCohort.objects.get_or_create(
                        sponsor_cohort=cohort,
                        student=user,
                        defaults={'is_active': True}
                    )
                    if created:
                        added_count += 1
                    else:
                        skipped_count += 1
                except User.DoesNotExist:
                    skipped_count += 1

        elif student_data.get('method') == 'auto_enroll':
            # Auto-enroll based on filters
            filters = student_data.get('filters', {})

            # Mock auto-enrollment logic - would integrate with profiler
            # For now, just add some mock users
            users = User.objects.filter(is_active=True)[:student_data.get('count', 10)]
            for user in users:
                enrollment, created = SponsorStudentCohort.objects.get_or_create(
                    sponsor_cohort=cohort,
                    student=user,
                    defaults={'is_active': True}
                )
                if created:
                    added_count += 1
                else:
                    skipped_count += 1

        elif student_data.get('method') == 'manual':
            # Manual selection
            user_ids = student_data.get('user_ids', [])
            for user_id in user_ids:
                try:
                    user = User.objects.get(id=user_id)
                    enrollment, created = SponsorStudentCohort.objects.get_or_create(
                        sponsor_cohort=cohort,
                        student=user,
                        defaults={'is_active': True}
                    )
                    if created:
                        added_count += 1
                    else:
                        skipped_count += 1
                except User.DoesNotExist:
                    skipped_count += 1

        # Update cohort enrollment count
        cohort.students_enrolled = SponsorStudentCohort.objects.filter(
            sponsor_cohort=cohort, is_active=True
        ).count()
        cohort.save()

        # Clear cache
        cache_key = f'cohort_detail_{cohort.id}'
        cache.delete(cache_key)

        return {
            'added': added_count,
            'skipped': skipped_count,
            'total_enrolled': cohort.students_enrolled
        }

    @staticmethod
    def deploy_ai_intervention(cohort: SponsorCohort, intervention_data: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy AI intervention suite for the cohort"""
        intervention_type = intervention_data.get('type', 'comprehensive')

        # Mock intervention deployment
        deployed_interventions = []

        if intervention_type in ['comprehensive', 'nudge']:
            deployed_interventions.append({
                'type': 'nudge_engine',
                'description': 'Deployed targeted nudges for 12 at-risk students',
                'target_count': 12
            })

        if intervention_type in ['comprehensive', 'mentor']:
            deployed_interventions.append({
                'type': 'mentor_match',
                'description': 'Assigned 3 available mentors to cohort',
                'target_count': 3
            })

        if intervention_type in ['comprehensive', 'recipe']:
            deployed_interventions.append({
                'type': 'recipe_recommendations',
                'description': 'Deployed track-specific recipe recommendations',
                'target_count': cohort.students_enrolled
            })

        if intervention_type in ['comprehensive', 'quiz']:
            deployed_interventions.append({
                'type': 'quiz_scheduler',
                'description': 'Scheduled quiz retake opportunities',
                'target_count': cohort.students_enrolled
            })

        # Update cohort intervention count
        cohort.ai_interventions_count += len(deployed_interventions)
        cohort.save()

        # Clear cache
        cache_key = f'cohort_detail_{cohort.id}'
        cache.delete(cache_key)

        return {
            'cohort_id': str(cohort.id),
            'deployed_interventions': deployed_interventions,
            'total_deployed': len(deployed_interventions),
            'expected_completion_boost': 0.15  # 15% expected improvement
        }

    @staticmethod
    def _calculate_value_metrics(cohort: SponsorCohort, ai_insights: List[Dict]) -> Dict[str, Any]:
        """Calculate value creation metrics for the cohort"""
        # Mock value calculation - would integrate with employer data
        avg_salary_kes = 2500000  # Mock average salary
        placement_rate = 0.6  # 60% placement rate
        hires = int(cohort.students_enrolled * placement_rate)

        value_created = hires * avg_salary_kes

        return {
            'value_created': value_created,
            'avg_salary_kes': avg_salary_kes,
            'hires': hires,
            'is_over_budget': cohort.budget_allocated > 0 and value_created < cohort.budget_allocated,
            'is_behind_schedule': cohort.target_completion_date and datetime.now().date() > cohort.target_completion_date
        }

    @staticmethod
    def _generate_ai_recommendations(cohort: SponsorCohort, risk_analysis: Dict) -> List[Dict]:
        """Generate AI-powered recommendations for cohort improvement"""
        recommendations = []

        if risk_analysis['at_risk_students'] > 0:
            recommendations.append({
                'type': 'intervention',
                'priority': 'high',
                'title': 'Deploy Dropout Prevention Interventions',
                'description': f'{risk_analysis["at_risk_students"]} students at risk. Deploy nudges and mentor support.',
                'expected_impact': '15% reduction in dropout rate'
            })

        if cohort.completion_rate < 50:
            recommendations.append({
                'type': 'curriculum',
                'priority': 'medium',
                'title': 'Review Curriculum Pacing',
                'description': 'Completion rate below 50%. Consider adjusting module difficulty or adding support resources.',
                'expected_impact': '10-15% improvement in completion'
            })

        if cohort.students_enrolled < cohort.target_size * 0.8:
            recommendations.append({
                'type': 'enrollment',
                'priority': 'low',
                'title': 'Increase Enrollment',
                'description': f'Only {cohort.students_enrolled}/{cohort.target_size} target enrolled. Consider enrollment campaigns.',
                'expected_impact': '20-30% increase in cohort size'
            })

        return recommendations
