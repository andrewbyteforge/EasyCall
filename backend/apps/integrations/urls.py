# =============================================================================
# FILE: backend/apps/integrations/urls.py
# =============================================================================
# URL routing for integrations app.
# =============================================================================
"""
URL configuration for integrations application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.integrations.views import OpenAPISpecViewSet

# =============================================================================
# ROUTER CONFIGURATION
# =============================================================================

router = DefaultRouter()
router.register(r"specs", OpenAPISpecViewSet, basename="openapi-spec")

# =============================================================================
# URL PATTERNS
# =============================================================================

app_name = "integrations"

urlpatterns = [
    path("", include(router.urls)),
]