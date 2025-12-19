# =============================================================================
# FILE: easycall/backend/fields/choices.py
# =============================================================================
# Centralized choice enumerations for model fields.
#
# This module provides all choice tuples and enums used in Django model
# fields with choices. Using centralized choices ensures consistency
# across the application.
# =============================================================================
"""
Field choices and enumerations for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from enum import Enum
from typing import List, Tuple

# =============================================================================
# NODE TYPE CHOICES
# =============================================================================


class NodeCategory(str, Enum):
    """Categories of nodes available in the workflow builder."""

    CONFIGURATION = "configuration"
    INPUT = "input"
    QUERY = "query"
    OUTPUT = "output"


NODE_CATEGORY_CHOICES: List[Tuple[str, str]] = [
    (NodeCategory.CONFIGURATION.value, "Configuration"),
    (NodeCategory.INPUT.value, "Input"),
    (NodeCategory.QUERY.value, "Query"),
    (NodeCategory.OUTPUT.value, "Output"),
]


class NodeType(str, Enum):
    """Specific node types within each category."""

    # Configuration nodes
    CREDENTIALS = "credentials"
    RATE_LIMITER = "rate_limiter"

    # Input nodes
    SINGLE_ADDRESS = "single_address"
    BATCH_INPUT = "batch_input"
    TRANSACTION_HASH = "transaction_hash"

    # Query nodes - Chainalysis
    CHAINALYSIS_CLUSTER_INFO = "chainalysis_cluster_info"
    CHAINALYSIS_CLUSTER_BALANCE = "chainalysis_cluster_balance"
    CHAINALYSIS_CLUSTER_COUNTERPARTIES = "chainalysis_cluster_counterparties"
    CHAINALYSIS_TRANSACTION_DETAILS = "chainalysis_transaction_details"
    CHAINALYSIS_EXPOSURE_CATEGORY = "chainalysis_exposure_category"
    CHAINALYSIS_EXPOSURE_SERVICE = "chainalysis_exposure_service"

    # Query nodes - TRM Labs
    TRM_ADDRESS_ATTRIBUTION = "trm_address_attribution"
    TRM_TOTAL_EXPOSURE = "trm_total_exposure"
    TRM_ADDRESS_SUMMARY = "trm_address_summary"
    TRM_ADDRESS_TRANSFERS = "trm_address_transfers"
    TRM_NETWORK_INTELLIGENCE = "trm_network_intelligence"

    # Output nodes
    TXT_EXPORT = "txt_export"
    EXCEL_EXPORT = "excel_export"
    JSON_EXPORT = "json_export"
    CSV_EXPORT = "csv_export"
    PDF_EXPORT = "pdf_export"
    CONSOLE_LOG = "console_log"


NODE_TYPE_CHOICES: List[Tuple[str, str]] = [
    # Configuration
    (NodeType.CREDENTIALS.value, "API Credentials"),
    (NodeType.RATE_LIMITER.value, "Rate Limiter"),

    # Input
    (NodeType.SINGLE_ADDRESS.value, "Single Address Input"),
    (NodeType.BATCH_INPUT.value, "Batch Address Input"),
    (NodeType.TRANSACTION_HASH.value, "Transaction Hash Input"),

    # Chainalysis Query
    (NodeType.CHAINALYSIS_CLUSTER_INFO.value, "Chainalysis - Cluster Info"),
    (NodeType.CHAINALYSIS_CLUSTER_BALANCE.value, "Chainalysis - Cluster Balance"),
    (NodeType.CHAINALYSIS_CLUSTER_COUNTERPARTIES.value, "Chainalysis - Counterparties"),
    (NodeType.CHAINALYSIS_TRANSACTION_DETAILS.value, "Chainalysis - Transaction Details"),
    (NodeType.CHAINALYSIS_EXPOSURE_CATEGORY.value, "Chainalysis - Exposure by Category"),
    (NodeType.CHAINALYSIS_EXPOSURE_SERVICE.value, "Chainalysis - Exposure by Service"),

    # TRM Query
    (NodeType.TRM_ADDRESS_ATTRIBUTION.value, "TRM - Address Attribution"),
    (NodeType.TRM_TOTAL_EXPOSURE.value, "TRM - Total Exposure"),
    (NodeType.TRM_ADDRESS_SUMMARY.value, "TRM - Address Summary"),
    (NodeType.TRM_ADDRESS_TRANSFERS.value, "TRM - Address Transfers"),
    (NodeType.TRM_NETWORK_INTELLIGENCE.value, "TRM - Network Intelligence"),

    # Output
    (NodeType.TXT_EXPORT.value, "Export to TXT"),
    (NodeType.EXCEL_EXPORT.value, "Export to Excel"),
    (NodeType.JSON_EXPORT.value, "Export to JSON"),
    (NodeType.CSV_EXPORT.value, "Export to CSV"),
    (NodeType.PDF_EXPORT.value, "Export to PDF Report"),
    (NodeType.CONSOLE_LOG.value, "Console Log"),
]

# =============================================================================
# API PROVIDER CHOICES
# =============================================================================


class APIProvider(str, Enum):
    """Supported API providers for blockchain intelligence."""

    CHAINALYSIS = "chainalysis"
    TRM_LABS = "trm_labs"


API_PROVIDER_CHOICES: List[Tuple[str, str]] = [
    (APIProvider.CHAINALYSIS.value, "Chainalysis Reactor"),
    (APIProvider.TRM_LABS.value, "TRM Labs"),
]

# =============================================================================
# BLOCKCHAIN NETWORK CHOICES
# =============================================================================


class BlockchainNetwork(str, Enum):
    """Supported blockchain networks."""

    BITCOIN = "bitcoin"
    ETHEREUM = "ethereum"
    LITECOIN = "litecoin"
    BITCOIN_CASH = "bitcoin_cash"
    RIPPLE = "ripple"
    TRON = "tron"
    BINANCE_SMART_CHAIN = "bsc"
    POLYGON = "polygon"
    SOLANA = "solana"


BLOCKCHAIN_NETWORK_CHOICES: List[Tuple[str, str]] = [
    (BlockchainNetwork.BITCOIN.value, "Bitcoin"),
    (BlockchainNetwork.ETHEREUM.value, "Ethereum"),
    (BlockchainNetwork.LITECOIN.value, "Litecoin"),
    (BlockchainNetwork.BITCOIN_CASH.value, "Bitcoin Cash"),
    (BlockchainNetwork.RIPPLE.value, "Ripple/XRP"),
    (BlockchainNetwork.TRON.value, "Tron"),
    (BlockchainNetwork.BINANCE_SMART_CHAIN.value, "Binance Smart Chain"),
    (BlockchainNetwork.POLYGON.value, "Polygon"),
    (BlockchainNetwork.SOLANA.value, "Solana"),
]

# =============================================================================
# EXECUTION STATUS CHOICES
# =============================================================================


class ExecutionStatus(str, Enum):
    """Status of workflow execution."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


EXECUTION_STATUS_CHOICES: List[Tuple[str, str]] = [
    (ExecutionStatus.PENDING.value, "Pending"),
    (ExecutionStatus.RUNNING.value, "Running"),
    (ExecutionStatus.COMPLETED.value, "Completed"),
    (ExecutionStatus.FAILED.value, "Failed"),
    (ExecutionStatus.CANCELLED.value, "Cancelled"),
    (ExecutionStatus.PAUSED.value, "Paused"),
]

# =============================================================================
# NODE EXECUTION STATUS CHOICES
# =============================================================================


class NodeExecutionStatus(str, Enum):
    """Status of individual node execution."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


NODE_EXECUTION_STATUS_CHOICES: List[Tuple[str, str]] = [
    (NodeExecutionStatus.PENDING.value, "Pending"),
    (NodeExecutionStatus.RUNNING.value, "Running"),
    (NodeExecutionStatus.COMPLETED.value, "Completed"),
    (NodeExecutionStatus.FAILED.value, "Failed"),
    (NodeExecutionStatus.SKIPPED.value, "Skipped"),
]

# =============================================================================
# LOG LEVEL CHOICES
# =============================================================================


class LogLevel(str, Enum):
    """Log severity levels."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


LOG_LEVEL_CHOICES: List[Tuple[str, str]] = [
    (LogLevel.DEBUG.value, "Debug"),
    (LogLevel.INFO.value, "Info"),
    (LogLevel.WARNING.value, "Warning"),
    (LogLevel.ERROR.value, "Error"),
    (LogLevel.CRITICAL.value, "Critical"),
]

# =============================================================================
# PIN TYPE CHOICES
# =============================================================================


class PinType(str, Enum):
    """Types of pins (connection points) on nodes."""

    INPUT = "input"
    OUTPUT = "output"


PIN_TYPE_CHOICES: List[Tuple[str, str]] = [
    (PinType.INPUT.value, "Input"),
    (PinType.OUTPUT.value, "Output"),
]

# =============================================================================
# DATA TYPE CHOICES (for pin connections)
# =============================================================================


class DataType(str, Enum):
    """Data types that can flow through node connections."""

    ADDRESS = "address"
    ADDRESS_LIST = "address_list"
    TRANSACTION = "transaction"
    TRANSACTION_LIST = "transaction_list"
    CREDENTIALS = "credentials"
    JSON_DATA = "json_data"
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    ANY = "any"


DATA_TYPE_CHOICES: List[Tuple[str, str]] = [
    (DataType.ADDRESS.value, "Address"),
    (DataType.ADDRESS_LIST.value, "Address List"),
    (DataType.TRANSACTION.value, "Transaction"),
    (DataType.TRANSACTION_LIST.value, "Transaction List"),
    (DataType.CREDENTIALS.value, "API Credentials"),
    (DataType.JSON_DATA.value, "JSON Data"),
    (DataType.STRING.value, "String"),
    (DataType.NUMBER.value, "Number"),
    (DataType.BOOLEAN.value, "Boolean"),
    (DataType.ANY.value, "Any"),
]

# =============================================================================
# EXPORT FORMAT CHOICES
# =============================================================================


class ExportFormat(str, Enum):
    """Supported export file formats."""

    TXT = "txt"
    EXCEL = "xlsx"
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"


EXPORT_FORMAT_CHOICES: List[Tuple[str, str]] = [
    (ExportFormat.TXT.value, "Text File (.txt)"),
    (ExportFormat.EXCEL.value, "Excel File (.xlsx)"),
    (ExportFormat.JSON.value, "JSON File (.json)"),
    (ExportFormat.CSV.value, "CSV File (.csv)"),
    (ExportFormat.PDF.value, "PDF Report (.pdf)"),
]

# =============================================================================
# IMPORT FORMAT CHOICES (for batch input)
# =============================================================================


class ImportFormat(str, Enum):
    """Supported import file formats for batch processing."""

    CSV = "csv"
    EXCEL = "xlsx"
    TXT = "txt"
    JSON = "json"
    PDF = "pdf"
    WORD = "docx"


IMPORT_FORMAT_CHOICES: List[Tuple[str, str]] = [
    (ImportFormat.CSV.value, "CSV File (.csv)"),
    (ImportFormat.EXCEL.value, "Excel File (.xlsx)"),
    (ImportFormat.TXT.value, "Text File (.txt)"),
    (ImportFormat.JSON.value, "JSON File (.json)"),
    (ImportFormat.PDF.value, "PDF File (.pdf)"),
    (ImportFormat.WORD.value, "Word File (.docx)"),
]



# =============================================================================
# FILE: backend/fields/choices.py
# =============================================================================
"""
Choice field enumerations and constants.
"""

# =============================================================================
# API PROVIDER CHOICES
# =============================================================================

class APIProvider:
    """API provider identifiers."""
    CHAINALYSIS = 'chainalysis'
    TRM_LABS = 'trm_labs'


API_PROVIDER_CHOICES = [
    (APIProvider.CHAINALYSIS, 'Chainalysis'),
    (APIProvider.TRM_LABS, 'TRM Labs'),
]

# =============================================================================
# EXECUTION STATUS CHOICES
# =============================================================================

class ExecutionStatus:
    """Execution status identifiers."""
    PENDING = 'PENDING'
    RUNNING = 'RUNNING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'


EXECUTION_STATUS_CHOICES = [
    (ExecutionStatus.PENDING, 'Pending'),
    (ExecutionStatus.RUNNING, 'Running'),
    (ExecutionStatus.COMPLETED, 'Completed'),
    (ExecutionStatus.FAILED, 'Failed'),
]