"""
App configuration for Student Dashboard.
"""
from django.apps import AppConfig


class StudentDashboardConfig(AppConfig):
    """Configuration for student_dashboard app."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'student_dashboard'
    verbose_name = 'Student Dashboard'
    
    def ready(self):
        """Import signals when app is ready."""
        try:
            import student_dashboard.signals  # noqa
        except ImportError:
            pass
