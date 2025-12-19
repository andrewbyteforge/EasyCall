# =============================================================================
# FILE: backend/fields/validators.py
# =============================================================================
"""
Custom validation functions for model fields.
"""

from django.core.exceptions import ValidationError
import re


def validate_blockchain_address(value: str) -> None:
    """
    Validate blockchain address format.
    
    Args:
        value: The address string to validate.
    
    Raises:
        ValidationError: If the address format is invalid.
    """
    # Basic validation - you can expand this
    if not value or len(value) < 20:
        raise ValidationError('Invalid blockchain address format')