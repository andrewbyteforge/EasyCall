# =============================================================================
# FILE: easycall/backend/fields/constants.py
# =============================================================================
# Centralized constants for field validation, lengths, and configuration.
#
# This module provides a single source of truth for all numeric constraints
# and configuration values used in model fields.
# =============================================================================
"""
Field constants for validation and configuration.
"""

# =============================================================================
# STRING FIELD LENGTH CONSTANTS
# =============================================================================

# Short strings (names, titles, etc.)
MAX_LENGTH_NAME: int = 100
MAX_LENGTH_TITLE: int = 200
MAX_LENGTH_SHORT: int = 50

# Medium strings (descriptions, etc.)
MAX_LENGTH_DESCRIPTION: int = 500
MAX_LENGTH_MEDIUM: int = 255

# Long strings (content, JSON, etc.)
MAX_LENGTH_LONG: int = 1000
MAX_LENGTH_CONTENT: int = 5000

# Extra long (JSON data, logs, etc.)
MAX_LENGTH_JSON: int = 50000
MAX_LENGTH_LOG: int = 100000

# =============================================================================
# API CREDENTIAL CONSTANTS
# =============================================================================

# API key length constraints
MAX_LENGTH_API_KEY: int = 256
MAX_LENGTH_API_SECRET: int = 256
MAX_LENGTH_API_URL: int = 500

# =============================================================================
# WORKFLOW CONSTANTS
# =============================================================================

# Node position coordinates
NODE_POSITION_MIN: float = -10000.0
NODE_POSITION_MAX: float = 10000.0
NODE_POSITION_DEFAULT: float = 0.0

# Canvas dimensions
CANVAS_MIN_ZOOM: float = 0.1
CANVAS_MAX_ZOOM: float = 2.0
CANVAS_DEFAULT_ZOOM: float = 1.0

# Maximum nodes per workflow
MAX_NODES_PER_WORKFLOW: int = 500

# Maximum connections per workflow
MAX_CONNECTIONS_PER_WORKFLOW: int = 1000

# =============================================================================
# BATCH PROCESSING CONSTANTS
# =============================================================================

# Batch size limits
BATCH_SIZE_MIN: int = 1
BATCH_SIZE_MAX: int = 10000
BATCH_SIZE_DEFAULT: int = 100

# File upload limits (in bytes)
MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
MAX_UPLOAD_SIZE_DISPLAY: str = "50 MB"

# =============================================================================
# EXECUTION CONSTANTS
# =============================================================================

# Timeout values (in seconds)
EXECUTION_TIMEOUT_MIN: int = 60
EXECUTION_TIMEOUT_MAX: int = 3600
EXECUTION_TIMEOUT_DEFAULT: int = 300

# Retry configuration
RETRY_ATTEMPTS_MIN: int = 0
RETRY_ATTEMPTS_MAX: int = 5
RETRY_ATTEMPTS_DEFAULT: int = 3

RETRY_DELAY_MIN: float = 0.5
RETRY_DELAY_MAX: float = 60.0
RETRY_DELAY_DEFAULT: float = 1.0

# =============================================================================
# RATE LIMITING CONSTANTS
# =============================================================================

# Requests per minute limits
RATE_LIMIT_MIN: int = 1
RATE_LIMIT_MAX: int = 1000
RATE_LIMIT_DEFAULT: int = 60

# Delay between requests (in seconds)
RATE_DELAY_MIN: float = 0.0
RATE_DELAY_MAX: float = 60.0
RATE_DELAY_DEFAULT: float = 1.0

# =============================================================================
# BLOCKCHAIN ADDRESS CONSTANTS
# =============================================================================

# Address length constraints
MAX_LENGTH_ADDRESS: int = 128
MAX_LENGTH_TX_HASH: int = 128

# Supported blockchain networks
SUPPORTED_NETWORKS: list[str] = [
    "bitcoin",
    "ethereum",
    "litecoin",
    "bitcoin_cash",
    "ripple",
    "tron",
    "binance_smart_chain",
]

# =============================================================================
# PIN (CONNECTION POINT) CONSTANTS
# =============================================================================

# Pin identifier length
MAX_LENGTH_PIN_ID: int = 50
MAX_LENGTH_PIN_NAME: int = 100

# Maximum pins per node
MAX_INPUT_PINS: int = 10
MAX_OUTPUT_PINS: int = 10

# =============================================================================
# EXPORT CONSTANTS
# =============================================================================

# Export file name length
MAX_LENGTH_FILENAME: int = 255

# Export row limits
EXPORT_ROW_LIMIT_EXCEL: int = 1048576  # Excel row limit
EXPORT_ROW_LIMIT_CSV: int = 10000000   # Practical CSV limit

# =============================================================================
# UUID CONSTANTS
# =============================================================================

# UUID string length (with hyphens)
UUID_LENGTH: int = 36

# =============================================================================
# VERSION CONSTANTS
# =============================================================================

# Version string length
MAX_LENGTH_VERSION: int = 20