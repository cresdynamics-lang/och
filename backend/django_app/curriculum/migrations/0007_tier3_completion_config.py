# Tier 3 (Intermediate) completion: track config and user progress fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0006_beginner_track_requirements'),
    ]

    operations = [
        migrations.AddField(
            model_name='curriculumtrack',
            name='tier3_require_mentor_approval',
            field=models.BooleanField(
                default=False,
                help_text='If True, mentor must approve before Tier 3 (Intermediate) track completion'
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier3_mentor_approval',
            field=models.BooleanField(
                default=False,
                help_text='Mentor approval for Tier 3 completion (if required)'
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier3_completion_requirements_met',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='All Tier 3 requirements met: modules, missions passed, reflections, mentor approval if required'
            ),
        ),
        migrations.AddField(
            model_name='usertrackprogress',
            name='tier4_unlocked',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='User has completed a Tier 3 track and can access Tier 4'
            ),
        ),
    ]
