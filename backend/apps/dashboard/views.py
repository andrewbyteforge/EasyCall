# =============================================================================
# FILE: backend/apps/dashboard/views.py (COMPLETE UPDATED VERSION)
# =============================================================================
# Dashboard Views - Provides statistics and quick actions for the landing page
# UPDATED: Changed Add API Provider route to Django backend upload page
# =============================================================================

import logging
from typing import Any, Dict, List

from django.db.models import Count, Q
from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from apps.workflows.models import Workflow
from apps.execution.models import ExecutionLog
from apps.integrations.models import OpenAPISpec

# Configure logging
logger = logging.getLogger(__name__)


# ============================================================================
# TEMPLATE VIEWS
# ============================================================================


def home(request):
    """
    Landing page view.
    
    Renders the main dashboard landing page with statistics and quick actions.
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered template response
    """
    return render(request, 'dashboard/home.html')


def upload_provider(request):
    """
    Upload API provider page.
    
    Renders the OpenAPI specification upload page with matching styling.
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered template response
    """
    return render(request, 'dashboard/upload_provider.html')


def coming_soon(request, feature):
    """
    Coming soon placeholder page.
    
    Args:
        request: HTTP request object
        feature: Feature name to display
        
    Returns:
        Rendered template response
    """
    context = {
        'feature': feature.replace('_', ' ').title()
    }
    return render(request, 'dashboard/coming_soon.html', context)


# ============================================================================
# DASHBOARD STATISTICS
# ============================================================================


@api_view(['GET'])
def dashboard_stats(request: Request) -> Response:
    """
    Get dashboard statistics.
    
    Provides counts and summaries for:
    - Total workflows
    - Total API providers
    - Total executions
    - Recent activity
    
    Args:
        request: HTTP request object
        
    Returns:
        Response containing dashboard statistics
        
    Example Response:
        {
            "workflows": {
                "total": 15,
                "active": 12,
                "inactive": 3
            },
            "providers": {
                "total": 3,
                "parsed": 3,
                "failed": 0
            },
            "executions": {
                "total": 47,
                "today": 12,
                "success_rate": 89.5
            },
            "recent_activity": {
                "last_workflow_created": "2025-12-19T10:30:00Z",
                "last_execution": "2025-12-19T14:45:00Z"
            }
        }
    """
    try:
        logger.info("Fetching dashboard statistics")
        
        # ================================================================
        # WORKFLOW STATISTICS
        # ================================================================
        
        workflow_stats = {
            "total": Workflow.objects.count(),
            "active": Workflow.objects.filter(is_active=True).count(),
            "inactive": Workflow.objects.filter(is_active=False).count()
        }
        
        # ================================================================
        # PROVIDER STATISTICS (FIXED: using is_active instead of is_deleted)
        # ================================================================
        
        provider_stats = {
            "total": OpenAPISpec.objects.filter(is_active=True).count(),
            "parsed": OpenAPISpec.objects.filter(
                is_active=True,
                is_parsed=True
            ).count(),
            "failed": OpenAPISpec.objects.filter(
                is_active=True,
                is_parsed=False,
                parse_error__isnull=False
            ).count()
        }
        
        # ================================================================
        # EXECUTION STATISTICS
        # ================================================================
        
        total_executions = ExecutionLog.objects.count()
        successful_executions = ExecutionLog.objects.filter(
            status='completed'
        ).count()
        
        # Calculate success rate
        success_rate = 0.0
        if total_executions > 0:
            success_rate = round(
                (successful_executions / total_executions) * 100,
                2
            )
        
        # Today's executions
        today_start = timezone.now().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        today_executions = ExecutionLog.objects.filter(
            started_at__gte=today_start
        ).count()
        
        execution_stats = {
            "total": total_executions,
            "today": today_executions,
            "success_rate": success_rate
        }
        
        # ================================================================
        # RECENT ACTIVITY
        # ================================================================
        
        recent_activity = {}
        
        # Last workflow created
        last_workflow = Workflow.objects.order_by('-created_at').first()
        
        if last_workflow:
            recent_activity['last_workflow_created'] = last_workflow.created_at
        
        # Last execution
        last_execution = ExecutionLog.objects.order_by('-started_at').first()
        
        if last_execution:
            recent_activity['last_execution'] = last_execution.started_at
        
        # ================================================================
        # RESPONSE
        # ================================================================
        
        response_data = {
            "workflows": workflow_stats,
            "providers": provider_stats,
            "executions": execution_stats,
            "recent_activity": recent_activity
        }
        
        logger.info("Dashboard statistics retrieved successfully")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching dashboard statistics: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {"error": "Failed to fetch dashboard statistics"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# QUICK ACTIONS
# ============================================================================


@api_view(['GET'])
def quick_actions(request: Request) -> Response:
    """
    Get quick action cards for the landing page.
    
    Provides navigation shortcuts to main features:
    - Add Provider
    - Create Workflow
    - View Executions
    - Manage Settings
    
    Args:
        request: HTTP request object
        
    Returns:
        Response containing quick action definitions
    
    UPDATED: Changed "Add API Provider" route from React frontend
    to Django backend upload page at /upload-provider/
    """
    try:
        logger.info("Fetching quick actions")
        
        actions: List[Dict[str, Any]] = [
            {
                "id": "add_provider",
                "label": "Add API Provider",
                "description": "Upload OpenAPI specification to integrate new blockchain intelligence APIs",
                "icon": "cloud_upload",
                "route": "/upload-provider/",  # ← CHANGED: Now points to Django backend
                "color": "primary",
                "order": 1
            },
            {
                "id": "create_workflow",
                "label": "Create Workflow",
                "description": "Build visual blockchain intelligence workflows with drag-and-drop nodes",
                "icon": "add_box",
                "route": "http://localhost:3000/workflows/new",  # React frontend canvas
                "color": "success",
                "order": 2
            },
            {
                "id": "view_workflows",
                "label": "View Workflows",
                "description": "Browse and manage existing investigation workflows",
                "icon": "list",
                "route": "http://localhost:3000/workflows",  # React frontend
                "color": "info",
                "order": 3
            },
            {
                "id": "view_executions",
                "label": "View Executions",
                "description": "Monitor workflow execution history and logs",
                "icon": "history",
                "route": "http://localhost:3000/executions",  # React frontend
                "color": "warning",
                "order": 4
            },
            {
                "id": "manage_settings",
                "label": "Manage Settings",
                "description": "Configure API credentials and global settings",
                "icon": "settings",
                "route": "http://localhost:3000/settings",  # React frontend
                "color": "secondary",
                "order": 5
            },
            {
                "id": "api_docs",
                "label": "API Documentation",
                "description": "Explore REST API endpoints with Swagger UI",
                "icon": "description",
                "route": "/api/docs/",  # Keep this on backend
                "color": "default",
                "order": 6
            }
        ]

        response_data = {
            "actions": actions
        }
        
        logger.info(f"Retrieved {len(actions)} quick actions")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching quick actions: {str(e)}")
        return Response(
            {"error": "Failed to fetch quick actions"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# RECENT ACTIVITY FEED
# ============================================================================


@api_view(['GET'])
def recent_activity(request: Request) -> Response:
    """
    Get recent activity feed.
    
    Provides a timeline of recent actions:
    - Workflows created
    - Providers added
    - Executions run
    
    Query Parameters:
        limit: Number of items to return (default: 10, max: 50)
        
    Args:
        request: HTTP request object
        
    Returns:
        Response containing recent activity items
        
    Example Response:
        {
            "activities": [
                {
                    "type": "workflow_created",
                    "title": "New workflow created",
                    "description": "Address Attribution Workflow",
                    "timestamp": "2025-12-19T14:45:00Z",
                    "icon": "add_box"
                },
                ...
            ]
        }
    """
    try:
        # Get limit from query params
        limit = int(request.query_params.get('limit', 10))
        limit = min(limit, 50)  # Cap at 50
        
        logger.info(f"Fetching recent activity (limit: {limit})")
        
        activities: List[Dict[str, Any]] = []
        
        # ================================================================
        # RECENT WORKFLOWS
        # ================================================================
        
        recent_workflows = Workflow.objects.order_by('-created_at')[:limit]
        
        for workflow in recent_workflows:
            activities.append({
                "type": "workflow_created",
                "title": "Workflow created",
                "description": workflow.name,
                "timestamp": workflow.created_at,
                "icon": "add_box",
                "link": f"/workflows/{workflow.uuid}"
            })
        
        # ================================================================
        # RECENT PROVIDERS (FIXED: using is_active instead of is_deleted)
        # ================================================================
        
        recent_specs = OpenAPISpec.objects.filter(
            is_active=True
        ).order_by('-created_at')[:limit]
        
        for spec in recent_specs:
            activities.append({
                "type": "provider_added",
                "title": "API Provider added",
                "description": spec.name,
                "timestamp": spec.created_at,
                "icon": "cloud_upload",
                "link": f"/integrations/specs/{spec.uuid}"
            })
        
        # ================================================================
        # RECENT EXECUTIONS
        # ================================================================
        
        recent_executions = ExecutionLog.objects.order_by(
            '-started_at'
        )[:limit]
        
        for execution in recent_executions:
            activities.append({
                "type": "execution_run",
                "title": "Workflow executed",
                "description": execution.workflow.name if execution.workflow else "Unknown",
                "timestamp": execution.started_at,
                "icon": "play_arrow",
                "status": execution.status,
                "link": f"/execution/logs/{execution.uuid}"
            })
        
        # ================================================================
        # SORT BY TIMESTAMP
        # ================================================================
        
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:limit]  # Trim to limit
        
        response_data = {
            "activities": activities
        }
        
        logger.info(f"Retrieved {len(activities)} activity items")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching recent activity: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {"error": "Failed to fetch recent activity"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )