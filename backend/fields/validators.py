# =============================================================================
# FILE: easycall/backend/fields/validators.py
# =============================================================================
# Centralized validators for model fields.
#
# This module provides reusable validation functions that can be used
# across models to ensure data consistency.
# =============================================================================
"""
Field validators for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import re
from typing import Any, List, Optional

from django.core.exceptions import ValidationError
from django.core.validators import (
    MaxLengthValidator,
    MaxValueValidator,
    MinValueValidator,
    RegexValidator,
)

from fields.constants import (
    BATCH_SIZE_MAX,
    BATCH_SIZE_MIN,
    MAX_LENGTH_ADDRESS,
    MAX_LENGTH_API_KEY,
    MAX_LENGTH_TX_HASH,
    NODE_POSITION_MAX,
    NODE_POSITION_MIN,
    RATE_LIMIT_MAX,
    RATE_LIMIT_MIN,
)

# =============================================================================
# REGEX PATTERNS
# =============================================================================

# Blockchain address patterns
BITCOIN_ADDRESS_PATTERN = r"^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$"
ETHEREUM_ADDRESS_PATTERN = r"^0x[a-fA-F0-9]{40}$"
GENERIC_ADDRESS_PATTERN = r"^[a-zA-Z0-9]{20,128}$"

# Transaction hash patterns
TX_HASH_PATTERN = r"^[a-fA-F0-9]{64}$"

# API key pattern (alphanumeric with optional hyphens/underscores)
API_KEY_PATTERN = r"^[a-zA-Z0-9_\-]{8,256}$"

# Workflow name pattern (alphanumeric with spaces and basic punctuation)
WORKFLOW_NAME_PATTERN = r"^[a-zA-Z0-9\s\-_\.]{1,100}$"

# =============================================================================
# DJANGO VALIDATORS
# =============================================================================

# Address validators
validate_bitcoin_address = RegexValidator(
    regex=BITCOIN_ADDRESS_PATTERN,
    message="Enter a valid Bitcoin address.",
    code="invalid_bitcoin_address",
)

validate_ethereum_address = RegexValidator(
    regex=ETHEREUM_ADDRESS_PATTERN,
    message="Enter a valid Ethereum address.",
    code="invalid_ethereum_address",
)

validate_generic_address = RegexValidator(
    regex=GENERIC_ADDRESS_PATTERN,
    message="Enter a valid blockchain address.",
    code="invalid_address",
)

# Transaction hash validator
validate_tx_hash = RegexValidator(
    regex=TX_HASH_PATTERN,
    message="Enter a valid transaction hash.",
    code="invalid_tx_hash",
)

# API key validator
validate_api_key = RegexValidator(
    regex=API_KEY_PATTERN,
    message="API key must be 8-256 characters (alphanumeric, hyphens, underscores).",
    code="invalid_api_key",
)

# Workflow name validator
validate_workflow_name = RegexValidator(
    regex=WORKFLOW_NAME_PATTERN,
    message="Workflow name must be 1-100 characters.",
    code="invalid_workflow_name",
)

# Length validators
validate_address_length = MaxLengthValidator(
    MAX_LENGTH_ADDRESS,
    message=f"Address must be {MAX_LENGTH_ADDRESS} characters or fewer.",
)

validate_api_key_length = MaxLengthValidator(
    MAX_LENGTH_API_KEY,
    message=f"API key must be {MAX_LENGTH_API_KEY} characters or fewer.",
)

validate_tx_hash_length = MaxLengthValidator(
    MAX_LENGTH_TX_HASH,
    message=f"Transaction hash must be {MAX_LENGTH_TX_HASH} characters or fewer.",
)

# Numeric validators
validate_batch_size: List = [
    MinValueValidator(
        BATCH_SIZE_MIN,
        message=f"Batch size must be at least {BATCH_SIZE_MIN}."
    ),
    MaxValueValidator(
        BATCH_SIZE_MAX,
        message=f"Batch size must be at most {BATCH_SIZE_MAX}."
    ),
]

validate_node_position: List = [
    MinValueValidator(
        NODE_POSITION_MIN,
        message=f"Position must be at least {NODE_POSITION_MIN}."
    ),
    MaxValueValidator(
        NODE_POSITION_MAX,
        message=f"Position must be at most {NODE_POSITION_MAX}."
    ),
]

validate_rate_limit: List = [
    MinValueValidator(
        RATE_LIMIT_MIN,
        message=f"Rate limit must be at least {RATE_LIMIT_MIN}."
    ),
    MaxValueValidator(
        RATE_LIMIT_MAX,
        message=f"Rate limit must be at most {RATE_LIMIT_MAX}."
    ),
]


# =============================================================================
# CUSTOM VALIDATION FUNCTIONS
# =============================================================================

def validate_blockchain_address(
    address: str,
    network: Optional[str] = None
) -> str:
    """
    Validate a blockchain address.

    Args:
        address: The address to validate.
        network: Optional network hint (bitcoin, ethereum, etc.).

    Returns:
        The validated address.

    Raises:
        ValidationError: If the address is invalid.
    """
    if not address:
        raise ValidationError("Address cannot be empty.")

    address = address.strip()

    if len(address) > MAX_LENGTH_ADDRESS:
        raise ValidationError(
            f"Address must be {MAX_LENGTH_ADDRESS} characters or fewer."
        )

    # Network-specific validation
    if network:
        network = network.lower()
        if network == "bitcoin":
            if not re.match(BITCOIN_ADDRESS_PATTERN, address):
                raise ValidationError("Invalid Bitcoin address format.")
        elif network in ("ethereum", "bsc", "polygon"):
            if not re.match(ETHEREUM_ADDRESS_PATTERN, address):
                raise ValidationError("Invalid Ethereum-compatible address format.")
        else:
            # Generic validation for other networks
            if not re.match(GENERIC_ADDRESS_PATTERN, address):
                raise ValidationError("Invalid address format.")
    else:
        # Try to detect address type
        if address.startswith("0x"):
            if not re.match(ETHEREUM_ADDRESS_PATTERN, address):
                raise ValidationError("Invalid Ethereum-compatible address format.")
        elif address.startswith(("1", "3", "bc1")):
            if not re.match(BITCOIN_ADDRESS_PATTERN, address):
                raise ValidationError("Invalid Bitcoin address format.")
        else:
            if not re.match(GENERIC_ADDRESS_PATTERN, address):
                raise ValidationError("Invalid address format.")

    return address


def validate_transaction_hash(tx_hash: str) -> str:
    """
    Validate a transaction hash.

    Args:
        tx_hash: The transaction hash to validate.

    Returns:
        The validated transaction hash.

    Raises:
        ValidationError: If the hash is invalid.
    """
    if not tx_hash:
        raise ValidationError("Transaction hash cannot be empty.")

    tx_hash = tx_hash.strip().lower()

    # Remove 0x prefix if present
    if tx_hash.startswith("0x"):
        tx_hash = tx_hash[2:]

    if not re.match(TX_HASH_PATTERN, tx_hash):
        raise ValidationError("Invalid transaction hash format.")

    return tx_hash


def validate_json_data(data: Any) -> Any:
    """
    Validate that data is JSON-serializable.

    Args:
        data: The data to validate.

    Returns:
        The validated data.

    Raises:
        ValidationError: If the data cannot be serialized to JSON.
    """
    import json

    try:
        json.dumps(data)
        return data
    except (TypeError, ValueError) as e:
        raise ValidationError(f"Data must be JSON-serializable: {e}")


def validate_positive_integer(value: int) -> int:
    """
    Validate that a value is a positive integer.

    Args:
        value: The value to validate.

    Returns:
        The validated value.

    Raises:
        ValidationError: If the value is not a positive integer.
    """
    if not isinstance(value, int):
        raise ValidationError("Value must be an integer.")

    if value <= 0:
        raise ValidationError("Value must be a positive integer.")

    return value


def validate_file_extension(
    filename: str,
    allowed_extensions: List[str]
) -> str:
    """
    Validate that a filename has an allowed extension.

    Args:
        filename: The filename to validate.
        allowed_extensions: List of allowed extensions (without dot).

    Returns:
        The validated filename.

    Raises:
        ValidationError: If the extension is not allowed.
    """
    if not filename:
        raise ValidationError("Filename cannot be empty.")

    # Get the extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in allowed_extensions:
        allowed = ", ".join(f".{e}" for e in allowed_extensions)
        raise ValidationError(
            f"Invalid file extension. Allowed extensions: {allowed}"
        )

    return filename