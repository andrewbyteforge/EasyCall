# =============================================================================
# FILE: easycall/backend/config/wsgi.py
# =============================================================================
# WSGI config for the EasyCall project.
#
# It exposes the WSGI callable as a module-level variable named ``application``.
#
# For more information on this file, see:
# https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
# =============================================================================
"""
WSGI configuration for the EasyCall project.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import os

from django.core.wsgi import get_wsgi_application

# =============================================================================
# WSGI APPLICATION
# =============================================================================

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()