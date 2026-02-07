"""
Missions URL configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MissionViewSet
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

router = DefaultRouter()
router.register(r'missions', MissionViewSet, basename='mission')

urlpatterns = [
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

    # Admin mission management (MissionViewSet)
    path('', include(router.urls)),
]