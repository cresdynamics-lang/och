"""
Celery configuration for background tasks.
"""
import os

try:
    from celery import Celery
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
    
    app = Celery('ongozacyberhub')
    app.config_from_object('django.conf:settings', namespace='CELERY')
    app.autodiscover_tasks()
    
    
    @app.task(bind=True)
    def debug_task(self):
        print(f'Request: {self.request!r}')
except ImportError:
    # Celery not installed, create a mock app
    class MockCelery:
        def task(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    
    app = MockCelery()

