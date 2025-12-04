# =============================================================================
# FILE: easycall/backend/apps/workflows/views.py
# =============================================================================
# API views for workflow management.
# =============================================================================
"""
Views for the workflows application.
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.workflows.models import Workflow
from apps.workflows.serializers import WorkflowSerializer, WorkflowListSerializer

logger = logging.getLogger(__name__)


class WorkflowViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations on workflows.
    
    Endpoints:
        GET    /api/v1/workflows/         - List all workflows
        POST   /api/v1/workflows/         - Create new workflow
        GET    /api/v1/workflows/{uuid}/  - Get workflow detail
        PUT    /api/v1/workflows/{uuid}/  - Update workflow
        DELETE /api/v1/workflows/{uuid}/  - Delete workflow (soft delete)
    """
    
    queryset = Workflow.objects.filter(is_active=True)
    serializer_class = WorkflowSerializer
    lookup_field = "uuid"
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == "list":
            return WorkflowListSerializer
        return WorkflowSerializer
    
    def perform_destroy(self, instance):
        """Soft delete instead of hard delete."""
        instance.soft_delete()
        logger.info(f"Workflow {instance.uuid} soft deleted")