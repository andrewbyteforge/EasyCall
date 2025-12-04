# =============================================================================
# FILE: easycall/backend/apps/integrations/apps.py
# =============================================================================
# Django application configuration for the integrations app.
# =============================================================================
"""
Integrations application configuration.
"""

from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    """Configuration for the integrations Django application."""

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "apps.integrations"
    verbose_name: str = "API Integrations"