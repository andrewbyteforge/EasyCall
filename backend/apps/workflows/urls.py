# =============================================================================
# FILE: easycall/backend/apps/workflows/urls.py
# =============================================================================
# URL patterns for workflow management endpoints.
# =============================================================================
"""
URL configuration for the workflows application.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.workflows import views

app_name = "workflows"

router = DefaultRouter()
router.register(r"", views.WorkflowViewSet, basename="workflow")

urlpatterns = [
    path("", include(router.urls)),
]