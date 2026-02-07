from django.apps import AppConfig


class ProgramsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'programs'

    def ready(self):
        import programs.signals  # noqa: F401 — register signal handlers












