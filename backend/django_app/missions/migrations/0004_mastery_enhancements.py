# Mastery-level enhancements: templates, ideal_path, presentation, audio/video feedback

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0003_add_mission_enhancements'),
    ]

    operations = [
        migrations.AddField(
            model_name='mission',
            name='templates',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Professional templates: [{type: str, url: str, description: str}]'
            ),
        ),
        migrations.AddField(
            model_name='mission',
            name='ideal_path',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Ideal mission path for comparison: {subtask_id: {decision_id: str, choice_id: str, rationale: str}}'
            ),
        ),
        migrations.AddField(
            model_name='mission',
            name='presentation_required',
            field=models.BooleanField(
                default=False,
                help_text='If True, mission requires presentation submission (Mastery/Capstone)'
            ),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='presentation_submitted',
            field=models.BooleanField(
                default=False,
                help_text='Presentation has been submitted (Mastery/Capstone)'
            ),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='presentation_url',
            field=models.URLField(
                blank=True,
                help_text='URL to presentation (video, slides, etc.)',
                max_length=500,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='mentor_feedback_audio_url',
            field=models.URLField(
                blank=True,
                help_text='URL to mentor audio feedback',
                max_length=500,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='missionprogress',
            name='mentor_feedback_video_url',
            field=models.URLField(
                blank=True,
                help_text='URL to mentor video feedback',
                max_length=500,
                null=True
            ),
        ),
    ]
