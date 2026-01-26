"""
URL configuration for Missions MXP.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_recommended_missions, submit_mission, mission_status
from .views_student import (
    get_mission_funnel,
    list_student_missions,
    get_mission_detail,
    submit_mission_for_ai,
    upload_mission_artifacts,
    save_mission_draft,
    submit_for_mentor_review,
    get_mission_progress,
    complete_subtask,
    start_mission_student,
)
from .views_mxp import (
    mission_dashboard,
    start_mission,
    save_subtask_progress,
    upload_mission_file,
    submit_mission,
    get_ai_review,
    submit_for_mentor_review as submit_for_mentor_review_mxp,
    mentor_review_submission,
)
from .views_director import MissionViewSet

app_name = 'missions'

# Router for director mission management (CRUD operations)
# This registers /missions/ for list/create and /missions/{id}/ for detail/update/delete
router = DefaultRouter()
router.register(r'missions', MissionViewSet, basename='mission')

urlpatterns = [
    # Specific endpoints that need to come before router to avoid conflicts
    path('missions/recommended', get_recommended_missions, name='recommended'),
    path('missions/<uuid:mission_id>/submit', submit_mission, name='submit'),
    path('missions/status', mission_status, name='status'),
    
    # Student-facing endpoints
    path('student/missions/funnel/', get_mission_funnel, name='student-funnel'),
    path('student/missions/', list_student_missions, name='student-list'),
    path('student/missions/<uuid:mission_id>/', get_mission_detail, name='student-detail'),
    path('student/missions/<uuid:mission_id>/start', start_mission_student, name='student-start'),
    path('student/missions/<uuid:mission_id>/progress', get_mission_progress, name='student-progress'),
    path('student/missions/<uuid:mission_id>/subtasks/<int:subtask_index>/complete', complete_subtask, name='student-complete-subtask'),
    path('student/missions/<uuid:mission_id>/submit', submit_mission_for_ai, name='student-submit'),
    path('student/missions/<uuid:mission_id>/draft', save_mission_draft, name='student-draft'),
    path('student/missions/submissions/<uuid:submission_id>/artifacts', upload_mission_artifacts, name='student-artifacts'),
    path('student/missions/submissions/<uuid:submission_id>/submit-mentor', submit_for_mentor_review, name='student-submit-mentor'),
    
    # MXP Mission Execution Platform endpoints
    path('missions/dashboard', mission_dashboard, name='mxp-dashboard'),
    path('missions/<uuid:mission_id>/start', start_mission, name='mxp-start'),
    path('mission-progress/<uuid:progress_id>', save_subtask_progress, name='mxp-save-progress'),
    path('mission-progress/<uuid:progress_id>/files', upload_mission_file, name='mxp-upload-file'),
    path('mission-progress/<uuid:progress_id>/submit', submit_mission, name='mxp-submit'),
    path('mission-progress/<uuid:progress_id>/ai-review', get_ai_review, name='mxp-ai-review'),
    path('mission-progress/<uuid:progress_id>/mentor-review', submit_for_mentor_review_mxp, name='mxp-submit-mentor'),
    path('mission-progress/<uuid:progress_id>/mentor-review/complete', mentor_review_submission, name='mxp-mentor-complete'),
    
    # Director mission management (CRUD operations) - Router comes last
    path('', include(router.urls)),
]

