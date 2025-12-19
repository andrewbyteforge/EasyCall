# =============================================================================
# FILE: easycall/backend/apps/providers/models.py
# =============================================================================
# Database models for dynamic provider management system.
#
# This module implements the "revolving door" provider architecture that
# allows adding/removing blockchain intelligence API providers without
# code changes.
#
# Models:
#   - Provider: Main provider metadata and configuration
#   - APIEndpoint: Individual API endpoints from OpenAPI specs
#   - GeneratedNode: Auto-generated node configurations
# =============================================================================
"""
Provider management models for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Dict, List, Optional, Any

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.core.models import BaseModel
from fields.constants import (
    MAX_LENGTH_NAME,
    MAX_LENGTH_DESCRIPTION,
    MAX_LENGTH_API_URL,
)
from fields.choices import (
    ProviderStatus,
    PROVIDER_STATUS_CHOICES,
    AuthType,
    AUTH_TYPE_CHOICES,
    HTTPMethod,
    HTTP_METHOD_CHOICES,
    SpecFormat,
    SPEC_FORMAT_CHOICES,
    NodeCategory,
    NODE_CATEGORY_CHOICES,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# CONSTANTS
# =============================================================================

# Rate limiting defaults
DEFAULT_RATE_LIMIT = 60  # requests per minute
MIN_RATE_LIMIT = 1
MAX_RATE_LIMIT = 10000

# Timeout defaults
DEFAULT_TIMEOUT = 30  # seconds
MIN_TIMEOUT = 5
MAX_TIMEOUT = 300

# Visual defaults for nodes
DEFAULT_NODE_COLOR = "#00897b"  # Teal (query nodes)
DEFAULT_NODE_ICON = "🔌"

# =============================================================================
# PROVIDER MODEL
# =============================================================================


class Provider(BaseModel):
    """
    Main provider model for blockchain intelligence API providers.
    
    Stores provider metadata, authentication configuration, and versioning.
    Providers can be dynamically added via OpenAPI spec upload.
    
    Lifecycle States:
        - Active: Visible in node palette, can be used in new workflows
        - Deprecated: Hidden from palette but existing workflows continue working
        - Inactive: Completely disabled, cannot be used anywhere
    
    Attributes:
        name: Provider name (e.g., "Chainalysis Reactor")
        slug: URL-friendly identifier (e.g., "chainalysis")
        description: Provider description
        status: Current status (active, deprecated, inactive)
        base_url: API base URL
        auth_type: Authentication method
        icon_path: Path to provider icon (optional)
        spec_file_path: Path to uploaded OpenAPI specification
        spec_format: OpenAPI spec format version
        spec_parsed_at: When the spec was last parsed
        version: Semantic version (e.g., "1.0.0")
        documentation_url: Link to provider API documentation
        rate_limit_per_minute: Default rate limit
        timeout_seconds: Default request timeout
        supports_batch: Whether provider supports batch requests
        metadata: Additional provider-specific configuration
    """

    # -------------------------------------------------------------------------
    # Basic Information
    # -------------------------------------------------------------------------

    name = models.CharField(
        verbose_name="Provider Name",
        max_length=MAX_LENGTH_NAME,
        unique=True,
        help_text="Human-readable provider name (e.g., 'Chainalysis Reactor').",
    )

    slug = models.SlugField(
        verbose_name="Slug",
        max_length=100,
        unique=True,
        db_index=True,
        help_text="URL-friendly identifier (e.g., 'chainalysis').",
    )

    description = models.TextField(
        verbose_name="Description",
        max_length=MAX_LENGTH_DESCRIPTION,
        blank=True,
        default="",
        help_text="Provider description and capabilities.",
    )

    # -------------------------------------------------------------------------
    # Status & Lifecycle
    # -------------------------------------------------------------------------

    status = models.CharField(
        verbose_name="Status",
        max_length=20,
        choices=PROVIDER_STATUS_CHOICES,
        default=ProviderStatus.ACTIVE.value,
        db_index=True,
        help_text="Provider status (active, deprecated, inactive).",
    )

    # -------------------------------------------------------------------------
    # API Configuration
    # -------------------------------------------------------------------------

    base_url = models.URLField(
        verbose_name="Base URL",
        max_length=MAX_LENGTH_API_URL,
        help_text="API base URL (e.g., 'https://api.chainalysis.com').",
    )

    auth_type = models.CharField(
        verbose_name="Authentication Type",
        max_length=20,
        choices=AUTH_TYPE_CHOICES,
        default=AuthType.API_KEY.value,
        help_text="Authentication method required by this provider.",
    )

    # -------------------------------------------------------------------------
    # Visual & Documentation
    # -------------------------------------------------------------------------

    icon_path = models.CharField(
        verbose_name="Icon Path",
        max_length=255,
        blank=True,
        default="",
        help_text="Path to provider icon (optional).",
    )

    documentation_url = models.URLField(
        verbose_name="Documentation URL",
        max_length=MAX_LENGTH_API_URL,
        blank=True,
        default="",
        help_text="Link to provider API documentation.",
    )

    # -------------------------------------------------------------------------
    # OpenAPI Specification
    # -------------------------------------------------------------------------

    spec_file_path = models.CharField(
        verbose_name="OpenAPI Spec File Path",
        max_length=500,
        blank=True,
        default="",
        help_text="Path to uploaded OpenAPI specification file.",
    )

    spec_format = models.CharField(
        verbose_name="Spec Format",
        max_length=20,
        choices=SPEC_FORMAT_CHOICES,
        blank=True,
        default="",
        help_text="OpenAPI specification format version.",
    )

    spec_parsed_at = models.DateTimeField(
        verbose_name="Spec Parsed At",
        null=True,
        blank=True,
        help_text="When the OpenAPI spec was last parsed.",
    )

    # -------------------------------------------------------------------------
    # Versioning
    # -------------------------------------------------------------------------

    version = models.CharField(
        verbose_name="Version",
        max_length=20,
        default="1.0.0",
        help_text="Semantic version (e.g., '1.0.0').",
    )

    # -------------------------------------------------------------------------
    # Rate Limiting & Timeouts
    # -------------------------------------------------------------------------

    rate_limit_per_minute = models.PositiveIntegerField(
        verbose_name="Rate Limit (per minute)",
        default=DEFAULT_RATE_LIMIT,
        validators=[MinValueValidator(MIN_RATE_LIMIT), MaxValueValidator(MAX_RATE_LIMIT)],
        help_text="Default rate limit for this provider (requests per minute).",
    )

    timeout_seconds = models.PositiveIntegerField(
        verbose_name="Timeout (seconds)",
        default=DEFAULT_TIMEOUT,
        validators=[MinValueValidator(MIN_TIMEOUT), MaxValueValidator(MAX_TIMEOUT)],
        help_text="Default request timeout in seconds.",
    )

    # -------------------------------------------------------------------------
    # Capabilities
    # -------------------------------------------------------------------------

    supports_batch = models.BooleanField(
        verbose_name="Supports Batch Requests",
        default=False,
        help_text="Whether this provider supports batch requests.",
    )

    # -------------------------------------------------------------------------
    # Metadata
    # -------------------------------------------------------------------------

    metadata = models.JSONField(
        verbose_name="Metadata",
        default=dict,
        blank=True,
        help_text="Additional provider-specific configuration (JSON).",
    )

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        db_table = "providers"
        verbose_name = "API Provider"
        verbose_name_plural = "API Providers"
        ordering = ["-status", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status", "name"]),
            models.Index(fields=["version"]),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.name} (v{self.version}) - {self.get_status_display()}"

    # -------------------------------------------------------------------------
    # Methods
    # -------------------------------------------------------------------------

    def mark_spec_parsed(self) -> None:
        """Mark the OpenAPI spec as parsed."""
        self.spec_parsed_at = timezone.now()
        self.save(update_fields=["spec_parsed_at", "updated_at"])
        logger.info(f"Provider {self.slug} spec marked as parsed")

    def deprecate(self) -> None:
        """Mark provider as deprecated."""
        self.status = ProviderStatus.DEPRECATED.value
        self.save(update_fields=["status", "updated_at"])
        logger.warning(f"Provider {self.slug} deprecated")

    def activate(self) -> None:
        """Activate provider."""
        self.status = ProviderStatus.ACTIVE.value
        self.save(update_fields=["status", "updated_at"])
        logger.info(f"Provider {self.slug} activated")

    def deactivate(self) -> None:
        """Deactivate provider."""
        self.status = ProviderStatus.INACTIVE.value
        self.save(update_fields=["status", "updated_at"])
        logger.warning(f"Provider {self.slug} deactivated")

    @property
    def is_active(self) -> bool:
        """Check if provider is active."""
        return self.status == ProviderStatus.ACTIVE.value

    @property
    def has_spec(self) -> bool:
        """Check if provider has an OpenAPI spec uploaded."""
        return bool(self.spec_file_path)

    @property
    def endpoint_count(self) -> int:
        """Get count of API endpoints for this provider."""
        return self.endpoints.count()

    @property
    def node_count(self) -> int:
        """Get count of generated nodes for this provider."""
        return self.generated_nodes.count()


# =============================================================================
# API ENDPOINT MODEL
# =============================================================================


class APIEndpoint(BaseModel):
    """
    Individual API endpoint extracted from OpenAPI specification.
    
    Each endpoint represents one API call that can be made to the provider.
    Endpoints are automatically parsed from the OpenAPI spec.
    
    Attributes:
        provider: Foreign key to Provider
        path: API endpoint path (e.g., "/clusters/{address}")
        method: HTTP method (GET, POST, etc.)
        operation_id: OpenAPI operation ID
        summary: Brief endpoint description
        description: Detailed endpoint description
        parameters: JSON schema of parameters
        request_body: JSON schema of request body
        response_schema: JSON schema of response
        tags: Endpoint tags from OpenAPI spec
        requires_auth: Whether endpoint requires authentication
        rate_limit_override: Override provider default rate limit
    """

    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------

    provider = models.ForeignKey(
        Provider,
        on_delete=models.CASCADE,
        related_name="endpoints",
        help_text="Provider this endpoint belongs to.",
    )

    # -------------------------------------------------------------------------
    # Endpoint Information
    # -------------------------------------------------------------------------

    path = models.CharField(
        verbose_name="Endpoint Path",
        max_length=500,
        help_text="API endpoint path (e.g., '/clusters/{address}').",
    )

    method = models.CharField(
        verbose_name="HTTP Method",
        max_length=10,
        choices=HTTP_METHOD_CHOICES,
        help_text="HTTP method (GET, POST, etc.).",
    )

    operation_id = models.CharField(
        verbose_name="Operation ID",
        max_length=200,
        blank=True,
        default="",
        help_text="OpenAPI operation ID.",
    )

    summary = models.CharField(
        verbose_name="Summary",
        max_length=MAX_LENGTH_DESCRIPTION,
        blank=True,
        default="",
        help_text="Brief endpoint description.",
    )

    description = models.TextField(
        verbose_name="Description",
        blank=True,
        default="",
        help_text="Detailed endpoint description.",
    )

    # -------------------------------------------------------------------------
    # Schemas (JSON)
    # -------------------------------------------------------------------------

    parameters = models.JSONField(
        verbose_name="Parameters",
        default=dict,
        help_text="JSON schema of endpoint parameters (path, query, header).",
    )

    request_body = models.JSONField(
        verbose_name="Request Body",
        default=dict,
        blank=True,
        help_text="JSON schema of request body (for POST/PUT).",
    )

    response_schema = models.JSONField(
        verbose_name="Response Schema",
        default=dict,
        help_text="JSON schema of successful response (200).",
    )

    # -------------------------------------------------------------------------
    # Metadata
    # -------------------------------------------------------------------------

    tags = models.JSONField(
        verbose_name="Tags",
        default=list,
        blank=True,
        help_text="Endpoint tags from OpenAPI spec.",
    )

    requires_auth = models.BooleanField(
        verbose_name="Requires Authentication",
        default=True,
        help_text="Whether this endpoint requires authentication.",
    )

    rate_limit_override = models.PositiveIntegerField(
        verbose_name="Rate Limit Override",
        null=True,
        blank=True,
        help_text="Override provider default rate limit (optional).",
    )

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        db_table = "api_endpoints"
        verbose_name = "API Endpoint"
        verbose_name_plural = "API Endpoints"
        ordering = ["provider", "path", "method"]
        indexes = [
            models.Index(fields=["provider", "path"]),
            models.Index(fields=["method"]),
            models.Index(fields=["operation_id"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "path", "method"],
                name="unique_endpoint_per_provider",
            ),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.method} {self.path} ({self.provider.slug})"

    # -------------------------------------------------------------------------
    # Methods
    # -------------------------------------------------------------------------

    @property
    def full_url(self) -> str:
        """Get full endpoint URL."""
        return f"{self.provider.base_url}{self.path}"

    @property
    def has_parameters(self) -> bool:
        """Check if endpoint has parameters."""
        return bool(self.parameters)

    @property
    def has_request_body(self) -> bool:
        """Check if endpoint has request body."""
        return bool(self.request_body)


# =============================================================================
# GENERATED NODE MODEL
# =============================================================================


class GeneratedNode(BaseModel):
    """
    Auto-generated node configuration from API endpoint.
    
    Each GeneratedNode represents a node type that can be added to workflows.
    Nodes are automatically created from provider endpoints.
    
    Attributes:
        provider: Foreign key to Provider
        endpoint: Foreign key to APIEndpoint (optional)
        node_type: Unique node type identifier
        category: Node category (configuration, input, query, output)
        display_name: Human-readable node name
        description: Node description
        input_pins: JSON array of input pin definitions
        output_pins: JSON array of output pin definitions
        configuration_fields: JSON array of configuration fields
        validation_rules: JSON object of validation rules
        metadata: Additional node metadata
    """

    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------

    provider = models.ForeignKey(
        Provider,
        on_delete=models.CASCADE,
        related_name="generated_nodes",
        help_text="Provider this node belongs to.",
    )

    endpoint = models.ForeignKey(
        APIEndpoint,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="nodes",
        help_text="API endpoint this node calls (null for credential nodes).",
    )

    # -------------------------------------------------------------------------
    # Node Type Information
    # -------------------------------------------------------------------------

    node_type = models.CharField(
        verbose_name="Node Type",
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique node type identifier (e.g., 'chainalysis_cluster_info').",
    )

    category = models.CharField(
        verbose_name="Category",
        max_length=20,
        choices=NODE_CATEGORY_CHOICES,
        help_text="Node category (configuration, input, query, output).",
    )

    display_name = models.CharField(
        verbose_name="Display Name",
        max_length=MAX_LENGTH_NAME,
        help_text="Human-readable node name shown in UI.",
    )

    description = models.TextField(
        verbose_name="Description",
        blank=True,
        default="",
        help_text="Node description for users.",
    )

    # -------------------------------------------------------------------------
    # Node Configuration (JSON)
    # -------------------------------------------------------------------------

    input_pins = models.JSONField(
        verbose_name="Input Pins",
        default=list,
        help_text="Array of input pin definitions (JSON).",
    )

    output_pins = models.JSONField(
        verbose_name="Output Pins",
        default=list,
        help_text="Array of output pin definitions (JSON).",
    )

    configuration_fields = models.JSONField(
        verbose_name="Configuration Fields",
        default=list,
        help_text="Array of configuration field definitions (JSON).",
    )

    validation_rules = models.JSONField(
        verbose_name="Validation Rules",
        default=dict,
        help_text="Validation rules for inputs and configuration (JSON).",
    )

    # -------------------------------------------------------------------------
    # Visual Configuration
    # -------------------------------------------------------------------------

    icon = models.CharField(
        verbose_name="Icon",
        max_length=50,
        default=DEFAULT_NODE_ICON,
        help_text="Emoji or icon identifier for node.",
    )

    color = models.CharField(
        verbose_name="Color",
        max_length=20,
        default=DEFAULT_NODE_COLOR,
        help_text="Hex color code for node background.",
    )

    # -------------------------------------------------------------------------
    # Metadata
    # -------------------------------------------------------------------------

    metadata = models.JSONField(
        verbose_name="Metadata",
        default=dict,
        blank=True,
        help_text="Additional node-specific metadata (JSON).",
    )

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        db_table = "generated_nodes"
        verbose_name = "Generated Node"
        verbose_name_plural = "Generated Nodes"
        ordering = ["provider", "category", "display_name"]
        indexes = [
            models.Index(fields=["node_type"]),
            models.Index(fields=["provider", "category"]),
            models.Index(fields=["category"]),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.display_name} ({self.node_type})"

    # -------------------------------------------------------------------------
    # Methods
    # -------------------------------------------------------------------------

    @property
    def is_credential_node(self) -> bool:
        """Check if this is a credential/configuration node."""
        return self.category == NodeCategory.CONFIGURATION.value

    @property
    def is_query_node(self) -> bool:
        """Check if this is a query node."""
        return self.category == NodeCategory.QUERY.value

    @property
    def input_pin_count(self) -> int:
        """Get count of input pins."""
        return len(self.input_pins)

    @property
    def output_pin_count(self) -> int:
        """Get count of output pins."""
        return len(self.output_pins)