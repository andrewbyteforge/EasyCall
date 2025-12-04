# =============================================================================
# FILE: easycall/backend/apps/core/apps.py
# =============================================================================
# Django application configuration for the core app.
# =============================================================================
"""
Core application configuration.
"""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuration for the core Django application."""

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "apps.core"
    verbose_name: str = "Core"