# =============================================================================
# FILE: easycall/backend/apps/core/urls.py
# =============================================================================
# URL patterns for core API endpoints.
# =============================================================================
"""
URL configuration for the core application.
"""

from django.urls import path

from apps.core import views

app_name = "core"

urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    path("health/detailed/", views.detailed_health_check, name="health-check-detailed"),
    path("info/", views.system_info, name="system-info"),
    path("ping/", views.ping, name="ping"),
]