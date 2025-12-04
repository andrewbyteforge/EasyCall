# =============================================================================
# FILE: easycall/backend/apps/core/exceptions.py
# =============================================================================
# Custom exception classes and exception handlers for the application.
#
# This module provides:
# - Custom exception classes for different error scenarios
# - DRF exception handler with enhanced error responses
# - Utility functions for exception handling
# =============================================================================
"""
Custom exceptions for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Any, Dict, Optional

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# BASE EXCEPTION CLASSES
# =============================================================================


class EasyCallException(APIException):
    """
    Base exception class for all application-specific exceptions.

    All custom exceptions should inherit from this class to ensure
    consistent error handling and logging.

    Attributes:
        default_detail: Default error message.
        default_code: Default error code for identification.
        status_code: HTTP status code to return.
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail: str = "An unexpected error occurred."
    default_code: str = "server_error"

    def __init__(
        self,
        detail: Optional[str] = None,
        code: Optional[str] = None,
        params: Optional[Dict] = None
    ) -> None:
        """
        Initialize the exception.

        Args:
            detail: Custom error message (uses default if not provided).
            code: Custom error code (uses default if not provided).
            params: Additional parameters for error context.
        """
        self.detail = detail or self.default_detail
        self.code = code or self.default_code
        self.params = params or {}

        # Log the exception
        logger.error(
            f"{self.__class__.__name__}: {self.detail}",
            extra={"code": self.code, "params": self.params}
        )

        super().__init__(detail=self.detail, code=self.code)


# =============================================================================
# VALIDATION EXCEPTIONS
# =============================================================================


class ValidationException(EasyCallException):
    """Exception raised when data validation fails."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid data provided."
    default_code = "validation_error"


class RequiredFieldException(ValidationException):
    """Exception raised when a required field is missing."""

    default_detail = "A required field is missing."
    default_code = "required_field_missing"


class InvalidFormatException(ValidationException):
    """Exception raised when data is in an invalid format."""

    default_detail = "Data is in an invalid format."
    default_code = "invalid_format"


# =============================================================================
# RESOURCE EXCEPTIONS
# =============================================================================


class ResourceNotFoundException(EasyCallException):
    """Exception raised when a requested resource is not found."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "The requested resource was not found."
    default_code = "not_found"


class ResourceConflictException(EasyCallException):
    """Exception raised when there's a conflict with existing resources."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "A conflict occurred with existing data."
    default_code = "conflict"


# =============================================================================
# WORKFLOW EXCEPTIONS
# =============================================================================


class WorkflowException(EasyCallException):
    """Base exception for workflow-related errors."""

    default_detail = "A workflow error occurred."
    default_code = "workflow_error"


class WorkflowValidationException(WorkflowException):
    """Exception raised when workflow validation fails."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Workflow validation failed."
    default_code = "workflow_validation_error"


class InvalidConnectionException(WorkflowValidationException):
    """Exception raised when a node connection is invalid."""

    default_detail = "Invalid node connection."
    default_code = "invalid_connection"


class CyclicGraphException(WorkflowValidationException):
    """Exception raised when the workflow graph contains a cycle."""

    default_detail = "Workflow contains a circular dependency."
    default_code = "cyclic_graph"


# =============================================================================
# EXECUTION EXCEPTIONS
# =============================================================================


class ExecutionException(EasyCallException):
    """Base exception for workflow execution errors."""

    default_detail = "An error occurred during workflow execution."
    default_code = "execution_error"


class NodeExecutionException(ExecutionException):
    """Exception raised when a node execution fails."""

    default_detail = "Node execution failed."
    default_code = "node_execution_error"


class ExecutionTimeoutException(ExecutionException):
    """Exception raised when workflow execution times out."""

    status_code = status.HTTP_408_REQUEST_TIMEOUT
    default_detail = "Workflow execution timed out."
    default_code = "execution_timeout"


# =============================================================================
# API INTEGRATION EXCEPTIONS
# =============================================================================


class APIIntegrationException(EasyCallException):
    """Base exception for external API integration errors."""

    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "An error occurred communicating with external API."
    default_code = "api_integration_error"


class APIAuthenticationException(APIIntegrationException):
    """Exception raised when API authentication fails."""

    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "API authentication failed. Check your credentials."
    default_code = "api_auth_error"


class APIRateLimitException(APIIntegrationException):
    """Exception raised when API rate limit is exceeded."""

    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "API rate limit exceeded. Please wait and try again."
    default_code = "api_rate_limit"


# =============================================================================
# FILE PROCESSING EXCEPTIONS
# =============================================================================


class FileProcessingException(EasyCallException):
    """Base exception for file processing errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "An error occurred processing the file."
    default_code = "file_processing_error"


class UnsupportedFileFormatException(FileProcessingException):
    """Exception raised when file format is not supported."""

    default_detail = "The file format is not supported."
    default_code = "unsupported_format"


class FileTooLargeException(FileProcessingException):
    """Exception raised when file exceeds size limit."""

    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    default_detail = "The file is too large."
    default_code = "file_too_large"


# =============================================================================
# CUSTOM EXCEPTION HANDLER
# =============================================================================


def custom_exception_handler(
    exc: Exception,
    context: Dict[str, Any]
) -> Optional[Response]:
    """
    Custom exception handler for Django REST Framework.

    This handler extends the default DRF exception handler to:
    - Provide consistent error response format
    - Handle Django validation errors
    - Include additional error metadata
    - Log all exceptions

    Args:
        exc: The exception that was raised.
        context: Context dictionary with request info.

    Returns:
        Response object with error details, or None if not handled.
    """
    # Get the request from context for logging
    request = context.get("request")
    view = context.get("view")

    # Log the exception
    logger.error(
        f"Exception in {view.__class__.__name__ if view else 'unknown'}: {exc}",
        extra={
            "exception_type": exc.__class__.__name__,
            "path": request.path if request else None,
            "method": request.method if request else None,
        },
        exc_info=True
    )

    # Call the default handler first
    response = drf_exception_handler(exc, context)

    # Handle Django ValidationError
    if isinstance(exc, DjangoValidationError):
        response = Response(
            {
                "success": False,
                "error": {
                    "code": "validation_error",
                    "message": "Validation failed.",
                    "details": exc.messages if hasattr(exc, "messages") else [str(exc)],
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Format response for our custom exceptions
    if response is not None:
        # Get error details
        if isinstance(exc, EasyCallException):
            error_code = exc.code
            error_message = exc.detail
            error_params = exc.params
        else:
            error_code = getattr(exc, "default_code", "error")
            error_message = str(exc.detail) if hasattr(exc, "detail") else str(exc)
            error_params = {}

        # Build consistent response format
        response.data = {
            "success": False,
            "error": {
                "code": error_code,
                "message": error_message,
                "details": error_params,
            }
        }

    return response