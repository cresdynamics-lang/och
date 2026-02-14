"""
Curriculum Engine URL configuration.

API Endpoints:
- /tracks/                          - List all tracks
- /tracks/{code}/                   - Track details with modules
- /tracks/{code}/enroll/            - Enroll in track
- /tracks/{code}/progress/          - User's progress in track
- /tracks/{code}/leaderboard/       - Track leaderboard

- /modules/                         - List modules (filterable by track)
- /modules/{id}/                    - Module details
- /modules/{id}/start/              - Start module
- /modules/{id}/complete/           - Complete module

- /lessons/                         - List lessons (filterable by module)
- /lessons/{id}/                    - Lesson details
- /lessons/{id}/progress/           - Update lesson progress

- /mission-progress/                - Mission progress updates (from Missions Engine)
- /my-progress/                     - User's overall curriculum progress
- /activities/                      - User's recent activities
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tracks', views.CurriculumTrackViewSet, basename='track')
router.register(r'track-mentor-assignments', views.CurriculumTrackMentorAssignmentViewSet, basename='curriculum-track-mentor-assignment')
router.register(r'modules', views.CurriculumModuleViewSet, basename='module')
router.register(r'lessons', views.LessonViewSet, basename='lesson')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Custom endpoints
    path('mission-progress/', views.MissionProgressView.as_view(), name='mission-progress'),
    path('my-progress/', views.UserProgressView.as_view(), name='my-progress'),
    path('activities/', views.RecentActivityView.as_view(), name='activities'),
    
    # Tier 2 (Beginner Tracks) endpoints
    path('tier2/tracks/<str:code>/status', views.Tier2TrackStatusView.as_view(), name='tier2-status'),
    path('tier2/tracks/<str:code>/submit-quiz', views.Tier2SubmitQuizView.as_view(), name='tier2-submit-quiz'),
    path('tier2/tracks/<str:code>/submit-reflection', views.Tier2SubmitReflectionView.as_view(), name='tier2-submit-reflection'),
    path('tier2/tracks/<str:code>/submit-mini-mission', views.Tier2SubmitMiniMissionView.as_view(), name='tier2-submit-mini-mission'),
    path('tier2/tracks/<str:code>/complete', views.Tier2CompleteView.as_view(), name='tier2-complete'),
    path('tier2/tracks/<str:code>/feedback', views.Tier2MentorFeedbackView.as_view(), name='tier2-feedback'),
    path('tier2/tracks/<str:code>/sample-report', views.Tier2SampleMissionReportView.as_view(), name='tier2-sample-report'),
    path('tier2/cohort-progress/', views.Tier2CohortProgressView.as_view(), name='tier2-cohort-progress'),
    # Tier 3 (Intermediate Tracks) endpoints
    path('tier3/tracks/<str:code>/status', views.Tier3TrackStatusView.as_view(), name='tier3-status'),
    path('tier3/tracks/<str:code>/complete', views.Tier3CompleteView.as_view(), name='tier3-complete'),
    # Tier 4 (Advanced Tracks) endpoints
    path('tier4/tracks/<str:code>/status', views.Tier4TrackStatusView.as_view(), name='tier4-status'),
    path('tier4/tracks/<str:code>/complete', views.Tier4CompleteView.as_view(), name='tier4-complete'),
    # Tier 5 (Mastery Tracks) endpoints
    path('tier5/tracks/<str:code>/status', views.Tier5TrackStatusView.as_view(), name='tier5-status'),
    path('tier5/tracks/<str:code>/complete', views.Tier5CompleteView.as_view(), name='tier5-complete'),
    path('bookmarks/', views.LessonBookmarkView.as_view(), name='lesson-bookmark-list'),
    path('lessons/<uuid:lesson_id>/bookmark/', views.LessonBookmarkView.as_view(), name='lesson-bookmark-detail'),

    # Tier 6 (Cross-Track Programs) endpoints
    path('cross-track/', views.CrossTrackProgramsView.as_view(), name='cross-track-programs'),
    path('cross-track/<str:code>/', views.CrossTrackProgramDetailView.as_view(), name='cross-track-program-detail'),
    path('cross-track/submit/', views.CrossTrackSubmissionView.as_view(), name='cross-track-submit'),
    path('cross-track/progress/', views.CrossTrackProgressView.as_view(), name='cross-track-progress'),

    # Curriculum Navigation System endpoints
    path('tracks/', views.CurriculumTracksView.as_view(), name='curriculum-tracks'),
    path('<str:track_slug>/', views.CurriculumTrackDetailView.as_view(), name='curriculum-track-detail'),
    path('users/<uuid:user_id>/enroll-track/', views.TrackEnrollmentView.as_view(), name='track-enrollment'),
    path('users/<uuid:user_id>/curriculum-progress/', views.CurriculumProgressView.as_view(), name='curriculum-progress'),
    path('users/<uuid:user_id>/<str:track_slug>/<str:level_slug>/unlock-status/', views.LevelUnlockStatusView.as_view(), name='level-unlock-status'),

    # Legacy Defender Curriculum endpoints (for backwards compatibility)
    path('defender/', views.DefenderCurriculumView.as_view(), name='defender-curriculum'),
    path('defender/<str:level_slug>/', views.DefenderLevelView.as_view(), name='defender-level'),
    path('users/<int:user_id>/curriculum/defender/progress/', views.DefenderProgressView.as_view(), name='defender-progress'),
]

