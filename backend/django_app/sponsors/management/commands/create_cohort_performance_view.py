"""
Create cohort_performance_summary database view for efficient cohort analytics.
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Create cohort_performance_summary database view'

    def handle(self, *args, **options):
        self.stdout.write('Creating cohort_performance_summary view...')

        # Drop the view if it exists
        drop_view_sql = """
        DROP VIEW IF EXISTS cohort_performance_summary;
        """

        # Create the view
        create_view_sql = """
        CREATE VIEW cohort_performance_summary AS
        SELECT
            sc.id as cohort_id,
            sc.name as cohort_name,
            sc.track_slug,
            sc.status,
            sc.target_size,
            sc.students_enrolled,
            sc.completion_rate,
            sc.start_date,
            sc.target_completion_date,
            sc.budget_allocated,
            sc.ai_interventions_count,
            sc.placement_goal,
            sc.created_at,
            sc.updated_at,

            -- Aggregated student metrics
            COUNT(DISTINCT ssc.student_id) as active_students,

            -- Completion metrics (simplified - would be enhanced with real progress data)
            sc.completion_rate as avg_curriculum_completion,

            -- Hiring metrics (placeholder - would integrate with employer module)
            0 as total_hires,  -- Would be calculated from employer events
            0 as pending_interviews,  -- Would be calculated from employer events
            0 as offers_extended,  -- Would be calculated from employer events

            -- Value metrics
            0 as value_created_kes,  -- Would be calculated from salary data
            0 as avg_salary_kes,  -- Would be calculated from placement data

            -- AI readiness metrics (placeholder)
            0 as avg_readiness_score,  -- Would be calculated from AI service
            0 as top_talent_count,  -- Students with readiness > 80

            -- Risk metrics
            0 as at_risk_students,  -- Would be calculated from DropoutRisk service
            0 as blocked_students  -- Students stuck on assessments/quizzes

        FROM sponsor_cohorts sc
        LEFT JOIN sponsor_student_cohorts ssc ON sc.id = ssc.sponsor_cohort_id AND ssc.is_active = true
        GROUP BY sc.id, sc.name, sc.track_slug, sc.status, sc.target_size,
                 sc.students_enrolled, sc.completion_rate, sc.start_date,
                 sc.target_completion_date, sc.budget_allocated,
                 sc.ai_interventions_count, sc.placement_goal,
                 sc.created_at, sc.updated_at;
        """

        with connection.cursor() as cursor:
            try:
                cursor.execute(drop_view_sql)
                cursor.execute(create_view_sql)
                self.stdout.write(self.style.SUCCESS('Successfully created cohort_performance_summary view'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating view: {e}'))
                raise

        self.stdout.write('Cohort performance view created successfully!')
