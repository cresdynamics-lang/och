from django.apps import AppConfig


class SponsorsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sponsors'

    def ready(self):
        """Import signals when the app is ready"""
        import sponsors.signals  # noqa
