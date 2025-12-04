# =============================================================================
# FILE: easycall/backend/config/urls.py
# =============================================================================
# Main URL routing configuration for the EasyCall application.
# =============================================================================
"""
URL configuration for the EasyCall project.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# =============================================================================
# URL PATTERNS
# =============================================================================

urlpatterns = [
    # -------------------------------------------------------------------------
    # Admin Interface
    # -------------------------------------------------------------------------
    path("admin/", admin.site.urls),

    # -------------------------------------------------------------------------
    # API Documentation
    # -------------------------------------------------------------------------
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema"
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui"
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc"
    ),

    # -------------------------------------------------------------------------
    # API Version 1 Endpoints
    # -------------------------------------------------------------------------
    path(
        "api/v1/",
        include("apps.core.urls", namespace="core")
    ),
    path(
        "api/v1/workflows/",
        include("apps.workflows.urls", namespace="workflows")
    ),
    path(
        "api/v1/execution/",
        include("apps.execution.urls", namespace="execution")
    ),
    path(
        "api/v1/nodes/",
        include("apps.nodes.urls", namespace="nodes")
    ),
    path(
        "api/v1/settings/",
        include("apps.settings_manager.urls", namespace="settings")
    ),
]

# =============================================================================
# ADMIN SITE CUSTOMIZATION
# =============================================================================

admin.site.site_header = "EasyCall Administration"
admin.site.site_title = "EasyCall Admin"
admin.site.index_title = "Workflow Builder Administration"