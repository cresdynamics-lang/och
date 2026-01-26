"""
Admin configuration for TalentScope models.
"""
from django.contrib import admin
from .models import SkillSignal, BehaviorSignal, MentorInfluence, ReadinessSnapshot


@admin.register(SkillSignal)
class SkillSignalAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'skill_name', 'skill_category', 'mastery_level', 'created_at']
    list_filter = ['skill_category', 'source', 'created_at']
    search_fields = ['mentee__email', 'skill_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(BehaviorSignal)
class BehaviorSignalAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'behavior_type', 'value', 'recorded_at', 'source']
    list_filter = ['behavior_type', 'source', 'recorded_at']
    search_fields = ['mentee__email']
    readonly_fields = ['id', 'created_at']


@admin.register(MentorInfluence)
class MentorInfluenceAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'mentor', 'influence_index', 'period_start', 'period_end']
    list_filter = ['period_start', 'period_end']
    search_fields = ['mentee__email', 'mentor__email']
    readonly_fields = ['id', 'created_at']


@admin.register(ReadinessSnapshot)
class ReadinessSnapshotAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'core_readiness_score', 'career_readiness_stage', 'snapshot_date']
    list_filter = ['career_readiness_stage', 'snapshot_date']
    search_fields = ['mentee__email']
    readonly_fields = ['id', 'created_at']
