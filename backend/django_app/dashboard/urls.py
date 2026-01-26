from django.urls import path
from . import views
from . import views_websocket
from . import portfolio_views

app_name = 'dashboard'

urlpatterns = [
    path('overview/', views.dashboard_overview, name='overview'),
    path('metrics/', views.dashboard_metrics, name='metrics'),
    path('next-actions/', views.next_actions, name='next-actions'),
    path('events/', views.dashboard_events, name='events'),
    path('track-overview/', views.track_overview, name='track-overview'),
    path('community-feed/', views.community_feed, name='community-feed'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('habits/', views.dashboard_habits, name='habits'),
    path('ai-coach-nudge/', views.ai_coach_nudge, name='ai-coach-nudge'),
    path('sse/', views_websocket.dashboard_sse, name='sse'),
    
    # Portfolio endpoints - order matters! More specific routes first
    path('portfolio/<str:user_id>/items', portfolio_views.create_portfolio_item, name='portfolio-create'),
    path('portfolio/<str:user_id>/health', portfolio_views.get_portfolio_health, name='portfolio-health'),
    path('portfolio/<str:user_id>', portfolio_views.get_portfolio_items, name='portfolio-items'),
    path('portfolio/item/<uuid:item_id>', portfolio_views.get_portfolio_item, name='portfolio-item-detail'),
]

