"""
Celery configuration for Director Dashboard periodic tasks.
"""
from celery.schedules import crontab

# Periodic task schedule for director dashboard cache refresh
DIRECTOR_DASHBOARD_BEAT_SCHEDULE = {
    'refresh-all-director-caches': {
        'task': 'director_dashboard.refresh_all_caches',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
}

