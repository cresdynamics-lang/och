# Generated migration for Mission and MissionProgress enhancements
# Date: 2026-02-09

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0002_initial'),
    ]

    operations = [
        # Mission model enhancements
        migrations.AddField(
            model_name='mission',
            name='code',
            field=models.CharField(blank=True, db_index=True, help_text='Unique mission code like "SIEM-03"', max_length=50, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='mission',
            name='story',
            field=models.TextField(blank=True, help_text='Mission narrative/story context'),
        ),
        migrations.AddField(
            model_name='mission',
            name='story_narrative',
            field=models.TextField(blank=True, help_text='Alternative field for story narrative'),
        ),
        migrations.AddField(
            model_name='mission',
            name='objectives',
            field=models.JSONField(blank=True, default=list, help_text='Array of mission objectives/learning outcomes'),
        ),
        migrations.AddField(
            model_name='mission',
            name='tier',
            field=models.CharField(blank=True, choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced'), ('mastery', 'Mastery')], db_index=True, help_text='Tier: beginner/intermediate/advanced/mastery', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='mission',
            name='track',
            field=models.CharField(blank=True, choices=[('defender', 'Defender'), ('offensive', 'Offensive'), ('grc', 'GRC'), ('innovation', 'Innovation'), ('leadership', 'Leadership')], db_index=True, help_text='Track: defender/offensive/grc/innovation/leadership', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='mission',
            name='recipe_recommendations',
            field=models.JSONField(blank=True, default=list, help_text='Array of recipe slugs/IDs recommended for this mission'),
        ),
        migrations.AddField(
            model_name='mission',
            name='success_criteria',
            field=models.JSONField(blank=True, default=dict, help_text='Success criteria: {technical_accuracy: str, completeness: str, best_practices: str, documentation: str}'),
        ),
        migrations.AddField(
            model_name='mission',
            name='rubric_id',
            field=models.UUIDField(blank=True, db_index=True, help_text='UUID of rubric for scoring', null=True),
        ),
        migrations.AddField(
            model_name='mission',
            name='time_constraint_hours',
            field=models.IntegerField(blank=True, help_text='Time-bound mission deadline in hours (24-168 hours)', null=True, validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AddField(
            model_name='mission',
            name='branching_paths',
            field=models.JSONField(blank=True, default=dict, help_text='Decision points structure: {subtask_id: {decision_id: str, choices: [], consequences: {}}}'),
        ),
        migrations.AddField(
            model_name='mission',
            name='hints',
            field=models.JSONField(blank=True, default=list, help_text='Hints structure: [{subtask_id: int, hint_text: str, hint_level: int}]'),
        ),
        # Add indexes for new fields
        migrations.AddIndex(
            model_name='mission',
            index=models.Index(fields=['code'], name='missions_code_idx'),
        ),
        migrations.AddIndex(
            model_name='mission',
            index=models.Index(fields=['track', 'tier', 'is_active'], name='missions_track_tier_active_idx'),
        ),
        
        # MissionProgress model enhancements
        migrations.AddField(
            model_name='missionprogress',
            name='reflection_required',
            field=models.BooleanField(default=False, help_text='Mission requires reflection submission'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='reflection_submitted',
            field=models.BooleanField(default=False, help_text='Reflection has been submitted'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='decision_paths',
            field=models.JSONField(blank=True, default=dict, help_text='User decisions: {decision_id: choice_id, timestamp: iso}'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='time_per_stage',
            field=models.JSONField(blank=True, default=dict, help_text='Time spent per subtask: {subtask_id: minutes_spent}'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='hints_used',
            field=models.JSONField(blank=True, default=list, help_text='Hints accessed: [{subtask_id: int, hint_level: int, timestamp: iso}]'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='tools_used',
            field=models.JSONField(blank=True, default=list, help_text='Tools used during mission: [tool_name]'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='drop_off_stage',
            field=models.IntegerField(blank=True, help_text='Subtask number where user dropped off', null=True),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='subtask_scores',
            field=models.JSONField(blank=True, default=dict, help_text='Mentor scores per subtask: {subtask_id: score}'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='mentor_recommended_recipes',
            field=models.JSONField(blank=True, default=list, help_text='Recipes recommended by mentor: [recipe_id or slug]'),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='mentor_reviewed_at',
            field=models.DateTimeField(blank=True, help_text='When mentor completed review', null=True),
        ),
    ]
