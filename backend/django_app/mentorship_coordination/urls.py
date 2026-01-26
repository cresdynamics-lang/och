"""
URL configuration for Mentorship Coordination Engine.
"""
from django.urls import path
from .views import (
    mentor_dashboard,
    mentor_mentees,
    mentor_sessions,
    mentee_sessions,
    mentor_workqueue,
    mentee_cockpit,
    create_session,
    request_session,
    review_mission,
    create_flag,
    mentor_flags,
    mentor_mentee_talentscope,
    mentor_mission_submissions,
    mentor_cohort_missions,
    update_group_session,
    mentor_influence_index,
    submit_session_feedback,
    get_session_feedback,
    mentor_feedback_summary,
    get_student_mentor,
    get_mentorship_assignment,
    get_mentor_assignments,
    messages_endpoint,
    mark_message_read,
    send_notification,
    get_notifications
)
from .sse_views import mentor_dashboard_stream

app_name = 'mentorship_coordination'

urlpatterns = [
    # CRITICAL: More specific patterns MUST come first to avoid conflicts
    # The order matters - Django matches patterns in order
    path('mentors/<int:mentor_id>/mentees/<int:mentee_id>/talentscope/', mentor_mentee_talentscope, name='mentor-mentee-talentscope'),
    path('mentors/<int:mentor_id>/mentees/<int:mentee_id>/talentscope', mentor_mentee_talentscope, name='mentor-mentee-talentscope-no-slash'),
    path('mentors/<int:mentor_id>/missions/cohorts', mentor_cohort_missions, name='mentor-cohort-missions'),
    path('mentors/<int:mentor_id>/missions/submissions', mentor_mission_submissions, name='mentor-mission-submissions'),
    path('mentors/<int:mentor_id>/influence', mentor_influence_index, name='mentor-influence'),
    path('mentors/<int:mentor_id>/flags/', mentor_flags, name='mentor-flags-slash'),
    path('mentors/<int:mentor_id>/flags', mentor_flags, name='mentor-flags'),
    path('mentors/<int:mentor_id>/sessions', mentor_sessions, name='mentor-sessions'),
    path('mentors/<int:mentor_id>/mentees', mentor_mentees, name='mentor-mentees'),
    path('mentor/dashboard/stream', mentor_dashboard_stream, name='dashboard-stream'),
    path('mentor/dashboard', mentor_dashboard, name='dashboard'),
    path('mentor/workqueue', mentor_workqueue, name='workqueue'),
    path('mentor/mentees/<int:mentee_id>/cockpit', mentee_cockpit, name='mentee-cockpit'),
    path('mentor/sessions', create_session, name='create-session'),
    path('mentorship/sessions/request', request_session, name='request-session'),
    path('mentorship/sessions', mentee_sessions, name='mentee-sessions'),
    path('mentors/sessions/<uuid:session_id>', update_group_session, name='update-group-session'),
    path('sessions/<uuid:session_id>/feedback', get_session_feedback, name='get-session-feedback'),  # GET
    path('sessions/<uuid:session_id>/feedback', submit_session_feedback, name='submit-session-feedback'),  # POST (same URL, different method)
    path('mentors/<int:mentor_id>/feedback-summary', mentor_feedback_summary, name='mentor-feedback-summary'),
    path('mentor/missions/<uuid:submission_id>/review', review_mission, name='review-mission'),
    # Keep old endpoint for backward compatibility
    path('mentor/flags', create_flag, name='create-flag-legacy'),
    # Student mentor endpoint
    path('mentorship/mentees/<int:mentee_id>/mentor', get_student_mentor, name='get-student-mentor'),
    # Get mentorship assignment
    path('mentorship/assignment', get_mentorship_assignment, name='get-mentorship-assignment'),
    # Get all assignments for a mentor
    path('mentorship/mentors/<int:mentor_id>/assignments', get_mentor_assignments, name='get-mentor-assignments'),
    # Messaging endpoints
    path('mentorship/assignments/<uuid:assignment_id>/messages', messages_endpoint, name='messages-endpoint'),
    path('mentorship/messages/<uuid:message_id>/read', mark_message_read, name='mark-message-read'),
    # Notifications endpoints
    path('mentorship/notifications', send_notification, name='send-notification'),
    path('mentorship/users/<int:user_id>/notifications', get_notifications, name='get-notifications'),
]

