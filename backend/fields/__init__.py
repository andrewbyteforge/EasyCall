# =============================================================================
# FILE: easycall/backend/fields/__init__.py
# =============================================================================
# Centralized field definitions, constants, and field names used throughout
# the application. This module provides a single source of truth for:
#
# - Model field names and verbose names
# - Field validation constants (max lengths, choices, etc.)
# - Common field configurations
# - Enumeration values
#
# Importing from this package ensures consistency across all models and
# serializers.
# =============================================================================
"""
Centralized field definitions for the EasyCall application.
"""

# =============================================================================
# IMPORTS - Re-export all field definitions
# =============================================================================

from fields.constants import *  # noqa: F401, F403
from fields.choices import *    # noqa: F401, F403
from fields.names import *      # noqa: F401, F403
from fields.validators import * # noqa: F401, F403

# =============================================================================
# VERSION
# =============================================================================

__version__ = "0.1.0"