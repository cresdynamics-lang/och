from django.contrib import admin
from .models import ProblemCode, SupportTicket


@admin.register(ProblemCode)
class ProblemCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['code', 'name']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'status', 'priority', 'problem_code', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'problem_code']
    search_fields = ['subject', 'reporter_email', 'reporter_name']
    raw_id_fields = ['assigned_to', 'created_by']
