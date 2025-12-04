# =============================================================================
# FILE: easycall/backend/utils/helpers.py
# =============================================================================
# General helper functions used throughout the application.
#
# This module provides utility functions for common operations like
# string manipulation, UUID generation, date/time handling, and more.
# =============================================================================
"""
General helper functions for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import re
import uuid
from datetime import datetime
from typing import Any, Dict, Iterator, List, Optional, TypeVar

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# TYPE VARIABLES
# =============================================================================

T = TypeVar("T")

# =============================================================================
# UUID FUNCTIONS
# =============================================================================


def generate_uuid() -> str:
    """
    Generate a new UUID4 string.

    Returns:
        A new UUID4 as a string (with hyphens).

    Example:
        >>> uid = generate_uuid()
        >>> print(uid)
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    """
    return str(uuid.uuid4())


def is_valid_uuid(value: str) -> bool:
    """
    Check if a string is a valid UUID.

    Args:
        value: The string to check.

    Returns:
        True if the string is a valid UUID, False otherwise.

    Example:
        >>> is_valid_uuid("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        True
        >>> is_valid_uuid("not-a-uuid")
        False
    """
    if not value:
        return False

    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError):
        return False


# =============================================================================
# TIMESTAMP FUNCTIONS
# =============================================================================


def get_timestamp() -> str:
    """
    Get the current UTC timestamp in ISO format.

    Returns:
        Current UTC timestamp as ISO 8601 string.

    Example:
        >>> ts = get_timestamp()
        >>> print(ts)
        '2024-01-15T10:30:00.000000Z'
    """
    return datetime.utcnow().isoformat() + "Z"


def get_timestamp_ms() -> int:
    """
    Get the current UTC timestamp in milliseconds.

    Returns:
        Current UTC timestamp as milliseconds since epoch.

    Example:
        >>> ts = get_timestamp_ms()
        >>> print(ts)
        1705314600000
    """
    return int(datetime.utcnow().timestamp() * 1000)


# =============================================================================
# STRING FUNCTIONS
# =============================================================================


def truncate_string(
    value: str,
    max_length: int,
    suffix: str = "..."
) -> str:
    """
    Truncate a string to a maximum length.

    Args:
        value: The string to truncate.
        max_length: Maximum length of the result (including suffix).
        suffix: String to append when truncating (default: "...").

    Returns:
        The truncated string with suffix, or original if shorter.

    Example:
        >>> truncate_string("Hello, World!", 10)
        'Hello, ...'
        >>> truncate_string("Hi", 10)
        'Hi'
    """
    if not value or len(value) <= max_length:
        return value

    truncated_length = max_length - len(suffix)
    if truncated_length <= 0:
        return suffix[:max_length]

    return value[:truncated_length] + suffix


def safe_string(value: Any, default: str = "") -> str:
    """
    Safely convert a value to a string.

    Args:
        value: The value to convert.
        default: Default value if conversion fails.

    Returns:
        The string representation of the value.

    Example:
        >>> safe_string(123)
        '123'
        >>> safe_string(None, "N/A")
        'N/A'
    """
    if value is None:
        return default

    try:
        return str(value)
    except Exception:
        return default


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing unsafe characters.

    Args:
        filename: The filename to sanitize.

    Returns:
        The sanitized filename.

    Example:
        >>> sanitize_filename("My File<>:name.txt")
        'My_File___name.txt'
    """
    if not filename:
        return "unnamed"

    # Replace unsafe characters with underscores
    unsafe_chars = r'[<>:"/\\|?*\x00-\x1f]'
    sanitized = re.sub(unsafe_chars, "_", filename)

    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip(". ")

    # Ensure filename is not empty
    return sanitized or "unnamed"


# =============================================================================
# DICTIONARY FUNCTIONS
# =============================================================================


def safe_get(
    data: Dict[str, Any],
    *keys: str,
    default: Any = None
) -> Any:
    """
    Safely get a nested value from a dictionary.

    Args:
        data: The dictionary to search.
        *keys: Sequence of keys to traverse.
        default: Default value if key path doesn't exist.

    Returns:
        The value at the key path, or default.

    Example:
        >>> data = {"a": {"b": {"c": 123}}}
        >>> safe_get(data, "a", "b", "c")
        123
        >>> safe_get(data, "a", "x", default="not found")
        'not found'
    """
    result = data

    for key in keys:
        if isinstance(result, dict):
            result = result.get(key)
        else:
            return default

        if result is None:
            return default

    return result


def flatten_dict(
    data: Dict[str, Any],
    separator: str = ".",
    parent_key: str = ""
) -> Dict[str, Any]:
    """
    Flatten a nested dictionary.

    Args:
        data: The dictionary to flatten.
        separator: Separator between nested keys.
        parent_key: Prefix for keys (used in recursion).

    Returns:
        A flattened dictionary.

    Example:
        >>> data = {"a": {"b": 1, "c": 2}}
        >>> flatten_dict(data)
        {'a.b': 1, 'a.c': 2}
    """
    items: List[tuple] = []

    for key, value in data.items():
        new_key = f"{parent_key}{separator}{key}" if parent_key else key

        if isinstance(value, dict):
            items.extend(
                flatten_dict(value, separator, new_key).items()
            )
        else:
            items.append((new_key, value))

    return dict(items)


# =============================================================================
# LIST FUNCTIONS
# =============================================================================


def chunk_list(data: List[T], chunk_size: int) -> Iterator[List[T]]:
    """
    Split a list into chunks of specified size.

    Args:
        data: The list to split.
        chunk_size: Maximum size of each chunk.

    Yields:
        List chunks of the specified size.

    Example:
        >>> list(chunk_list([1, 2, 3, 4, 5], 2))
        [[1, 2], [3, 4], [5]]
    """
    if chunk_size <= 0:
        raise ValueError("Chunk size must be positive")

    for i in range(0, len(data), chunk_size):
        yield data[i:i + chunk_size]


def unique_list(data: List[T]) -> List[T]:
    """
    Remove duplicates from a list while preserving order.

    Args:
        data: The list to deduplicate.

    Returns:
        A new list with duplicates removed.

    Example:
        >>> unique_list([1, 2, 2, 3, 1, 4])
        [1, 2, 3, 4]
    """
    seen: set = set()
    result: List[T] = []

    for item in data:
        # Handle unhashable items by converting to string
        try:
            key = item
            if key not in seen:
                seen.add(key)
                result.append(item)
        except TypeError:
            # Item is unhashable, use string representation
            key = str(item)
            if key not in seen:
                seen.add(key)
                result.append(item)

    return result


# =============================================================================
# FILE FUNCTIONS
# =============================================================================


def get_file_extension(filename: str) -> str:
    """
    Get the file extension from a filename.

    Args:
        filename: The filename to extract extension from.

    Returns:
        The file extension (lowercase, without dot), or empty string.

    Example:
        >>> get_file_extension("document.PDF")
        'pdf'
        >>> get_file_extension("no_extension")
        ''
    """
    if not filename or "." not in filename:
        return ""

    return filename.rsplit(".", 1)[-1].lower()


def get_file_size_display(size_bytes: int) -> str:
    """
    Convert file size in bytes to human-readable format.

    Args:
        size_bytes: File size in bytes.

    Returns:
        Human-readable file size string.

    Example:
        >>> get_file_size_display(1536)
        '1.5 KB'
        >>> get_file_size_display(1073741824)
        '1.0 GB'
    """
    if size_bytes < 0:
        return "0 B"

    units = ["B", "KB", "MB", "GB", "TB"]

    for unit in units:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024

    return f"{size_bytes:.1f} PB"