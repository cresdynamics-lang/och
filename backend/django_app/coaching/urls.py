"""
Coaching OS URL configuration.
"""
from django.urls import path
from .views import (
    habits_list, habit_detail, log_habit, habit_logs,
    goals_list, goal_detail,
    reflections_list, reflection_detail,
    ai_coach_message, ai_coach_history,
    coaching_metrics,
    student_analytics, user_recipe_progress, user_track_progress,
    user_mission_progress, community_activity, mentorship_sessions,
    coaching_sessions_api,
)

urlpatterns = [
    # Habits
    path('habits', habits_list, name='coaching-habits-list'),
    path('habits/<uuid:habit_id>', habit_detail, name='coaching-habit-detail'),
    path('habits/log', log_habit, name='coaching-habit-log'),
    path('habits/<uuid:habit_id>/logs', habit_logs, name='coaching-habit-logs'),
    
    # Goals
    path('goals', goals_list, name='coaching-goals-list'),
    path('goals/<uuid:goal_id>', goal_detail, name='coaching-goal-detail'),
    
    # Reflections
    path('reflections', reflections_list, name='coaching-reflections-list'),
    path('reflections/<uuid:reflection_id>', reflection_detail, name='coaching-reflection-detail'),
    
    # AI Coach
    path('ai-coach/message', ai_coach_message, name='coaching-ai-coach-message'),
    path('ai-coach/history', ai_coach_history, name='coaching-ai-coach-history'),
    
    # Metrics
    path('metrics', coaching_metrics, name='coaching-metrics'),

    # Student Analytics (PostgreSQL replacement for Supabase)
    path('student-analytics', student_analytics, name='coaching-student-analytics'),

    # Recipe Progress
    path('recipe-progress', user_recipe_progress, name='coaching-recipe-progress'),

    # Track Progress
    path('track-progress', user_track_progress, name='coaching-track-progress'),

    # Mission Progress
    path('mission-progress', user_mission_progress, name='coaching-mission-progress'),

    # Community Activity
    path('community-activity', community_activity, name='coaching-community-activity'),

    # Mentorship Sessions
    path('mentorship-sessions', mentorship_sessions, name='coaching-mentorship-sessions'),

    # Coaching Sessions
    path('sessions', coaching_sessions_api, name='coaching-sessions'),
]
