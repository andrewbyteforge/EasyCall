"""
Dashboard App Configuration
"""

from django.apps import AppConfig


class DashboardConfig(AppConfig):
    """
    Configuration for the dashboard application.
    
    Provides landing page statistics and quick action endpoints.
    """
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.dashboard'
    verbose_name = 'Dashboard'
    
    def ready(self):
        """
        Initialize app when Django starts.
        
        Currently no initialization needed.
        """
        pass