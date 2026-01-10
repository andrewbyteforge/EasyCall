# =============================================================================
# FILE: backend/apps/ai/apps.py
# =============================================================================

from django.apps import AppConfig


class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai'
    verbose_name = 'AI Workflow Generation'
