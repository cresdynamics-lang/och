"""
URL configuration for Profiler Engine.
"""
from django.urls import path
from .views import (
    start_profiler,
    submit_answers,
    generate_future_you,
    profiler_status,
    get_future_you_by_mentee,
    check_profiling_required,
    check_tier0_completion,
    autosave_response,
    update_section_progress,
    complete_section,
    complete_profiling,
    get_profiling_results,
    sync_fastapi_profiling,
)

app_name = 'profiler'

urlpatterns = [
    path('profiler/tier0-status', check_tier0_completion, name='tier0-status'),
    path('profiler/check-required', check_profiling_required, name='check-required'),
    path('profiler/start', start_profiler, name='start'),
    path('profiler/autosave', autosave_response, name='autosave'),
    path('profiler/update-progress', update_section_progress, name='update-progress'),
    path('profiler/complete-section', complete_section, name='complete-section'),
    path('profiler/complete', complete_profiling, name='complete'),
    path('profiler/results', get_profiling_results, name='results'),
    path('profiler/answers', submit_answers, name='answers'),
    path('profiler/future-you', generate_future_you, name='future-you'),
    path('profiler/status', profiler_status, name='status'),
    path('profiler/mentees/<int:mentee_id>/future-you', get_future_you_by_mentee, name='future-you-by-mentee'),
    path('profiler/sync-fastapi', sync_fastapi_profiling, name='sync-fastapi'),
]

