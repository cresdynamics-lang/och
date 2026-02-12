# Generated migration for Mastery Track enhancements
# Adds escalation_events, environmental_cues to Mission model
# Creates CapstoneProject and MentorshipInteraction models

from django.db import migrations, models
import django.core.validators
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('missions', '0004_mastery_enhancements'),
        ('users', '0006_sqlite_compatible'),  # Use latest users migration
    ]

    operations = [
        # Add escalation_events and environmental_cues to Mission model
        migrations.AddField(
            model_name='mission',
            name='escalation_events',
            field=models.JSONField(blank=True, default=list, help_text='Escalation events: [{subtask_id: int, event_type: str, description: str, triggers: [], consequences: {}}]'),
        ),
        migrations.AddField(
            model_name='mission',
            name='environmental_cues',
            field=models.JSONField(blank=True, default=list, help_text='Environmental cues: [{subtask_id: int, cue_type: str, description: str, location: str, significance: str}]'),
        ),
        
        # Create CapstoneProject model
        migrations.CreateModel(
            name='CapstoneProject',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('track', models.CharField(choices=[('defender', 'Defender'), ('offensive', 'Offensive'), ('grc', 'GRC'), ('innovation', 'Innovation'), ('leadership', 'Leadership')], db_index=True, max_length=20)),
                ('status', models.CharField(choices=[('not_started', 'Not Started'), ('investigation', 'Investigation Phase'), ('decision_making', 'Decision Making Phase'), ('design_remediation', 'Design/Remediation Phase'), ('reporting', 'Reporting Phase'), ('presentation', 'Presentation Phase'), ('submitted', 'Submitted'), ('under_review', 'Under Review'), ('approved', 'Approved'), ('revision_requested', 'Revision Requested'), ('failed', 'Failed')], db_index=True, default='not_started', max_length=20)),
                ('investigation_findings', models.JSONField(blank=True, default=dict, help_text='Investigation findings: {threats: [], vulnerabilities: [], timeline: {}, evidence: []}')),
                ('investigation_artifacts', models.JSONField(blank=True, default=list, help_text='Investigation artifacts: [{type: str, url: str, description: str}]')),
                ('investigation_completed_at', models.DateTimeField(blank=True, null=True)),
                ('decisions_made', models.JSONField(blank=True, default=list, help_text='Decisions made: [{decision_id: str, choice_id: str, rationale: str, timestamp: iso}]')),
                ('decision_analysis', models.TextField(blank=True, help_text='Analysis of decision-making process and rationale')),
                ('decision_making_completed_at', models.DateTimeField(blank=True, null=True)),
                ('design_documents', models.JSONField(blank=True, default=list, help_text='Design/remediation documents: [{type: str, url: str, description: str}]')),
                ('remediation_plan', models.TextField(blank=True, help_text='Detailed remediation plan')),
                ('design_remediation_completed_at', models.DateTimeField(blank=True, null=True)),
                ('report_document_url', models.URLField(blank=True, help_text='URL to final report document', max_length=500, null=True)),
                ('report_summary', models.TextField(blank=True, help_text='Executive summary of the report')),
                ('report_key_findings', models.JSONField(blank=True, default=list, help_text='Key findings: [{finding: str, impact: str, recommendation: str}]')),
                ('reporting_completed_at', models.DateTimeField(blank=True, null=True)),
                ('presentation_url', models.URLField(blank=True, help_text='URL to presentation (video, slides, etc.)', max_length=500, null=True)),
                ('presentation_type', models.CharField(blank=True, choices=[('video', 'Video'), ('slides', 'Slides'), ('document', 'Document'), ('interactive', 'Interactive')], max_length=20, null=True)),
                ('presentation_notes', models.TextField(blank=True, help_text='Presentation notes or transcript')),
                ('presentation_completed_at', models.DateTimeField(blank=True, null=True)),
                ('mentor_review_phases', models.JSONField(blank=True, default=list, help_text='Multi-phase mentor reviews: [{phase: str, feedback: str, score: float, reviewed_at: iso}]')),
                ('mentor_feedback_audio_url', models.URLField(blank=True, help_text='URL to mentor audio feedback', max_length=500, null=True)),
                ('mentor_feedback_video_url', models.URLField(blank=True, help_text='URL to mentor video feedback', max_length=500, null=True)),
                ('mentor_final_score', models.DecimalField(blank=True, decimal_places=2, help_text='Final mentor score 0-100', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('mentor_approved', models.BooleanField(default=False)),
                ('mentor_reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('submitted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('mission', models.ForeignKey(db_index=True, help_text='Reference to the capstone mission', on_delete=models.CASCADE, related_name='capstone_projects', to='missions.mission')),
                ('user', models.ForeignKey(db_column='user_id', db_index=True, on_delete=models.CASCADE, related_name='capstone_projects', to='users.user')),
            ],
            options={
                'db_table': 'capstone_projects',
            },
        ),
        
        # Create MentorshipInteraction model
        migrations.CreateModel(
            name='MentorshipInteraction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('interaction_type', models.CharField(choices=[('mission_review', 'Mission Review'), ('capstone_review', 'Capstone Review'), ('subtask_review', 'Subtask Review'), ('decision_review', 'Decision Point Review'), ('scoring_meeting', 'Scoring Meeting'), ('feedback_session', 'Feedback Session'), ('progress_check', 'Progress Check')], db_index=True, max_length=20)),
                ('phase', models.CharField(blank=True, choices=[('investigation', 'Investigation Phase'), ('decision_making', 'Decision Making Phase'), ('design_remediation', 'Design/Remediation Phase'), ('reporting', 'Reporting Phase'), ('presentation', 'Presentation Phase'), ('final', 'Final Review')], help_text='Phase of mission/capstone being reviewed', max_length=20, null=True)),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], db_index=True, default='scheduled', max_length=20)),
                ('review_phase', models.IntegerField(default=1, help_text='Review phase number (1, 2, 3, etc.) for multi-phase reviews')),
                ('total_phases', models.IntegerField(default=1, help_text='Total number of review phases')),
                ('written_feedback', models.TextField(blank=True, help_text='Written feedback from mentor')),
                ('feedback_per_subtask', models.JSONField(blank=True, default=dict, help_text='Feedback per subtask: {subtask_id: feedback_text}')),
                ('feedback_per_decision', models.JSONField(blank=True, default=dict, help_text='Feedback per decision point: {decision_id: feedback_text}')),
                ('audio_feedback_url', models.URLField(blank=True, help_text='URL to audio feedback recording', max_length=500, null=True)),
                ('video_feedback_url', models.URLField(blank=True, help_text='URL to video feedback recording', max_length=500, null=True)),
                ('audio_duration_seconds', models.IntegerField(blank=True, help_text='Duration of audio feedback in seconds', null=True)),
                ('video_duration_seconds', models.IntegerField(blank=True, help_text='Duration of video feedback in seconds', null=True)),
                ('rubric_scores', models.JSONField(blank=True, default=dict, help_text='Rubric-based scores: {criterion: score}')),
                ('subtask_scores', models.JSONField(blank=True, default=dict, help_text='Scores per subtask: {subtask_id: score}')),
                ('overall_score', models.DecimalField(blank=True, decimal_places=2, help_text='Overall score 0-100', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('is_scoring_meeting', models.BooleanField(default=False, help_text='If True, this is a dedicated scoring meeting')),
                ('meeting_notes', models.TextField(blank=True, help_text='Notes from scoring meeting')),
                ('meeting_duration_minutes', models.IntegerField(blank=True, help_text='Duration of scoring meeting in minutes', null=True)),
                ('recommended_next_steps', models.JSONField(blank=True, default=list, help_text='Recommended next steps: [{action: str, priority: str, deadline: date}]')),
                ('recommended_recipes', models.JSONField(blank=True, default=list, help_text='Recommended recipes: [recipe_id or slug]')),
                ('scheduled_at', models.DateTimeField(blank=True, help_text='Scheduled time for interaction', null=True)),
                ('started_at', models.DateTimeField(blank=True, help_text='When interaction started', null=True)),
                ('completed_at', models.DateTimeField(blank=True, db_index=True, help_text='When interaction completed', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('capstone_project', models.ForeignKey(blank=True, db_index=True, help_text='Related capstone project (if applicable)', null=True, on_delete=models.CASCADE, related_name='mentorship_interactions', to='missions.capstoneproject')),
                ('mentee', models.ForeignKey(db_column='mentee_id', db_index=True, on_delete=models.CASCADE, related_name='mentorship_interactions_received', to='users.user')),
                ('mentor', models.ForeignKey(db_column='mentor_id', db_index=True, on_delete=models.CASCADE, related_name='mentorship_interactions_given', to='users.user')),
                ('mission', models.ForeignKey(blank=True, db_index=True, help_text='Related mission (if applicable)', null=True, on_delete=models.CASCADE, related_name='mentorship_interactions', to='missions.mission')),
            ],
            options={
                'db_table': 'mentorship_interactions',
            },
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name='capstoneproject',
            index=models.Index(fields=['user', 'status'], name='capstone_pr_user_id_status_idx'),
        ),
        migrations.AddIndex(
            model_name='capstoneproject',
            index=models.Index(fields=['mission', 'status'], name='capstone_pr_mission_status_idx'),
        ),
        migrations.AddIndex(
            model_name='capstoneproject',
            index=models.Index(fields=['track', 'status'], name='capstone_pr_track_status_idx'),
        ),
        migrations.AddIndex(
            model_name='capstoneproject',
            index=models.Index(fields=['user', 'track'], name='capstone_pr_user_track_idx'),
        ),
        migrations.AddIndex(
            model_name='capstoneproject',
            index=models.Index(fields=['submitted_at'], name='capstone_pr_submitted_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipinteraction',
            index=models.Index(fields=['mentor', 'status'], name='mentorship_i_mentor_status_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipinteraction',
            index=models.Index(fields=['mentee', 'status'], name='mentorship_i_mentee_status_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipinteraction',
            index=models.Index(fields=['mission', 'status'], name='mentorship_i_mission_status_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipinteraction',
            index=models.Index(fields=['capstone_project', 'status'], name='mentorship_i_capstone_status_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipinteraction',
            index=models.Index(fields=['interaction_type', 'status'], name='mentorship_i_type_status_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipinteraction',
            index=models.Index(fields=['phase', 'status'], name='mentorship_i_phase_status_idx'),
        ),
        migrations.AddIndex(
            model_name='mentorshipinteraction',
            index=models.Index(fields=['completed_at'], name='mentorship_i_completed_idx'),
        ),
        
        # Add unique constraint for CapstoneProject
        migrations.AddConstraint(
            model_name='capstoneproject',
            constraint=models.UniqueConstraint(fields=['user', 'mission'], name='unique_user_capstone_mission'),
        ),
    ]
