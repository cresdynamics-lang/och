# Generated migration for telemetry fields

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('profiler', '0003_add_retake_request_and_anti_cheat'),
    ]

    operations = [
        migrations.AddField(
            model_name='profilersession',
            name='time_spent_per_module',
            field=models.JSONField(blank=True, default=dict, help_text='Time spent per module in seconds: {"identity_value": 120, "cyber_aptitude": 300, ...}'),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='technical_exposure_score',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Technical exposure score 0-100', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='work_style_cluster',
            field=models.CharField(blank=True, help_text='Work style cluster: "collaborative", "independent", "balanced", etc.', max_length=50),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='scenario_choices',
            field=models.JSONField(blank=True, default=list, help_text='Scenario preference choices: [{question_id: "...", selected_option: "A", ...}]'),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='difficulty_selection',
            field=models.CharField(blank=True, choices=[('novice', 'Novice'), ('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced'), ('elite', 'Elite')], help_text='User-selected difficulty level', max_length=20),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='track_alignment_percentages',
            field=models.JSONField(blank=True, default=dict, help_text='Percentage alignment per track: {"defender": 85.5, "offensive": 72.3, ...}'),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='result_accepted',
            field=models.BooleanField(blank=True, help_text='Whether user accepted the profiler result (True) or overrode it (False)', null=True),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='result_accepted_at',
            field=models.DateTimeField(blank=True, help_text='When result was accepted/overridden', null=True),
        ),
        migrations.AddField(
            model_name='profilersession',
            name='foundations_transition_at',
            field=models.DateTimeField(blank=True, db_index=True, help_text='Timestamp when user transitioned from Profiler to Foundations', null=True),
        ),
    ]
