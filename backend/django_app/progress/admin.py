"""
Admin configuration for progress app.
"""
from django.contrib import admin
from .models import Progress


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    """
    Admin interface for Progress model.
    """
    list_display = ['user', 'content_type', 'content_id', 'status', 'completion_percentage', 'updated_at']
    list_filter = ['status', 'content_type', 'created_at']
    search_fields = ['user__email', 'content_id']
    readonly_fields = ['created_at', 'updated_at']


