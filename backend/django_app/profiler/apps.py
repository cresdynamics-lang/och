from django.apps import AppConfig


class ProfilerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'profiler'
    
    def ready(self):
        """Import signals when app is ready."""
        from django.db.models.signals import post_save
        from .models import ProfilerSession
        
        # Import coaching signal handler
        try:
            from coaching.signals import on_profiler_completed
            post_save.connect(on_profiler_completed, sender=ProfilerSession)
        except ImportError:
            pass  # Coaching app not available