# Generated manually for assignment_type and track_id on MenteeMentorAssignment

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mentorship_coordination', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='menteementorassignment',
            name='track_id',
            field=models.CharField(blank=True, db_index=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='menteementorassignment',
            name='assignment_type',
            field=models.CharField(
                choices=[('cohort', 'Cohort'), ('track', 'Track'), ('direct', 'Direct')],
                db_index=True,
                default='cohort',
                max_length=20,
            ),
        ),
    ]
