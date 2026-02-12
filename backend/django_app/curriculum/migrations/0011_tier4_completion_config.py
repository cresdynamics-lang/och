# Tier 4 (Advanced) completion: track config and user progress fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0010_curriculummodule_supporting_recipes_slug_lock'),
    ]

    operations = [
        migrations.AddField(
            model_name='curriculumtrack',
            name='tier4_require_mentor_approval',
            field=models.BooleanField(
                default=False,
                help_text='If True, mentor must approve before Tier 4 (Advanced) track completion'
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier4_mentor_approval',
            field=models.BooleanField(
                default=False,
                help_text='Mentor approval for Tier 4 completion (if required)'
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier4_completion_requirements_met',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='All Tier 4 requirements met: modules, advanced missions approved, feedback cycles complete, final reflection submitted'
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier5_unlocked',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='User has completed a Tier 4 track and can access Tier 5 (Mastery)'
            ),
        ),
    ]
