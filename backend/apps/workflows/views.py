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

    @action(detail=True, methods=["post"])
    def execute(self, request, uuid=None):
        """
        Execute a workflow.

        POST /api/v1/workflows/{uuid}/execute/

        Request body (optional):
            {
                "canvas_data": {...}  // Optional override for canvas data
            }

        Returns:
            Execution log with results
        """
        from apps.execution.executor import WorkflowExecutor
        from apps.execution.models import ExecutionLog

        workflow = self.get_object()
        logger.info(f"Executing workflow: {workflow.name}")

        # Allow override of canvas_data from request (for unsaved workflows)
        canvas_data = request.data.get("canvas_data")
        if canvas_data:
            workflow.canvas_data = canvas_data

        try:
            # Create executor and run
            executor = WorkflowExecutor(workflow)
            execution = executor.execute()

            return Response({
                "status": "success",
                "execution_id": str(execution.uuid),
                "execution_status": execution.status,
                "started_at": execution.started_at.isoformat() if execution.started_at else None,
                "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
                "duration_seconds": execution.get_duration_seconds(),
                "result_data": execution.result_data,
                "error_message": execution.error_message or None,
            })

        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            return Response({
                "status": "error",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"])
    def execute_direct(self, request):
        """
        Execute workflow directly without saving.

        POST /api/v1/workflows/execute_direct/

        Request body:
            {
                "nodes": [...],
                "edges": [...],
                "name": "My Workflow"
            }

        Returns:
            Execution results with detailed logs
        """
        from apps.execution.executor import WorkflowExecutor

        nodes = request.data.get("nodes", [])
        edges = request.data.get("edges", [])
        name = request.data.get("name", "Untitled Workflow")

        if not nodes:
            return Response({
                "status": "error",
                "error": "No nodes provided"
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Direct execution: {name} ({len(nodes)} nodes, {len(edges)} edges)")

        try:
            # Create temporary workflow object (not saved to DB)
            from apps.workflows.models import Workflow
            temp_workflow = Workflow(
                name=name,
                canvas_data={
                    "nodes": nodes,
                    "edges": edges
                }
            )

            # Execute
            executor = WorkflowExecutor(temp_workflow)
            result = executor.execute_direct()  # New method for direct execution

            return Response({
                "status": "success",
                "execution_log": result.get("log", []),
                "node_outputs": result.get("outputs", {}),
                "summary": result.get("summary", {}),
            })

        except Exception as e:
            logger.error(f"Direct execution failed: {e}")
            import traceback
            return Response({
                "status": "error",
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)