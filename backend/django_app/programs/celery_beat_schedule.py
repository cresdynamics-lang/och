"""
Celery Beat schedule configuration for Director Dashboard cache refresh.
Add this to your Celery Beat schedule in settings.
"""
from celery.schedules import crontab

# Refresh all director dashboards every 5 minutes
DIRECTOR_DASHBOARD_REFRESH_SCHEDULE = {
    'refresh-all-director-dashboards': {
        'task': 'director_dashboard.refresh_all_directors',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
}










