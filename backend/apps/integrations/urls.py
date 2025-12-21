# =============================================================================
# FILE: backend/apps/integrations/urls.py
# =============================================================================
# URL patterns for integration management endpoints.
# =============================================================================
"""
URL configuration for the integrations application.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.integrations import views

app_name = "integrations"

# =============================================================================
# ROUTER CONFIGURATION
# =============================================================================

router = DefaultRouter()
router.register(r"specs", views.OpenAPISpecViewSet, basename="spec")
router.register(r"nodes", views.AvailableNodesViewSet, basename="available-nodes")

# =============================================================================
# URL PATTERNS
# =============================================================================

urlpatterns = [
    path("", include(router.urls)),
]