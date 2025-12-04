# =============================================================================
# FILE: easycall/backend/apps/execution/apps.py
# =============================================================================
# Django application configuration for the execution app.
# =============================================================================
"""
Execution application configuration.
"""

from django.apps import AppConfig


class ExecutionConfig(AppConfig):
    """Configuration for the execution Django application."""

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "apps.execution"
    verbose_name: str = "Execution"