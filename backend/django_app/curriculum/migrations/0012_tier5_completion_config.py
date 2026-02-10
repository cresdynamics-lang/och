# Tier 5 (Mastery) completion: track config and user progress fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0011_tier4_completion_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='curriculumtrack',
            name='tier5_require_mentor_approval',
            field=models.BooleanField(
                default=False,
                help_text='If True, mentor must approve before Mastery level track completion'
            ),
        ),
        migrations.AddField(
            model_name='curriculumtrack',
            name='mastery_completion_rubric_id',
            field=models.UUIDField(
                blank=True,
                db_index=True,
                help_text='UUID of rubric for Mastery completion validation',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier5_mentor_approval',
            field=models.BooleanField(
                default=False,
                help_text='Mentor approval for Mastery level completion (if required)'
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier5_completion_requirements_met',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='All Mastery level requirements met: mastery missions approved, capstone approved, reflections complete, mastery completion rubric passed'
            ),
        ),
    ]
