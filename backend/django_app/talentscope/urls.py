"""
URL configuration for TalentScope API.
"""
from django.urls import path
from . import views

app_name = 'talentscope'

urlpatterns = [
    path(
        'mentees/<int:mentee_id>/readiness-over-time',
        views.readiness_over_time,
        name='readiness-over-time'
    ),
    path(
        'mentees/<int:mentee_id>/skills-heatmap',
        views.skills_heatmap,
        name='skills-heatmap'
    ),
    path(
        'mentees/<int:mentee_id>/skills',
        views.skill_mastery,
        name='skill-mastery'
    ),
    path(
        'mentees/<int:mentee_id>/behavioral-trends',
        views.behavioral_trends,
        name='behavioral-trends'
    ),
    path(
        'mentees/<int:mentee_id>/readiness-window',
        views.readiness_window,
        name='readiness-window'
    ),
    path(
        'mentees/<int:mentee_id>/export',
        views.export_report,
        name='export-report'
    ),
]
