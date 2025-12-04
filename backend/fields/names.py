# =============================================================================
# FILE: easycall/backend/fields/names.py
# =============================================================================
# Centralized field names and verbose names for model consistency.
#
# This module ensures all models use consistent field naming conventions
# and provides human-readable verbose names for display.
# =============================================================================
"""
Field names and verbose names for the EasyCall application.
"""

# =============================================================================
# COMMON FIELD NAMES
# =============================================================================

# Primary identifiers
FIELD_ID = "id"
FIELD_UUID = "uuid"

# Timestamps
FIELD_CREATED_AT = "created_at"
FIELD_UPDATED_AT = "updated_at"
FIELD_DELETED_AT = "deleted_at"

# Common text fields
FIELD_NAME = "name"
FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_CONTENT = "content"
FIELD_NOTES = "notes"

# Status fields
FIELD_STATUS = "status"
FIELD_IS_ACTIVE = "is_active"
FIELD_IS_DELETED = "is_deleted"

# =============================================================================
# WORKFLOW FIELD NAMES
# =============================================================================

# Workflow model
FIELD_WORKFLOW_ID = "workflow_id"
FIELD_WORKFLOW_NAME = "workflow_name"
FIELD_WORKFLOW_DESCRIPTION = "workflow_description"
FIELD_CANVAS_DATA = "canvas_data"
FIELD_VIEWPORT = "viewport"

# =============================================================================
# NODE FIELD NAMES
# =============================================================================

# Node model
FIELD_NODE_ID = "node_id"
FIELD_NODE_TYPE = "node_type"
FIELD_NODE_CATEGORY = "node_category"
FIELD_NODE_LABEL = "node_label"
FIELD_NODE_DATA = "node_data"
FIELD_NODE_CONFIG = "node_config"

# Node position
FIELD_POSITION_X = "position_x"
FIELD_POSITION_Y = "position_y"

# Node styling
FIELD_WIDTH = "width"
FIELD_HEIGHT = "height"
FIELD_COLOR = "color"

# =============================================================================
# CONNECTION FIELD NAMES
# =============================================================================

# Connection model
FIELD_CONNECTION_ID = "connection_id"
FIELD_SOURCE_NODE = "source_node"
FIELD_TARGET_NODE = "target_node"
FIELD_SOURCE_PIN = "source_pin"
FIELD_TARGET_PIN = "target_pin"

# =============================================================================
# PIN FIELD NAMES
# =============================================================================

# Pin model
FIELD_PIN_ID = "pin_id"
FIELD_PIN_NAME = "pin_name"
FIELD_PIN_TYPE = "pin_type"
FIELD_PIN_DATA_TYPE = "pin_data_type"
FIELD_PIN_REQUIRED = "pin_required"
FIELD_PIN_DEFAULT = "pin_default_value"

# =============================================================================
# EXECUTION FIELD NAMES
# =============================================================================

# Execution model
FIELD_EXECUTION_ID = "execution_id"
FIELD_EXECUTION_STATUS = "execution_status"
FIELD_STARTED_AT = "started_at"
FIELD_COMPLETED_AT = "completed_at"
FIELD_DURATION = "duration"
FIELD_RESULT = "result"
FIELD_ERROR_MESSAGE = "error_message"

# =============================================================================
# LOG FIELD NAMES
# =============================================================================

# Log model
FIELD_LOG_ID = "log_id"
FIELD_LOG_LEVEL = "log_level"
FIELD_LOG_MESSAGE = "log_message"
FIELD_LOG_TIMESTAMP = "log_timestamp"
FIELD_LOG_SOURCE = "log_source"
FIELD_LOG_METADATA = "log_metadata"

# =============================================================================
# API CREDENTIAL FIELD NAMES
# =============================================================================

# Credential model
FIELD_API_KEY = "api_key"
FIELD_API_SECRET = "api_secret"
FIELD_API_URL = "api_url"
FIELD_API_PROVIDER = "api_provider"
FIELD_ENCRYPTED_KEY = "encrypted_key"
FIELD_ENCRYPTED_SECRET = "encrypted_secret"

# =============================================================================
# BLOCKCHAIN FIELD NAMES
# =============================================================================

# Address fields
FIELD_ADDRESS = "address"
FIELD_ADDRESS_LIST = "address_list"
FIELD_NETWORK = "network"

# Transaction fields
FIELD_TX_HASH = "tx_hash"
FIELD_TX_HASH_LIST = "tx_hash_list"

# =============================================================================
# SETTINGS FIELD NAMES
# =============================================================================

# Settings model
FIELD_SETTING_KEY = "setting_key"
FIELD_SETTING_VALUE = "setting_value"
FIELD_SETTING_TYPE = "setting_type"
FIELD_SETTING_CATEGORY = "setting_category"

# =============================================================================
# EXPORT FIELD NAMES
# =============================================================================

# Export model
FIELD_EXPORT_FORMAT = "export_format"
FIELD_FILE_NAME = "file_name"
FIELD_FILE_PATH = "file_path"
FIELD_FILE_SIZE = "file_size"

# =============================================================================
# VERBOSE NAMES (for Django model field verbose_name)
# =============================================================================

VERBOSE_NAMES = {
    # Common
    FIELD_ID: "ID",
    FIELD_UUID: "UUID",
    FIELD_CREATED_AT: "Created At",
    FIELD_UPDATED_AT: "Updated At",
    FIELD_DELETED_AT: "Deleted At",
    FIELD_NAME: "Name",
    FIELD_TITLE: "Title",
    FIELD_DESCRIPTION: "Description",
    FIELD_CONTENT: "Content",
    FIELD_NOTES: "Notes",
    FIELD_STATUS: "Status",
    FIELD_IS_ACTIVE: "Is Active",
    FIELD_IS_DELETED: "Is Deleted",

    # Workflow
    FIELD_WORKFLOW_ID: "Workflow ID",
    FIELD_WORKFLOW_NAME: "Workflow Name",
    FIELD_WORKFLOW_DESCRIPTION: "Workflow Description",
    FIELD_CANVAS_DATA: "Canvas Data",
    FIELD_VIEWPORT: "Viewport",

    # Node
    FIELD_NODE_ID: "Node ID",
    FIELD_NODE_TYPE: "Node Type",
    FIELD_NODE_CATEGORY: "Node Category",
    FIELD_NODE_LABEL: "Node Label",
    FIELD_NODE_DATA: "Node Data",
    FIELD_NODE_CONFIG: "Node Configuration",
    FIELD_POSITION_X: "X Position",
    FIELD_POSITION_Y: "Y Position",
    FIELD_WIDTH: "Width",
    FIELD_HEIGHT: "Height",
    FIELD_COLOR: "Color",

    # Connection
    FIELD_CONNECTION_ID: "Connection ID",
    FIELD_SOURCE_NODE: "Source Node",
    FIELD_TARGET_NODE: "Target Node",
    FIELD_SOURCE_PIN: "Source Pin",
    FIELD_TARGET_PIN: "Target Pin",

    # Pin
    FIELD_PIN_ID: "Pin ID",
    FIELD_PIN_NAME: "Pin Name",
    FIELD_PIN_TYPE: "Pin Type",
    FIELD_PIN_DATA_TYPE: "Data Type",
    FIELD_PIN_REQUIRED: "Required",
    FIELD_PIN_DEFAULT: "Default Value",

    # Execution
    FIELD_EXECUTION_ID: "Execution ID",
    FIELD_EXECUTION_STATUS: "Execution Status",
    FIELD_STARTED_AT: "Started At",
    FIELD_COMPLETED_AT: "Completed At",
    FIELD_DURATION: "Duration",
    FIELD_RESULT: "Result",
    FIELD_ERROR_MESSAGE: "Error Message",

    # Log
    FIELD_LOG_ID: "Log ID",
    FIELD_LOG_LEVEL: "Log Level",
    FIELD_LOG_MESSAGE: "Log Message",
    FIELD_LOG_TIMESTAMP: "Timestamp",
    FIELD_LOG_SOURCE: "Source",
    FIELD_LOG_METADATA: "Metadata",

    # API Credential
    FIELD_API_KEY: "API Key",
    FIELD_API_SECRET: "API Secret",
    FIELD_API_URL: "API URL",
    FIELD_API_PROVIDER: "API Provider",
    FIELD_ENCRYPTED_KEY: "Encrypted Key",
    FIELD_ENCRYPTED_SECRET: "Encrypted Secret",

    # Blockchain
    FIELD_ADDRESS: "Address",
    FIELD_ADDRESS_LIST: "Address List",
    FIELD_NETWORK: "Network",
    FIELD_TX_HASH: "Transaction Hash",
    FIELD_TX_HASH_LIST: "Transaction Hash List",

    # Settings
    FIELD_SETTING_KEY: "Setting Key",
    FIELD_SETTING_VALUE: "Setting Value",
    FIELD_SETTING_TYPE: "Setting Type",
    FIELD_SETTING_CATEGORY: "Setting Category",

    # Export
    FIELD_EXPORT_FORMAT: "Export Format",
    FIELD_FILE_NAME: "File Name",
    FIELD_FILE_PATH: "File Path",
    FIELD_FILE_SIZE: "File Size",
}


def get_verbose_name(field_name: str) -> str:
    """
    Get the verbose name for a field.

    Args:
        field_name: The field name constant.

    Returns:
        The human-readable verbose name, or the field name with
        underscores replaced by spaces and title-cased.
    """
    return VERBOSE_NAMES.get(
        field_name,
        field_name.replace("_", " ").title()
    )