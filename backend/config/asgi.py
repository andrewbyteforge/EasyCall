# =============================================================================
# FILE: easycall/backend/config/asgi.py
# =============================================================================
# ASGI config for the EasyCall project.
#
# It exposes the ASGI callable as a module-level variable named ``application``.
# This configuration supports both HTTP and WebSocket connections using
# Django Channels.
#
# For more information on this file, see:
# https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
# https://channels.readthedocs.io/en/stable/
# =============================================================================
"""
ASGI configuration for the EasyCall project.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

# =============================================================================
# DJANGO SETUP
# =============================================================================

# Set the Django settings module before importing URL routing
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize Django ASGI application early to ensure apps are loaded
django_asgi_app = get_asgi_application()

# =============================================================================
# WEBSOCKET ROUTING
# =============================================================================

# Import websocket routing after Django is initialized
from apps.execution.routing import websocket_urlpatterns

# =============================================================================
# ASGI APPLICATION
# =============================================================================

application = ProtocolTypeRouter(
    {
        # HTTP requests handled by Django
        "http": django_asgi_app,

        # WebSocket connections for real-time features
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            )
        ),
    }
)