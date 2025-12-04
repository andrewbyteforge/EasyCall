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
from rest_framework.permissions import AllowAny

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
        PATCH  /api/v1/workflows/{uuid}/  - Partial update
        DELETE /api/v1/workflows/{uuid}/  - Delete workflow (soft delete)
    """
    
    queryset = Workflow.objects.filter(is_active=True)
    permission_classes = [AllowAny]
    lookup_field = "uuid"
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return WorkflowListSerializer
        return WorkflowSerializer
    
    def list(self, request, *args, **kwargs):
        """List all active workflows."""
        logger.info("Listing workflows")
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Create a new workflow."""
        logger.info(f"Creating workflow: {request.data.get('name')}")
        return super().create(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """Get workflow by UUID."""
        workflow = self.get_object()
        logger.info(f"Retrieving workflow: {workflow.name}")
        return super().retrieve(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update workflow."""
        workflow = self.get_object()
        logger.info(f"Updating workflow: {workflow.name}")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete workflow."""
        workflow = self.get_object()
        workflow.soft_delete()
        logger.info(f"Soft deleted workflow: {workflow.name}")
        
        return Response(
            {"message": f"Workflow '{workflow.name}' deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )