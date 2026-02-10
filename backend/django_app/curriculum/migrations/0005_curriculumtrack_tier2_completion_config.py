# Generated manually for Beginner Tracks alignment (admin-configurable completion)

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('curriculum', '0004_crosstrackprogramprogress_crosstracksubmission'),
    ]

    operations = [
        migrations.AddField(
            model_name='curriculumtrack',
            name='tier2_mini_missions_required',
            field=models.IntegerField(
                default=1,
                help_text='Minimum mini-missions required to complete this Beginner track (1 or 2)',
                validators=[MinValueValidator(1), MaxValueValidator(2)]
            ),
        ),
        migrations.AddField(
            model_name='curriculumtrack',
            name='tier2_require_mentor_approval',
            field=models.BooleanField(
                default=False,
                help_text='If True, mentor must approve before Tier 2 completion'
            ),
        ),
    ]
