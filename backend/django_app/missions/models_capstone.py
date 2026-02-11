"""
Capstone Project Model for Mastery Tracks
Final real-world scenario requiring investigation, decision-making, design/remediation, reporting, and presentation.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()

# Note: Mission model is imported via string reference to avoid circular imports

class CapstoneProject(models.Model):
    """Capstone Project for Mastery Tracks - Final comprehensive real-world scenario"""

    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('investigation', 'Investigation Phase'),
        ('decision_making', 'Decision Making Phase'),
        ('design_remediation', 'Design/Remediation Phase'),
        ('reporting', 'Reporting Phase'),
        ('presentation', 'Presentation Phase'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('revision_requested', 'Revision Requested'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='capstone_projects',
        db_column='user_id',
        db_index=True
    )
    mission = models.ForeignKey(
        'Mission', # String reference to Mission model
        on_delete=models.CASCADE,
        related_name='capstone_projects',
        db_index=True,
        help_text='Reference to the capstone mission'
    )
    track = models.CharField(
        max_length=20,
        choices=[
            ('defender', 'Defender'),
            ('offensive', 'Offensive'),
            ('grc', 'GRC'),
            ('innovation', 'Innovation'),
            ('leadership', 'Leadership'),
        ],
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )

    # Investigation Phase
    investigation_findings = models.JSONField(
        default=dict,
        blank=True,
        help_text='Investigation findings: {threats: [], vulnerabilities: [], timeline: {}, evidence: []}'
    )
    investigation_artifacts = models.JSONField(
        default=list,
        blank=True,
        help_text='Investigation artifacts: [{type: str, url: str, description: str}]'
    )
    investigation_completed_at = models.DateTimeField(null=True, blank=True)

    # Decision-Making Phase
    decisions_made = models.JSONField(
        default=list,
        blank=True,
        help_text='Decisions made: [{decision_id: str, choice_id: str, rationale: str, timestamp: iso}]'
    )
    decision_analysis = models.TextField(
        blank=True,
        help_text='Analysis of decision-making process and rationale'
    )
    decision_making_completed_at = models.DateTimeField(null=True, blank=True)

    # Design/Remediation Phase
    design_documents = models.JSONField(
        default=list,
        blank=True,
        help_text='Design/remediation documents: [{type: str, url: str, description: str}]'
    )
    remediation_plan = models.TextField(
        blank=True,
        help_text='Detailed remediation plan'
    )
    design_remediation_completed_at = models.DateTimeField(null=True, blank=True)

    # Reporting Phase
    report_document_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to final report document'
    )
    report_summary = models.TextField(
        blank=True,
        help_text='Executive summary of the report'
    )
    report_key_findings = models.JSONField(
        default=list,
        blank=True,
        help_text='Key findings: [{finding: str, impact: str, recommendation: str}]'
    )
    reporting_completed_at = models.DateTimeField(null=True, blank=True)

    # Presentation Phase
    presentation_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to presentation (video, slides, etc.)'
    )
    presentation_type = models.CharField(
        max_length=20,
        choices=[
            ('video', 'Video'),
            ('slides', 'Slides'),
            ('document', 'Document'),
            ('interactive', 'Interactive'),
        ],
        blank=True,
        null=True
    )
    presentation_notes = models.TextField(
        blank=True,
        help_text='Presentation notes or transcript'
    )
    presentation_completed_at = models.DateTimeField(null=True, blank=True)

    # Mentor Review
    mentor_review_phases = models.JSONField(
        default=list,
        blank=True,
        help_text='Multi-phase mentor reviews: [{phase: str, feedback: str, score: float, reviewed_at: iso}]'
    )
    mentor_feedback_audio_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to mentor audio feedback'
    )
    mentor_feedback_video_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to mentor video feedback'
    )
    mentor_final_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Final mentor score 0-100'
    )
    mentor_approved = models.BooleanField(default=False)
    mentor_reviewed_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'capstone_projects'
        unique_together = [['user', 'mission']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['mission', 'status']),
            models.Index(fields=['track', 'status']),
            models.Index(fields=['user', 'track']),
            models.Index(fields=['submitted_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.mission.title} ({self.status})"

    def get_current_phase(self):
        """Get the current phase based on completion timestamps"""
        if self.presentation_completed_at:
            return 'presentation'
        elif self.reporting_completed_at:
            return 'reporting'
        elif self.design_remediation_completed_at:
            return 'design_remediation'
        elif self.decision_making_completed_at:
            return 'decision_making'
        elif self.investigation_completed_at:
            return 'investigation'
        else:
            return 'not_started'

    def is_phase_complete(self, phase):
        """Check if a specific phase is complete"""
        phase_map = {
            'investigation': self.investigation_completed_at,
            'decision_making': self.decision_making_completed_at,
            'design_remediation': self.design_remediation_completed_at,
            'reporting': self.reporting_completed_at,
            'presentation': self.presentation_completed_at,
        }
        return phase_map.get(phase) is not None
