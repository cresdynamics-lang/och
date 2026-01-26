"""
Foundations app configuration.
"""
from django.apps import AppConfig


class FoundationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'foundations'
    verbose_name = 'Tier 1 Foundations'
