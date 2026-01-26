"""
Coaching OS Admin Configuration.
"""
from django.contrib import admin
from .models import Habit, HabitLog, Goal, Reflection, AICoachSession, AICoachMessage


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'name', 'type', 'frequency', 'streak', 'longest_streak', 'is_active', 'created_at']
    list_filter = ['type', 'frequency', 'is_active', 'created_at']
    search_fields = ['user__email', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['user']


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'habit', 'user', 'date', 'status', 'logged_at']
    list_filter = ['status', 'date', 'logged_at']
    search_fields = ['habit__name', 'user__email']
    readonly_fields = ['id', 'logged_at']
    raw_id_fields = ['habit', 'user']


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'title', 'progress', 'target', 'status', 'due_date', 'created_at']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['user__email', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['user']


@admin.register(Reflection)
class ReflectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'date', 'sentiment', 'word_count', 'created_at']
    list_filter = ['sentiment', 'date', 'created_at']
    search_fields = ['user__email', 'content']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['user']


@admin.register(AICoachSession)
class AICoachSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_type', 'prompt_count', 'created_at']
    list_filter = ['session_type', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['user']


@admin.register(AICoachMessage)
class AICoachMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'context', 'created_at']
    list_filter = ['role', 'context', 'created_at']
    search_fields = ['content', 'session__user__email']
    readonly_fields = ['id', 'created_at']
    raw_id_fields = ['session']
