"""
Serializers for Mentorship Coordination Engine.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MenteeMentorAssignment, MentorSession, MentorWorkQueue, MentorFlag, MentorshipMessage, MessageAttachment, NotificationLog

User = get_user_model()


class MenteeMentorAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for mentor-mentee assignments."""
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentor_email = serializers.EmailField(source='mentor.email', read_only=True)
    mentor_name = serializers.CharField(source='mentor.get_full_name', read_only=True)
    
    class Meta:
        model = MenteeMentorAssignment
        fields = [
            'id', 'mentee', 'mentee_email', 'mentee_name',
            'mentor', 'mentor_email', 'mentor_name',
            'cohort_id', 'status', 'assigned_at',
            'max_sessions', 'sessions_used', 'mentor_notes', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_at', 'updated_at']


class MentorSessionSerializer(serializers.ModelSerializer):
    """Serializer for mentor sessions."""
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    mentor_name = serializers.CharField(source='mentor.get_full_name', read_only=True)
    
    class Meta:
        model = MentorSession
        fields = [
            'id', 'assignment', 'mentee', 'mentee_name', 'mentee_email',
            'mentor', 'mentor_name', 'title', 'type',
            'start_time', 'end_time', 'zoom_url', 'calendar_event_id',
            'notes', 'outcomes', 'attended', 'no_show_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorWorkQueueSerializer(serializers.ModelSerializer):
    """Serializer for mentor work queue."""
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    sla_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = MentorWorkQueue
        fields = [
            'id', 'mentor', 'mentee', 'mentee_name', 'mentee_email',
            'type', 'priority', 'title', 'description', 'reference_id',
            'sla_hours', 'due_at', 'completed_at', 'status',
            'sla_remaining', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_sla_remaining(self, obj):
        """Calculate remaining SLA time."""
        if obj.completed_at or not obj.due_at:
            return None
        from django.utils import timezone
        delta = obj.due_at - timezone.now()
        if delta.total_seconds() < 0:
            return "OVERDUE"
        hours = int(delta.total_seconds() / 3600)
        minutes = int((delta.total_seconds() % 3600) / 60)
        return f"{hours}h {minutes}m ⏰"


class MentorFlagSerializer(serializers.ModelSerializer):
    """Serializer for mentor flags."""
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    mentee_id = serializers.CharField(source='mentee.id', read_only=True)
    mentor_name = serializers.CharField(source='mentor.get_full_name', read_only=True, allow_null=True)
    flag_type = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    raised_by = serializers.CharField(source='mentor.id', read_only=True)
    raised_at = serializers.DateTimeField(source='created_at', read_only=True)
    status = serializers.SerializerMethodField()
    
    def get_flag_type(self, obj):
        """Extract flag_type from reason if it matches known patterns, otherwise return 'struggling' as default."""
        reason = obj.reason or ''
        # Check if reason contains a flag_type pattern (look for "Flag Type: X" pattern)
        if 'Flag Type:' in reason:
            flag_type_part = reason.split('Flag Type:')[1].split('|')[0].strip()
            if flag_type_part in ['struggling', 'at_risk', 'needs_attention', 'technical_issue']:
                return flag_type_part
        # Check if reason contains a flag_type pattern directly
        for flag_type in ['struggling', 'at_risk', 'needs_attention', 'technical_issue']:
            if flag_type in reason.lower():
                return flag_type
        # Default to 'struggling' if no pattern matches
        return 'struggling'
    
    def get_description(self, obj):
        """Extract description from reason, removing flag_type prefix if present."""
        reason = obj.reason or ''
        # Remove "Flag Type: X |" prefix if present
        if 'Flag Type:' in reason and '|' in reason:
            parts = reason.split('|', 1)
            if len(parts) > 1:
                return parts[1].strip()
        return reason
    
    def get_status(self, obj):
        """Map resolved boolean to status string."""
        if obj.resolved:
            return 'resolved'
        return 'open'
    
    class Meta:
        model = MentorFlag
        fields = [
            'id', 'mentor', 'mentor_name', 'mentee', 'mentee_id', 'mentee_name', 'mentee_email',
            'reason', 'description', 'flag_type', 'severity', 'resolved', 'status', 'resolved_at',
            'director_notified', 'created_at', 'raised_by', 'raised_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreateSessionSerializer(serializers.Serializer):
    """Serializer for creating a mentor session."""
    mentee_id = serializers.UUIDField(required=False)
    title = serializers.CharField(max_length=200)
    start_time = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(default=45, min_value=15, max_value=120)
    type = serializers.ChoiceField(choices=MentorSession.TYPE_CHOICES, default='one_on_one')


class CreateGroupSessionSerializer(serializers.Serializer):
    """Serializer for creating a group mentorship session."""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    scheduled_at = serializers.CharField()  # Accept as string first, then parse in validation
    duration_minutes = serializers.IntegerField(default=60, min_value=15, max_value=240, required=False)
    meeting_type = serializers.ChoiceField(
        choices=[('zoom', 'Zoom'), ('google_meet', 'Google Meet'), ('in_person', 'In Person')], 
        default='zoom',
        required=False
    )
    meeting_link = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    track_assignment = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100, default='')
    cohort_id = serializers.UUIDField(required=False, allow_null=True)
    
    def validate_scheduled_at(self, value):
        """Parse scheduled_at string and ensure it's timezone-aware."""
        from django.utils import timezone as django_timezone
        from datetime import datetime, timezone as dt_timezone
        
        if not isinstance(value, str):
            raise serializers.ValidationError("scheduled_at must be a string")
        
        original_value = value
        
        # Remove Z suffix and parse manually for better control
        clean_value = value.replace('Z', '')
        
        # Try parsing with different formats (in order of specificity)
        dt = None
        
        # Count colons in time part to determine format
        time_part = clean_value.split('T')[1] if 'T' in clean_value else clean_value.split(' ')[1] if ' ' in clean_value else ''
        colon_count = time_part.count(':') if time_part else 0
        
        formats_to_try = []
        
        # With microseconds: 2026-02-02T06:00:00.000
        if '.' in clean_value:
            formats_to_try.append(('%Y-%m-%dT%H:%M:%S.%f', clean_value))
        
        # With seconds: 2026-02-02T06:00:00 (2 colons in time part)
        if colon_count == 2:
            formats_to_try.append(('%Y-%m-%dT%H:%M:%S', clean_value))
            formats_to_try.append(('%Y-%m-%d %H:%M:%S', clean_value.replace('T', ' ')))
        
        # Without seconds: 2026-02-02T06:00 (1 colon in time part - DateTimePicker format)
        if colon_count == 1:
            formats_to_try.append(('%Y-%m-%dT%H:%M', clean_value))
            formats_to_try.append(('%Y-%m-%d %H:%M', clean_value.replace('T', ' ')))
        
        # Try all formats
            for fmt, val in formats_to_try:
                try:
                    dt = datetime.strptime(val, fmt)
                # Make timezone-aware (assume UTC if no timezone info)
                    if django_timezone.is_naive(dt):
                        dt = django_timezone.make_aware(dt, dt_timezone.utc)
                    return dt
                except ValueError:
                    continue
            
            # If all parsing attempts failed
            raise serializers.ValidationError(
                f"Invalid datetime format: '{original_value}'. "
            f"Expected ISO 8601 format (e.g., '2026-02-02T06:00:00Z', '2026-02-02T06:00:00.000Z', or '2026-02-02T06:00')."
            )


class MissionReviewSerializer(serializers.Serializer):
    """Serializer for mission review."""
    score = serializers.IntegerField(min_value=0, max_value=100)
    feedback = serializers.CharField()
    approved = serializers.BooleanField()
    competencies = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class CreateFlagSerializer(serializers.Serializer):
    """Serializer for creating a risk flag."""
    mentee_id = serializers.CharField()  # Accept string, convert to UUID in validate
    reason = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)  # Frontend sends 'description'
    flag_type = serializers.ChoiceField(
        choices=[
            ('struggling', 'Struggling'),
            ('at_risk', 'At Risk'),
            ('needs_attention', 'Needs Attention'),
            ('technical_issue', 'Technical Issue'),
        ],
        required=False
    )
    severity = serializers.ChoiceField(choices=MentorFlag.SEVERITY_CHOICES, default='medium')
    
    def validate_mentee_id(self, value):
        """Convert string to appropriate type (UUID or int)."""
        import uuid
        if isinstance(value, str):
            # Try UUID first
            try:
                return uuid.UUID(value)
            except ValueError:
                # If not UUID, try integer (user ID)
                try:
                    int_value = int(value)
                    # Return as string - the view will handle conversion
                    return str(int_value)
                except ValueError:
                    raise serializers.ValidationError(f"Invalid mentee_id format: {value}. Must be UUID or integer.")
        return value
    
    def validate(self, attrs):
        """Ensure either reason or description is provided."""
        if not attrs.get('reason') and not attrs.get('description'):
            raise serializers.ValidationError("Either 'reason' or 'description' must be provided.")
        return attrs


class RequestSessionSerializer(serializers.Serializer):
    """Serializer for students to request a mentorship session."""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    preferred_date = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(default=45, min_value=15, max_value=120)
    type = serializers.ChoiceField(choices=MentorSession.TYPE_CHOICES, default='one_on_one', required=False)


class MessageAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for message attachments."""
    file = serializers.SerializerMethodField()
    
    def get_file(self, obj):
        """Return full URL for the file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            # Fallback to relative URL if no request context
            return obj.file.url
        return None
    
    class Meta:
        model = MessageAttachment
        fields = ['id', 'filename', 'file_size', 'content_type', 'file', 'created_at']
        read_only_fields = ['id', 'created_at']


class MentorshipMessageSerializer(serializers.ModelSerializer):
    """Serializer for mentorship messages."""
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    recipient_email = serializers.SerializerMethodField()
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    
    def get_sender_name(self, obj):
        if not obj.sender:
            return ''
        try:
            # Try get_full_name() if it exists, otherwise use first_name + last_name or email
            if hasattr(obj.sender, 'get_full_name'):
                name = obj.sender.get_full_name()
                if name:
                    return name
            # Fallback to first_name + last_name
            if hasattr(obj.sender, 'first_name') and hasattr(obj.sender, 'last_name'):
                full_name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
                if full_name:
                    return full_name
            # Final fallback to email
            return obj.sender.email or ''
        except Exception:
            return obj.sender.email or ''
    
    def get_sender_email(self, obj):
        return obj.sender.email if obj.sender else ''
    
    def get_recipient_name(self, obj):
        if not obj.recipient:
            return ''
        try:
            # Try get_full_name() if it exists, otherwise use first_name + last_name or email
            if hasattr(obj.recipient, 'get_full_name'):
                name = obj.recipient.get_full_name()
                if name:
                    return name
            # Fallback to first_name + last_name
            if hasattr(obj.recipient, 'first_name') and hasattr(obj.recipient, 'last_name'):
                full_name = f"{obj.recipient.first_name} {obj.recipient.last_name}".strip()
                if full_name:
                    return full_name
            # Final fallback to email
            return obj.recipient.email or ''
        except Exception:
            return obj.recipient.email or ''
    
    def get_recipient_email(self, obj):
        return obj.recipient.email if obj.recipient else ''
    
    sender = serializers.SerializerMethodField()
    recipient = serializers.SerializerMethodField()
    
    def get_sender(self, obj):
        if not obj.sender:
            return None
        return {
            'id': str(obj.sender.id),
            'name': self.get_sender_name(obj),
            'email': self.get_sender_email(obj)
        }
    
    def get_recipient(self, obj):
        if not obj.recipient:
            return None
        return {
            'id': str(obj.recipient.id),
            'name': self.get_recipient_name(obj),
            'email': self.get_recipient_email(obj)
        }
    
    class Meta:
        model = MentorshipMessage
        fields = [
            'id', 'message_id', 'assignment', 'sender', 'sender_name', 'sender_email',
            'recipient', 'recipient_name', 'recipient_email', 'subject', 'body',
            'is_read', 'read_at', 'archived', 'archived_at', 'attachments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'message_id', 'assignment', 'sender', 'recipient', 'created_at', 'updated_at', 'read_at', 'archived_at']


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a message."""
    assignment_id = serializers.UUIDField(help_text='Mentor-mentee assignment ID')
    recipient_id = serializers.IntegerField(help_text='Recipient user ID')
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True)
    body = serializers.CharField(help_text='Message content')


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for notification logs."""
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'notification_id', 'assignment', 'session', 'recipient',
            'recipient_name', 'recipient_email', 'notification_type', 'channel',
            'subject', 'message', 'status', 'sent_at', 'delivered_at',
            'error_message', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'notification_id', 'created_at', 'sent_at', 'delivered_at']


class CreateNotificationSerializer(serializers.Serializer):
    """Serializer for creating a notification."""
    assignment_id = serializers.UUIDField(required=False, allow_null=True)
    session_id = serializers.UUIDField(required=False, allow_null=True)
    recipient_id = serializers.IntegerField(help_text='Recipient user ID')
    notification_type = serializers.ChoiceField(choices=NotificationLog.TYPE_CHOICES)
    channel = serializers.ChoiceField(choices=NotificationLog.CHANNEL_CHOICES, default='email')
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True)
    message = serializers.CharField(help_text='Notification message content')
    metadata = serializers.JSONField(required=False, default=dict)

