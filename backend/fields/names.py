# =============================================================================
# FILE: backend/fields/names.py
# =============================================================================
"""
Field names and verbose name mappings.
"""

# =============================================================================
# COMMON FIELD NAMES
# =============================================================================

FIELD_UUID = 'uuid'
FIELD_CREATED_AT = 'created_at'
FIELD_UPDATED_AT = 'updated_at'
FIELD_IS_ACTIVE = 'is_active'

# =============================================================================
# WORKFLOW FIELD NAMES
# =============================================================================

FIELD_WORKFLOW_NAME = 'workflow_name'
FIELD_WORKFLOW_DESCRIPTION = 'workflow_description'
FIELD_CANVAS_DATA = 'canvas_data'

# =============================================================================
# SETTINGS FIELD NAMES
# =============================================================================

FIELD_API_KEY = 'api_key'
FIELD_API_SECRET = 'api_secret'
FIELD_API_URL = 'api_url'
FIELD_API_PROVIDER = 'api_provider'

# =============================================================================
# EXECUTION FIELD NAMES
# =============================================================================

FIELD_EXECUTION_STATUS = 'execution_status'
FIELD_STARTED_AT = 'started_at'
FIELD_COMPLETED_AT = 'completed_at'
FIELD_ERROR_MESSAGE = 'error_message'
FIELD_RESULT = 'result_data'

# =============================================================================
# VERBOSE NAME MAPPING
# =============================================================================

VERBOSE_NAMES = {
    FIELD_UUID: 'UUID',
    FIELD_CREATED_AT: 'Created At',
    FIELD_UPDATED_AT: 'Updated At',
    FIELD_IS_ACTIVE: 'Is Active',
    FIELD_WORKFLOW_NAME: 'Workflow Name',
    FIELD_WORKFLOW_DESCRIPTION: 'Workflow Description',
    FIELD_CANVAS_DATA: 'Canvas Data',
    FIELD_API_KEY: 'API Key',
    FIELD_API_SECRET: 'API Secret',
    FIELD_API_URL: 'API URL',
    FIELD_API_PROVIDER: 'API Provider',
    FIELD_EXECUTION_STATUS: 'Execution Status',
    FIELD_STARTED_AT: 'Started At',
    FIELD_COMPLETED_AT: 'Completed At',
    FIELD_ERROR_MESSAGE: 'Error Message',
    FIELD_RESULT: 'Result Data',
}


def get_verbose_name(field_name: str) -> str:
    """
    Get verbose name for a field.
    
    Args:
        field_name: The field name constant.
    
    Returns:
        Human-readable verbose name.
    """
    return VERBOSE_NAMES.get(field_name, field_name.replace('_', ' ').title())