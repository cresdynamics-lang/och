"""
Community module URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'universities', views.UniversityViewSet, basename='university')
router.register(r'memberships', views.UniversityMembershipViewSet, basename='membership')
router.register(r'posts', views.PostViewSet, basename='post')
router.register(r'comments', views.CommentViewSet, basename='comment')
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'badges', views.BadgeViewSet, basename='badge')
router.register(r'user-badges', views.UserBadgeViewSet, basename='user-badge')
router.register(r'leaderboards', views.LeaderboardViewSet, basename='leaderboard')
router.register(r'follows', views.FollowViewSet, basename='follow')
router.register(r'moderation', views.ModerationViewSet, basename='moderation')

# Advanced Features - Phase 2
router.register(r'channels', views.ChannelViewSet, basename='channel')
router.register(r'squads', views.StudySquadViewSet, basename='squad')
router.register(r'reputation', views.ReputationViewSet, basename='reputation')
router.register(r'ai-summaries', views.AISummaryViewSet, basename='ai-summary')
router.register(r'collab-rooms', views.CollabRoomViewSet, basename='collab-room')
router.register(r'enterprise-cohorts', views.EnterpriseCohortViewSet, basename='enterprise-cohort')
router.register(r'contributions', views.ContributionViewSet, basename='contribution')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Feed
    path('feed/', views.FeedView.as_view(), name='feed'),
    
    # Search
    path('search/', views.SearchView.as_view(), name='search'),
    
    # User stats
    path('stats/', views.UserStatsView.as_view(), name='my-stats'),
    path('stats/<uuid:user_id>/', views.UserStatsView.as_view(), name='user-stats'),
]

