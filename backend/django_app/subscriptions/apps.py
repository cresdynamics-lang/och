import sys
from django.apps import AppConfig


class SubscriptionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'subscriptions'

    def ready(self):
        # Only start the scheduler in the main process (not in migrations, tests, etc.)
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv[0]:
            try:
                from . import scheduler
                scheduler.start()
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(
                    f'[subscriptions] Scheduler not started (this is OK during migrations/tests): {e}'
                )
