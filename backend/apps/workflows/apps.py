# =============================================================================
# FILE: easycall/backend/apps/workflows/apps.py
# =============================================================================
# Django application configuration for the workflows app.
# =============================================================================
"""
Workflows application configuration.
"""

from django.apps import AppConfig


class WorkflowsConfig(AppConfig):
    """Configuration for the workflows Django application."""

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "apps.workflows"
    verbose_name: str = "Workflows"