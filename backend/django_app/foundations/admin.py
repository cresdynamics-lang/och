"""
Admin interface for Foundations models.
"""
from django.contrib import admin
from .models import FoundationsModule, FoundationsProgress


@admin.register(FoundationsModule)
class FoundationsModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'module_type', 'order', 'is_mandatory', 'is_active', 'estimated_minutes']
    list_filter = ['module_type', 'is_mandatory', 'is_active']
    search_fields = ['title', 'description']
    ordering = ['order']


@admin.register(FoundationsProgress)
class FoundationsProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'completion_percentage', 'is_complete', 'started_at', 'completed_at']
    list_filter = ['status']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def is_complete(self, obj):
        return obj.is_complete()
    is_complete.boolean = True
