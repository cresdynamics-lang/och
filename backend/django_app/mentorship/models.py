"""
Mentorship models for chat messages and file attachments.
"""
import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from users.models import User


def upload_to_chat_attachments(instance, filename):
    """Generate upload path for chat attachments."""
    return f'mentorship/chat/{instance.message_id}/{filename}'


class ChatMessage(models.Model):
    """Chat message between mentee and mentor."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        db_index=True
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_messages',
        null=True,
        blank=True,
        db_index=True
    )
    message = models.TextField()
    sender_type = models.CharField(
        max_length=10,
        choices=[('mentee', 'Mentee'), ('mentor', 'Mentor')],
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_messages'
        indexes = [
            models.Index(fields=['mentee', 'created_at']),
            models.Index(fields=['mentor', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Chat: {self.mentee.email} -> {self.mentor.email if self.mentor else 'All'}"
    
    @property
    def sender_name(self):
        """Get sender name."""
        if self.sender_type == 'mentee':
            return self.mentee.get_full_name() or self.mentee.email
        return self.mentor.get_full_name() if self.mentor else 'Mentor'


class ChatAttachment(models.Model):
    """File attachment for chat messages."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name='attachments',
        db_index=True
    )
    file = models.FileField(
        upload_to=upload_to_chat_attachments,
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip'])
        ],
        max_length=500
    )
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text='File size in bytes')
    content_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_attachments'
        indexes = [
            models.Index(fields=['message', 'created_at']),
        ]
    
    def __str__(self):
        return f"Attachment: {self.filename} ({self.message.id})"
    
    @property
    def url(self):
        """Get file URL."""
        return self.file.url if self.file else None

