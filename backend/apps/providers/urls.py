# =============================================================================
# FILE: easycall/backend/apps/providers/urls.py
# =============================================================================
# URL patterns for provider management endpoints.
# =============================================================================
"""
URL configuration for the providers application.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.providers import views

app_name = "providers"

# =============================================================================
# ROUTER CONFIGURATION
# =============================================================================

router = DefaultRouter()
router.register(r'providers', views.ProviderViewSet, basename='provider')
router.register(r'endpoints', views.APIEndpointViewSet, basename='endpoint')
router.register(r'nodes', views.GeneratedNodeViewSet, basename='node')

# =============================================================================
# URL PATTERNS
# =============================================================================

urlpatterns = [
    path('', include(router.urls)),
]