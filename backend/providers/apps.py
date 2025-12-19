# =============================================================================
# FILE: easycall/backend/apps/providers/apps.py
# =============================================================================
# Django application configuration for the providers app.
# =============================================================================
"""
Providers application configuration.
"""

from django.apps import AppConfig


class ProvidersConfig(AppConfig):
    """Configuration for the providers Django application."""

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "apps.providers"
    verbose_name: str = "API Providers"