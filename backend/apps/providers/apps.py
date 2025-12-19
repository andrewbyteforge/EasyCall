# =============================================================================
# FILE: backend/apps/providers/apps.py
# =============================================================================
"""
Django app configuration for the providers application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from django.apps import AppConfig


# =============================================================================
# APP CONFIGURATION
# =============================================================================

class ProvidersConfig(AppConfig):
    """
    Configuration class for the providers application.
    
    This app manages API provider integrations, OpenAPI spec parsing,
    and dynamic node generation.
    """
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.providers'
    verbose_name = 'Provider Management'
    
    def ready(self):
        """
        Perform initialization when the app is ready.
        
        This method is called once Django starts. Use it for:
        - Registering signal handlers
        - Performing startup checks
        - Initializing caches
        """
        # Import signal handlers (when we add them later)
        # import apps.providers.signals
        pass