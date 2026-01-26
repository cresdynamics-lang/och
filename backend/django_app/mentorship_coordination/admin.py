"""
Admin interface for Mentorship Coordination Engine.
"""
from django.contrib import admin
from .models import MenteeMentorAssignment, MentorSession, MentorWorkQueue, MentorFlag


@admin.register(MenteeMentorAssignment)
class MenteeMentorAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'mentee', 'mentor', 'status', 'sessions_used', 'max_sessions', 'assigned_at']
    list_filter = ['status', 'assigned_at']
    search_fields = ['mentee__email', 'mentor__email']
    raw_id_fields = ['mentee', 'mentor']


@admin.register(MentorSession)
class MentorSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'mentee', 'mentor', 'type', 'start_time', 'attended']
    list_filter = ['type', 'attended', 'start_time']
    search_fields = ['title', 'mentee__email', 'mentor__email']
    raw_id_fields = ['assignment', 'mentee', 'mentor']


@admin.register(MentorWorkQueue)
class MentorWorkQueueAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'mentee', 'mentor', 'type', 'priority', 'status', 'due_at']
    list_filter = ['type', 'priority', 'status', 'due_at']
    search_fields = ['title', 'mentee__email', 'mentor__email']
    raw_id_fields = ['mentor', 'mentee']


@admin.register(MentorFlag)
class MentorFlagAdmin(admin.ModelAdmin):
    list_display = ['id', 'mentee', 'mentor', 'severity', 'resolved', 'director_notified', 'created_at']
    list_filter = ['severity', 'resolved', 'director_notified', 'created_at']
    search_fields = ['reason', 'mentee__email', 'mentor__email']
    raw_id_fields = ['mentor', 'mentee']
