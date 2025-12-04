# =============================================================================
# FILE: easycall/backend/apps/nodes/apps.py
# =============================================================================
# Django application configuration for the nodes app.
# =============================================================================
"""
Nodes application configuration.
"""

from django.apps import AppConfig


class NodesConfig(AppConfig):
    """Configuration for the nodes Django application."""

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "apps.nodes"
    verbose_name: str = "Nodes"