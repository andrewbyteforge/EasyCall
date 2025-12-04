# =============================================================================
# FILE: easycall/backend/apps/settings_manager/apps.py
# =============================================================================
# Django application configuration for the settings manager app.
# =============================================================================
"""
Settings manager application configuration.
"""

from django.apps import AppConfig


class SettingsManagerConfig(AppConfig):
    """Configuration for the settings manager Django application."""

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "apps.settings_manager"
    verbose_name: str = "Settings"