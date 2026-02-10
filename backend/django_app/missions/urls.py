"""
Missions URL configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MissionViewSet, get_sample_mission
from .views_student import (
    list_student_missions,
    get_mission_detail,
    get_mission_funnel,
    submit_mission_for_ai,
    upload_mission_artifacts,
    save_mission_draft,
    submit_for_mentor_review,
    start_mission_student,
    get_mission_progress,
    complete_subtask,
)
from .views_mxp import (
    get_mission_hints,
    get_mission_decisions,
    record_decision,
    track_time_stage,
    track_tool_usage,
    submit_reflection,
    mission_performance_analytics,
    mission_completion_heatmap,
    enterprise_mission_analytics,
)

router = DefaultRouter()
router.register(r'missions', MissionViewSet, basename='mission')

urlpatterns = [
    # Sample mission for Foundations preview
    path('missions/sample', get_sample_mission, name='mission-sample'),
    
    # Student mission endpoints
    path('student/missions/', list_student_missions, name='student-missions-list'),
    path('student/missions/funnel/', get_mission_funnel, name='student-missions-funnel'),
    path('student/missions/<uuid:mission_id>/', get_mission_detail, name='student-mission-detail'),
    path('student/missions/<uuid:mission_id>/start/', start_mission_student, name='student-mission-start'),
    path('student/missions/<uuid:mission_id>/progress/', get_mission_progress, name='student-mission-progress'),
    path('student/missions/<uuid:mission_id>/submit-ai/', submit_mission_for_ai, name='student-mission-submit-ai'),
    path('student/missions/<uuid:mission_id>/save-draft/', save_mission_draft, name='student-mission-save-draft'),
    path('student/missions/<uuid:mission_id>/subtasks/<int:subtask_index>/complete/', complete_subtask, name='student-mission-complete-subtask'),
    path('student/submissions/<uuid:submission_id>/upload/', upload_mission_artifacts, name='student-mission-upload'),
    path('student/submissions/<uuid:submission_id>/submit-mentor/', submit_for_mentor_review, name='student-mission-submit-mentor'),
    
    # Mission hints and decision points
    path('missions/<uuid:mission_id>/hints/<int:subtask_id>/', get_mission_hints, name='mission-hints'),
    path('missions/<uuid:mission_id>/decisions/', get_mission_decisions, name='mission-decisions'),
    path('missions/<uuid:mission_id>/decisions/<str:decision_id>/choose/', record_decision, name='mission-record-decision'),
    
    # Mission progress tracking
    path('mission-progress/<uuid:progress_id>/track-time/', track_time_stage, name='mission-track-time'),
    path('mission-progress/<uuid:progress_id>/track-tools/', track_tool_usage, name='mission-track-tools'),
    path('mission-progress/<uuid:progress_id>/reflection/', submit_reflection, name='mission-submit-reflection'),
    
    # Mission analytics (admin only)
    path('missions/analytics/performance/', mission_performance_analytics, name='mission-performance-analytics'),
    path('missions/analytics/heatmap/', mission_completion_heatmap, name='mission-completion-heatmap'),
    path('missions/analytics/enterprise/', enterprise_mission_analytics, name='enterprise-mission-analytics'),
    path('missions/analytics/enterprise/<uuid:cohort_id>/', enterprise_mission_analytics, name='enterprise-mission-analytics-cohort'),

    # Admin mission management (MissionViewSet)
    path('', include(router.urls)),
]