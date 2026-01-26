import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ReadinessScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='readiness_scores')
    score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=100)
    trend = models.FloatField(default=0.0)
    trend_direction = models.CharField(max_length=10, choices=[('up', 'Up'), ('down', 'Down'), ('stable', 'Stable')], default='stable')
    countdown_days = models.IntegerField(default=0)
    countdown_label = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'readiness_scores'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
        ]


class CohortProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cohort_progress')
    cohort_id = models.UUIDField(null=True, blank=True, db_index=True)
    percentage = models.FloatField(default=0.0)
    current_module = models.CharField(max_length=255, blank=True)
    total_modules = models.IntegerField(default=0)
    completed_modules = models.IntegerField(default=0)
    estimated_time_remaining = models.IntegerField(default=0)
    graduation_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cohort_progress'
        unique_together = ['user', 'cohort_id']
        indexes = [
            models.Index(fields=['user', 'cohort_id']),
        ]


class PortfolioItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_items')
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    item_type = models.CharField(max_length=50, default='mission', choices=[
        ('mission', 'Mission'),
        ('reflection', 'Reflection'),
        ('certification', 'Certification'),
        ('github', 'GitHub'),
        ('thm', 'TryHackMe'),
        ('external', 'External'),
        ('other', 'Other'),
    ])
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
    ], default='draft')
    visibility = models.CharField(max_length=20, choices=[
        ('private', 'Private'),
        ('unlisted', 'Unlisted'),
        ('public', 'Public'),
    ], default='private')
    skill_tags = models.TextField(blank=True, null=True, help_text='JSON array of skill tags')
    evidence_files = models.TextField(blank=True, null=True, help_text='JSON array of evidence file objects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'portfolio_items'
        indexes = [
            models.Index(fields=['user', 'status', '-created_at']),
        ]


class MentorshipSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentorship_sessions')
    mentor_name = models.CharField(max_length=255)
    mentor_avatar = models.URLField(blank=True)
    session_type = models.CharField(max_length=20, choices=[
        ('1-on-1', '1-on-1'),
        ('group', 'Group'),
        ('review', 'Review'),
    ], default='1-on-1')
    next_session_date = models.DateField()
    next_session_time = models.TimeField()
    status = models.CharField(max_length=20, choices=[
        ('scheduled', 'Scheduled'),
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mentorship_sessions'
        indexes = [
            models.Index(fields=['user', 'next_session_date', '-created_at']),
        ]


class GamificationPoints(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gamification_points')
    points = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    badges = models.IntegerField(default=0)
    rank = models.CharField(max_length=50, blank=True)
    level = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gamification_points'
        unique_together = ['user']
        indexes = [
            models.Index(fields=['user', '-points']),
        ]


class DashboardEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_events', null=True, blank=True)
    title = models.CharField(max_length=255)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    event_type = models.CharField(max_length=50, choices=[
        ('mission_due', 'Mission Due'),
        ('mentor_session', 'Mentor Session'),
        ('review_meeting', 'Review Meeting'),
        ('ctf', 'CTF'),
        ('workshop', 'Workshop'),
    ])
    urgency = models.CharField(max_length=10, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], default='medium')
    rsvp_required = models.BooleanField(default=False)
    rsvp_status = models.CharField(max_length=20, choices=[
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('pending', 'Pending'),
    ], null=True, blank=True)
    action_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'dashboard_events'
        indexes = [
            models.Index(fields=['user', 'date', '-created_at']),
            models.Index(fields=['date', 'urgency']),
        ]


class CommunityActivity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_activities', null=True, blank=True)
    user_display_name = models.CharField(max_length=255)
    action = models.CharField(max_length=255)
    activity_type = models.CharField(max_length=50, choices=[
        ('mission_completed', 'Mission Completed'),
        ('ctf_launched', 'CTF Launched'),
        ('badge_earned', 'Badge Earned'),
        ('milestone_reached', 'Milestone Reached'),
    ])
    likes = models.IntegerField(default=0)
    action_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['activity_type', '-created_at']),
        ]

