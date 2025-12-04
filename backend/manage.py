#!/usr/bin/env python
# =============================================================================
# FILE: easycall/backend/manage.py
# =============================================================================
# Django's command-line utility for administrative tasks.
#
# Usage:
#     python manage.py <command> [options]
#
# Common commands:
#     runserver        - Start development server
#     migrate          - Apply database migrations
#     makemigrations   - Create new migrations
#     shell            - Open Django shell
#     test             - Run tests
#     createsuperuser  - Create admin user
# =============================================================================
"""
Django management script for the EasyCall backend application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import os
import sys


# =============================================================================
# MAIN FUNCTION
# =============================================================================

def main() -> None:
    """
    Run administrative tasks.

    This function sets up the Django settings module and executes the
    command-line utility for administrative tasks.

    Raises:
        ImportError: If Django is not installed or cannot be imported.
    """
    # Set the default settings module
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line(sys.argv)


# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    main()