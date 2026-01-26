"""
URLs for Tier 1 Foundations API.
"""
from django.urls import path
from . import views

app_name = 'foundations'

urlpatterns = [
    path('status', views.get_foundations_status, name='status'),
    path('modules/<uuid:module_id>/complete', views.complete_module, name='complete_module'),
    path('modules/<uuid:module_id>/progress', views.update_module_progress, name='update_module_progress'),
    path('assessment/questions', views.get_assessment_questions, name='get_assessment_questions'),
    path('assessment', views.submit_assessment, name='submit_assessment'),
    path('reflection', views.submit_reflection, name='submit_reflection'),
    path('confirm-track', views.confirm_track, name='confirm_track'),
    path('complete', views.complete_foundations, name='complete_foundations'),
]
