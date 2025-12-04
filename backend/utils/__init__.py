# =============================================================================
# FILE: easycall/backend/utils/__init__.py
# =============================================================================
# Shared utility functions and helpers used across the application.
#
# This package provides:
# - Encryption utilities for API credentials
# - Helper functions for common operations
# - File processing utilities
# =============================================================================
"""
Utility functions for the EasyCall application.
"""

# =============================================================================
# IMPORTS - Re-export utilities
# =============================================================================

from utils.encryption import (  # noqa: F401
    decrypt_value,
    encrypt_value,
    generate_encryption_key,
    is_encrypted,
    rotate_encryption_key,
)
from utils.helpers import (  # noqa: F401
    chunk_list,
    flatten_dict,
    generate_uuid,
    get_file_extension,
    get_timestamp,
    get_timestamp_ms,
    is_valid_uuid,
    safe_get,
    safe_string,
    sanitize_filename,
    truncate_string,
    unique_list,
)

# =============================================================================
# VERSION
# =============================================================================

__version__ = "0.1.0"