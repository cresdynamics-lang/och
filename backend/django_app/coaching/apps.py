from django.apps import AppConfig


class CoachingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'coaching'
    
    def ready(self):
        """Import signals when app is ready."""
        import coaching.signals  # noqa