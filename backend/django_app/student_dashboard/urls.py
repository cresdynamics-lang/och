"""
URL configuration for Student Dashboard endpoints.
"""
from django.urls import path
from .views import get_student_dashboard, track_dashboard_action, stream_dashboard_updates
from .views_extended import (
    get_student_profile,
    get_curriculum_progress,
    get_missions_funnel,
    get_student_dashboard_extended,
)

app_name = 'student_dashboard'

urlpatterns = [
    # Extended endpoints (primary)
    path('dashboard', get_student_dashboard_extended, name='dashboard'),
    path('profile', get_student_profile, name='profile'),
    path('curriculum/progress', get_curriculum_progress, name='curriculum-progress'),
    path('missions', get_missions_funnel, name='missions-funnel'),
    
    # Legacy/Additional endpoints
    path('dashboard/action', track_dashboard_action, name='dashboard-action'),
    path('dashboard/stream', stream_dashboard_updates, name='dashboard-stream'),
]


