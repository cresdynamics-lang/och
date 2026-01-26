"""
Serializers for mentorship chat and attachments.
"""
from rest_framework import serializers
from .models import ChatMessage, ChatAttachment


class ChatAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for chat attachments."""
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatAttachment
        fields = ['id', 'filename', 'url', 'file_size', 'content_type', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_url(self, obj):
        """Get file URL."""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""
    sender_name = serializers.CharField(read_only=True)
    attachments = ChatAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'message', 'sender_type', 'sender_name',
            'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatMessageCreateSerializer(serializers.Serializer):
    """Serializer for creating chat messages with file uploads."""
    message = serializers.CharField(required=True, allow_blank=True)
    mentor_id = serializers.UUIDField(required=False, allow_null=True)
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True
    )

