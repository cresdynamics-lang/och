"""
Admin interface for mentorship models.
"""
from django.contrib import admin
from .models import ChatMessage, ChatAttachment


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'mentee', 'mentor', 'sender_type', 'created_at']
    list_filter = ['sender_type', 'created_at']
    search_fields = ['mentee__email', 'mentor__email', 'message']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(ChatAttachment)
class ChatAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'filename', 'file_size', 'created_at']
    list_filter = ['created_at', 'content_type']
    search_fields = ['filename', 'message__mentee__email']
    readonly_fields = ['id', 'created_at']

