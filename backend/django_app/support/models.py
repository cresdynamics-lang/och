"""
Support app: problem tracking codes and support tickets.
Enables support role to track issues, categorize by problem code, and resolve tickets.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ProblemCode(models.Model):
    """
    Categorization codes for support issues (e.g. AUTH-001, BILL-002).
    Used for reporting, SLA tracking, and knowledge base.
    """
    code = models.CharField(max_length=32, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=32,
        choices=[
            ('auth', 'Authentication & Access'),
            ('billing', 'Billing & Payments'),
            ('curriculum', 'Curriculum & Learning'),
            ('mentorship', 'Mentorship'),
            ('technical', 'Technical / Bug'),
            ('account', 'Account & Profile'),
            ('platform', 'Platform General'),
            ('other', 'Other'),
        ],
        default='other',
        db_index=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'support_problem_codes'
        ordering = ['category', 'code']
        indexes = [
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return f"{self.code} – {self.name}"


class SupportTicket(models.Model):
    """
    Support ticket with optional problem code for tracking and reporting.
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('pending_customer', 'Pending Customer'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Reference for users/customers (e.g. student, mentor) – who reported or is affected
    reporter_id = models.IntegerField(null=True, blank=True, db_index=True)
    reporter_email = models.EmailField(blank=True)
    reporter_name = models.CharField(max_length=255, blank=True)

    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='open', db_index=True)
    priority = models.CharField(max_length=32, choices=PRIORITY_CHOICES, default='medium', db_index=True)

    problem_code = models.ForeignKey(
        ProblemCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        db_index=True,
    )
    internal_notes = models.TextField(blank=True)

    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_support_tickets',
        db_index=True,
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_support_tickets',
    )

    class Meta:
        db_table = 'support_tickets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['priority', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def __str__(self):
        return f"#{self.id} – {self.subject[:50]}"

    def save(self, *args, **kwargs):
        if self.status in ('resolved', 'closed') and not self.resolved_at:
            self.resolved_at = timezone.now()
        super().save(*args, **kwargs)
