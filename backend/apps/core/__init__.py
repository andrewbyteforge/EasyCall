# =============================================================================
# FILE: easycall/backend/apps/core/__init__.py
# =============================================================================
# Core utilities, base classes, and shared functionality used across the
# application.
#
# This app provides:
# - Base model classes with common fields
# - Custom exception handling
# - Shared utilities and mixins
# - Health check and system info endpoints
# =============================================================================
"""
Core application for the EasyCall project.
"""

INSTALLED_APPS = [
    "apps.core.apps.CoreConfig",  
]