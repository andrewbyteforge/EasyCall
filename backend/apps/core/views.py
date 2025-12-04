# =============================================================================
# FILE: easycall/backend/apps/core/views.py
# =============================================================================
# Core API views for health checks, system information, and other
# utility endpoints.
# =============================================================================
"""
Core views for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import platform
import sys
from datetime import datetime
from typing import Any, Dict

import django
from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# HEALTH CHECK VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request: Request) -> Response:
    """
    Basic health check endpoint.

    Returns a simple response indicating the API is running.
    This endpoint is useful for load balancers and monitoring systems.

    Args:
        request: The HTTP request object.

    Returns:
        Response with status "healthy" and timestamp.

    Example Response:
        {
            "status": "healthy",
            "timestamp": "2024-01-15T10:30:00.000Z"
        }
    """
    logger.debug("Health check requested")

    return Response(
        {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def detailed_health_check(request: Request) -> Response:
    """
    Detailed health check with component status.

    Checks the health of various system components:
    - Database connectivity
    - File system access
    - Memory usage

    Args:
        request: The HTTP request object.

    Returns:
        Response with detailed health information.

    Example Response:
        {
            "status": "healthy",
            "timestamp": "2024-01-15T10:30:00.000Z",
            "components": {
                "database": {"status": "healthy", "latency_ms": 5},
                "filesystem": {"status": "healthy"},
            }
        }
    """
    logger.debug("Detailed health check requested")

    components: Dict[str, Dict[str, Any]] = {}
    overall_status = "healthy"

    # Check database connectivity
    try:
        start_time = datetime.utcnow()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        latency = (datetime.utcnow() - start_time).total_seconds() * 1000

        components["database"] = {
            "status": "healthy",
            "latency_ms": round(latency, 2),
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        components["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        overall_status = "unhealthy"

    # Check file system (media directory)
    try:
        media_path = settings.MEDIA_ROOT
        media_path.mkdir(parents=True, exist_ok=True)

        # Test write access
        test_file = media_path / ".health_check"
        test_file.write_text("test")
        test_file.unlink()

        components["filesystem"] = {"status": "healthy"}
    except Exception as e:
        logger.error(f"Filesystem health check failed: {e}")
        components["filesystem"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        overall_status = "degraded"

    return Response(
        {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "components": components,
        },
        status=(
            status.HTTP_200_OK
            if overall_status in ("healthy", "degraded")
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
    )


# =============================================================================
# SYSTEM INFO VIEWS
# =============================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def system_info(request: Request) -> Response:
    """
    Get system and application information.

    Returns version information and system details.
    Useful for debugging and support purposes.

    Args:
        request: The HTTP request object.

    Returns:
        Response with system information.

    Example Response:
        {
            "application": {
                "name": "EasyCall",
                "version": "0.1.0",
                "environment": "development"
            },
            "system": {
                "python_version": "3.11.5",
                "django_version": "5.0.1",
                "platform": "Windows-10-..."
            }
        }
    """
    logger.debug("System info requested")

    return Response(
        {
            "application": {
                "name": "EasyCall",
                "version": "0.1.0",
                "description": "Blockchain Intelligence Workflow Builder",
                "environment": "development" if settings.DEBUG else "production",
            },
            "system": {
                "python_version": sys.version.split()[0],
                "django_version": ".".join(map(str, django.VERSION[:3])),
                "platform": platform.platform(),
                "database": "SQLite",
            },
            "configuration": {
                "debug_mode": settings.DEBUG,
                "batch_size_limit": settings.BATCH_SIZE_LIMIT,
                "execution_timeout": settings.EXECUTION_TIMEOUT,
            },
        },
        status=status.HTTP_200_OK
    )


# =============================================================================
# PING VIEW
# =============================================================================


@api_view(["GET"])
@permission_classes([AllowAny])
def ping(request: Request) -> Response:
    """
    Simple ping endpoint for connectivity testing.

    Returns "pong" to confirm API is reachable.

    Args:
        request: The HTTP request object.

    Returns:
        Response with "pong" message.
    """
    return Response(
        {"message": "pong"},
        status=status.HTTP_200_OK
    )