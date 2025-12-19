# =============================================================================
# FILE: backend/apps/providers/models.py
# =============================================================================
# Database models for dynamic provider management system.
#
# This module defines models for:
# - Provider: API provider configuration and metadata
# - APIEndpoint: Individual API endpoints from OpenAPI specs
# - GeneratedNode: Workflow nodes generated from endpoints
# - ProviderVersion: Version history tracking for providers
#
# The provider management system enables dynamic addition of blockchain
# intelligence API providers through OpenAPI specification files, eliminating
# the need for code changes when integrating new providers.
# =============================================================================
"""
Provider management models for EasyCall.

This module provides the database models for the dynamic provider management
system, which allows administrators to add new blockchain intelligence API
providers by uploading OpenAPI specifications without modifying code.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.core.models import BaseModel

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# CONSTANTS
# =============================================================================

# -----------------------------------------------------------------------------
# Provider Status Choices
# -----------------------------------------------------------------------------

PROVIDER_STATUS_ACTIVE = 'active'
PROVIDER_STATUS_DEPRECATED = 'deprecated'
PROVIDER_STATUS_INACTIVE = 'inactive'

PROVIDER_STATUS_CHOICES = [
    (PROVIDER_STATUS_ACTIVE, 'Active'),
    (PROVIDER_STATUS_DEPRECATED, 'Deprecated'),
    (PROVIDER_STATUS_INACTIVE, 'Inactive'),
]

# -----------------------------------------------------------------------------
# Authentication Type Choices
# -----------------------------------------------------------------------------

AUTH_TYPE_NONE = 'none'
AUTH_TYPE_API_KEY = 'api_key'
AUTH_TYPE_BEARER = 'bearer'
AUTH_TYPE_OAUTH2 = 'oauth2'
AUTH_TYPE_BASIC = 'basic'

AUTH_TYPE_CHOICES = [
    (AUTH_TYPE_NONE, 'No Authentication'),
    (AUTH_TYPE_API_KEY, 'API Key'),
    (AUTH_TYPE_BEARER, 'Bearer Token'),
    (AUTH_TYPE_OAUTH2, 'OAuth 2.0'),
    (AUTH_TYPE_BASIC, 'Basic Authentication'),
]

# -----------------------------------------------------------------------------
# HTTP Method Choices
# -----------------------------------------------------------------------------

HTTP_METHOD_GET = 'GET'
HTTP_METHOD_POST = 'POST'
HTTP_METHOD_PUT = 'PUT'
HTTP_METHOD_PATCH = 'PATCH'
HTTP_METHOD_DELETE = 'DELETE'

HTTP_METHOD_CHOICES = [
    (HTTP_METHOD_GET, 'GET'),
    (HTTP_METHOD_POST, 'POST'),
    (HTTP_METHOD_PUT, 'PUT'),
    (HTTP_METHOD_PATCH, 'PATCH'),
    (HTTP_METHOD_DELETE, 'DELETE'),
]

# -----------------------------------------------------------------------------
# Node Category Choices
# -----------------------------------------------------------------------------

NODE_CATEGORY_CONFIG = 'configuration'
NODE_CATEGORY_INPUT = 'input'
NODE_CATEGORY_QUERY = 'query'
NODE_CATEGORY_OUTPUT = 'output'

NODE_CATEGORY_CHOICES = [
    (NODE_CATEGORY_CONFIG, 'Configuration'),
    (NODE_CATEGORY_INPUT, 'Input'),
    (NODE_CATEGORY_QUERY, 'Query'),
    (NODE_CATEGORY_OUTPUT, 'Output'),
]

# -----------------------------------------------------------------------------
# Field Length Constants
# -----------------------------------------------------------------------------

MAX_LENGTH_PROVIDER_NAME = 100
MAX_LENGTH_SLUG = 100
MAX_LENGTH_VERSION = 20
MAX_LENGTH_URL = 500
MAX_LENGTH_PATH = 1000
MAX_LENGTH_METHOD = 10
MAX_LENGTH_OPERATION_ID = 200
MAX_LENGTH_SUMMARY = 200
MAX_LENGTH_NODE_TYPE = 100
MAX_LENGTH_DISPLAY_NAME = 200
MAX_LENGTH_CATEGORY = 50
MAX_LENGTH_COLOR = 20
MAX_LENGTH_ICON = 100

# -----------------------------------------------------------------------------
# Default Values
# -----------------------------------------------------------------------------

DEFAULT_RATE_LIMIT = 60  # requests per minute
DEFAULT_TIMEOUT = 30  # seconds
DEFAULT_NODE_COLOR = '#4CAF50'  # Material green
DEFAULT_NODE_ICON = 'api'

# -----------------------------------------------------------------------------
# Validation Limits
# -----------------------------------------------------------------------------

MIN_RATE_LIMIT = 1
MAX_RATE_LIMIT = 10000
MIN_TIMEOUT = 5
MAX_TIMEOUT = 300


# =============================================================================
# PROVIDER MODEL
# =============================================================================


class Provider(BaseModel):
    """
    Represents an API provider integrated via OpenAPI specification.
    
    A provider is a blockchain intelligence API service (like Chainalysis
    or TRM Labs) that has been integrated into EasyCall by uploading its
    OpenAPI specification file. The provider model stores configuration,
    authentication details, and lifecycle status.
    
    Lifecycle States:
        - Active: Visible in node palette, can be used in new workflows
        - Deprecated: Hidden from palette but existing workflows continue working
        - Inactive: Completely disabled, cannot be used anywhere
    
    Attributes:
        name (str): Human-readable name of the provider.
        slug (str): URL-safe identifier for the provider.
        description (str): Optional description of the provider's capabilities.
        base_url (str): Base URL for API requests.
        auth_type (str): Type of authentication required.
        icon_path (str): Optional path to provider's icon file.
        status (str): Current lifecycle status (active/deprecated/inactive).
        version (str): Current version of the provider's API.
        spec_file_path (str): Path to the OpenAPI specification file.
        rate_limit (int): Maximum requests per minute allowed.
        timeout (int): Request timeout in seconds.
        requires_paid_key (bool): Whether the API requires a paid subscription.
        metadata (dict): Additional provider-specific configuration (JSON).
    
    Relationships:
        endpoints: Related APIEndpoint objects (CASCADE delete).
        generated_nodes: Related GeneratedNode objects (CASCADE delete).
        versions: Related ProviderVersion objects (CASCADE delete).
    
    Indexes:
        - (slug, version) - For unique provider identification
        - status - For filtering by lifecycle state
        - created_at - For chronological ordering
    
    Constraints:
        - Unique (slug, version) - Each version of a provider must be unique
    
    Example:
        >>> provider = Provider.objects.create(
        ...     name='Chainalysis Reactor',
        ...     slug='chainalysis-reactor',
        ...     base_url='https://api.chainalysis.com',
        ...     auth_type='api_key',
        ...     version='2.1.0',
        ...     spec_file_path='/path/to/openapi.yaml'
        ... )
        >>> provider.deprecate()
        >>> print(provider.status)
        'deprecated'
    """
    
    # -------------------------------------------------------------------------
    # Basic Information
    # -------------------------------------------------------------------------
    
    name = models.CharField(
        verbose_name='Provider Name',
        max_length=MAX_LENGTH_PROVIDER_NAME,
        help_text='Human-readable name (e.g., "Chainalysis Reactor")',
    )
    
    slug = models.SlugField(
        verbose_name='Slug',
        max_length=MAX_LENGTH_SLUG,
        help_text='URL-safe identifier (e.g., "chainalysis-reactor")',
    )
    
    description = models.TextField(
        verbose_name='Description',
        blank=True,
        default='',
        help_text='Description of the provider and its capabilities',
    )
    
    # -------------------------------------------------------------------------
    # API Configuration
    # -------------------------------------------------------------------------
    
    base_url = models.URLField(
        verbose_name='Base URL',
        max_length=MAX_LENGTH_URL,
        help_text='Base URL for API requests (e.g., "https://api.chainalysis.com")',
    )
    
    auth_type = models.CharField(
        verbose_name='Authentication Type',
        max_length=20,
        choices=AUTH_TYPE_CHOICES,
        default=AUTH_TYPE_API_KEY,
        help_text='Type of authentication required by this provider',
    )
    
    icon_path = models.CharField(
        verbose_name='Icon Path',
        max_length=MAX_LENGTH_PATH,
        blank=True,
        null=True,
        help_text='Path to icon file (relative to media root)',
    )
    
    # -------------------------------------------------------------------------
    # Status & Versioning
    # -------------------------------------------------------------------------
    
    status = models.CharField(
        verbose_name='Status',
        max_length=20,
        choices=PROVIDER_STATUS_CHOICES,
        default=PROVIDER_STATUS_ACTIVE,
        db_index=True,
        help_text='Current lifecycle status of this provider',
    )
    
    version = models.CharField(
        verbose_name='Version',
        max_length=MAX_LENGTH_VERSION,
        default='1.0.0',
        help_text='Current API version (e.g., "2.1.0")',
    )
    
    spec_file_path = models.CharField(
        verbose_name='OpenAPI Spec File Path',
        max_length=MAX_LENGTH_PATH,
        help_text='Path to the OpenAPI specification file',
    )
    
    # -------------------------------------------------------------------------
    # Rate Limiting & Performance
    # -------------------------------------------------------------------------
    
    rate_limit = models.PositiveIntegerField(
        verbose_name='Rate Limit',
        default=DEFAULT_RATE_LIMIT,
        validators=[
            MinValueValidator(MIN_RATE_LIMIT),
            MaxValueValidator(MAX_RATE_LIMIT)
        ],
        help_text='Maximum requests per minute (1-10000)',
    )
    
    timeout = models.PositiveIntegerField(
        verbose_name='Timeout',
        default=DEFAULT_TIMEOUT,
        validators=[
            MinValueValidator(MIN_TIMEOUT),
            MaxValueValidator(MAX_TIMEOUT)
        ],
        help_text='Request timeout in seconds (5-300)',
    )
    
    # -------------------------------------------------------------------------
    # Business Logic
    # -------------------------------------------------------------------------
    
    requires_paid_key = models.BooleanField(
        verbose_name='Requires Paid Key',
        default=True,
        help_text='Whether this provider requires a paid API key',
    )
    
    metadata = models.JSONField(
        verbose_name='Metadata',
        default=dict,
        blank=True,
        help_text='Additional provider-specific configuration',
    )
    
    # -------------------------------------------------------------------------
    # Meta & Indexes
    # -------------------------------------------------------------------------
    
    class Meta:
        db_table = 'providers'
        verbose_name = 'Provider'
        verbose_name_plural = 'Providers'
        ordering = ['name', '-version']
        indexes = [
            models.Index(
                fields=['slug', 'version'],
                name='provider_slug_version_idx'
            ),
            models.Index(
                fields=['status'],
                name='provider_status_idx'
            ),
            models.Index(
                fields=['-created_at'],
                name='provider_created_idx'
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['slug', 'version'],
                name='unique_provider_slug_version',
            ),
        ]
    
    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------
    
    def __str__(self) -> str:
        """
        String representation of the provider.
        
        Returns:
            String in format "Provider Name vX.Y.Z"
        """
        return f"{self.name} v{self.version}"
    
    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------
    
    @property
    def is_active(self) -> bool:
        """
        Check if provider is currently active.
        
        Returns:
            True if status is 'active', False otherwise.
        """
        return self.status == PROVIDER_STATUS_ACTIVE
    
    @property
    def is_deprecated(self) -> bool:
        """
        Check if provider is deprecated.
        
        Returns:
            True if status is 'deprecated', False otherwise.
        """
        return self.status == PROVIDER_STATUS_DEPRECATED
    
    @property
    def is_inactive(self) -> bool:
        """
        Check if provider is completely inactive.
        
        Returns:
            True if status is 'inactive', False otherwise.
        """
        return self.status == PROVIDER_STATUS_INACTIVE
    
    @property
    def display_status(self) -> str:
        """
        Get human-readable status with badge color.
        
        Returns:
            Dict with status text and color code for UI display.
        """
        status_display = {
            PROVIDER_STATUS_ACTIVE: {'text': 'Active', 'color': 'success'},
            PROVIDER_STATUS_DEPRECATED: {'text': 'Deprecated', 'color': 'warning'},
            PROVIDER_STATUS_INACTIVE: {'text': 'Inactive', 'color': 'error'},
        }
        return status_display.get(
            self.status,
            {'text': 'Unknown', 'color': 'default'}
        )
    
    # -------------------------------------------------------------------------
    # Lifecycle Methods
    # -------------------------------------------------------------------------
    
    def deprecate(self, save: bool = True) -> None:
        """
        Mark this provider as deprecated.
        
        Deprecated providers remain visible in existing workflows but are
        hidden from the node palette for new workflows. This allows existing
        workflows to continue functioning while preventing new dependencies.
        
        Args:
            save: Whether to save the model after deprecation (default: True).
        
        Example:
            >>> provider = Provider.objects.get(slug='old-provider')
            >>> provider.deprecate()
            >>> print(provider.status)
            'deprecated'
        """
        logger.info(
            f"Deprecating provider: {self.name} v{self.version} "
            f"(UUID: {self.uuid})"
        )
        self.status = PROVIDER_STATUS_DEPRECATED
        
        if save:
            self.save(update_fields=['status', 'updated_at'])
    
    def reactivate(self, save: bool = True) -> None:
        """
        Reactivate a deprecated provider.
        
        This makes the provider visible in the node palette again and allows
        it to be used in new workflows.
        
        Args:
            save: Whether to save the model after reactivation (default: True).
        
        Example:
            >>> provider.reactivate()
            >>> print(provider.status)
            'active'
        """
        logger.info(
            f"Reactivating provider: {self.name} v{self.version} "
            f"(UUID: {self.uuid})"
        )
        self.status = PROVIDER_STATUS_ACTIVE
        
        if save:
            self.save(update_fields=['status', 'updated_at'])
    
    def deactivate(self, save: bool = True) -> None:
        """
        Completely deactivate this provider.
        
        Inactive providers are hidden everywhere and cannot be used in any
        workflows, including existing ones. Use this only when a provider
        must be completely removed from the system (e.g., API shutdown).
        
        Args:
            save: Whether to save the model after deactivation (default: True).
        
        Warning:
            This may break existing workflows that depend on this provider.
            Consider using deprecate() instead for graceful degradation.
        
        Example:
            >>> provider.deactivate()
            >>> print(provider.status)
            'inactive'
        """
        logger.warning(
            f"Deactivating provider: {self.name} v{self.version} "
            f"(UUID: {self.uuid}) - This may break existing workflows!"
        )
        self.status = PROVIDER_STATUS_INACTIVE
        
        if save:
            self.save(update_fields=['status', 'updated_at'])
    
    # -------------------------------------------------------------------------
    # Related Object Counts
    # -------------------------------------------------------------------------
    
    def get_endpoint_count(self) -> int:
        """
        Get the number of API endpoints for this provider.
        
        Returns:
            Number of APIEndpoint records linked to this provider.
        
        Example:
            >>> provider = Provider.objects.get(slug='chainalysis')
            >>> print(provider.get_endpoint_count())
            42
        """
        return self.endpoints.count()
    
    def get_node_count(self) -> int:
        """
        Get the number of generated nodes for this provider.
        
        Returns:
            Number of GeneratedNode records linked to this provider.
        
        Example:
            >>> provider = Provider.objects.get(slug='chainalysis')
            >>> print(provider.get_node_count())
            42
        """
        return self.generated_nodes.count()
    
    def get_active_workflow_count(self) -> int:
        """
        Get the number of active workflows using this provider.
        
        This counts workflows where at least one node references this
        provider and the workflow is active (not soft-deleted).
        
        Returns:
            Number of active workflows depending on this provider.
        
        Note:
            This method may be expensive for providers with many workflows.
            Consider caching the result for frequently accessed providers.
        """
        from apps.workflows.models import Workflow
        
        # Get all active workflows
        workflows = Workflow.objects.filter(is_active=True)
        
        # Count workflows that reference this provider
        count = 0
        for workflow in workflows:
            provider_ids = workflow.get_provider_dependencies()
            if str(self.uuid) in provider_ids:
                count += 1
        
        return count
    
    # -------------------------------------------------------------------------
    # Validation
    # -------------------------------------------------------------------------
    
    def clean(self) -> None:
        """
        Validate model fields before saving.
        
        Performs validation checks including:
        - Spec file exists and is accessible
        - Spec file has valid extension (.yaml, .yml, .json)
        - Rate limit is within acceptable range
        - Timeout is within acceptable range
        
        Raises:
            ValidationError: If validation fails with details about the error.
        
        Example:
            >>> provider = Provider(name='Test', spec_file_path='/invalid/path.txt')
            >>> provider.clean()  # Raises ValidationError
        """
        super().clean()
        
        errors = {}
        
        # Validate spec file exists
        try:
            spec_path = Path(self.spec_file_path)
            if not spec_path.exists():
                errors['spec_file_path'] = (
                    f'Specification file not found: {self.spec_file_path}'
                )
        except (TypeError, ValueError) as e:
            errors['spec_file_path'] = f'Invalid file path: {e}'
        
        # Validate spec file extension
        if self.spec_file_path:
            spec_path = Path(self.spec_file_path)
            valid_extensions = ['.yaml', '.yml', '.json']
            if spec_path.suffix.lower() not in valid_extensions:
                errors['spec_file_path'] = (
                    f'Specification file must be one of: {", ".join(valid_extensions)}'
                )
        
        # Validate rate limit is within bounds
        if self.rate_limit < MIN_RATE_LIMIT or self.rate_limit > MAX_RATE_LIMIT:
            errors['rate_limit'] = (
                f'Rate limit must be between {MIN_RATE_LIMIT} '
                f'and {MAX_RATE_LIMIT}'
            )
        
        # Validate timeout is within bounds
        if self.timeout < MIN_TIMEOUT or self.timeout > MAX_TIMEOUT:
            errors['timeout'] = (
                f'Timeout must be between {MIN_TIMEOUT} and {MAX_TIMEOUT} seconds'
            )
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        """
        Save the provider instance.
        
        Calls full_clean() to validate before saving.
        """
        self.full_clean()
        super().save(*args, **kwargs)


# =============================================================================
# API ENDPOINT MODEL
# =============================================================================


class APIEndpoint(BaseModel):
    """
    Represents a single API endpoint from an OpenAPI specification.
    
    Each endpoint corresponds to one HTTP operation (method + path combination)
    in the provider's API. Endpoints are automatically created when a provider's
    OpenAPI spec is parsed by the system.
    
    Attributes:
        provider (FK): Foreign key to the parent provider.
        path (str): URL path for this endpoint.
        method (str): HTTP method (GET, POST, etc.).
        operation_id (str): Unique identifier from OpenAPI spec.
        summary (str): Short description of the endpoint.
        description (str): Detailed description of the endpoint.
        parameters (list): JSON array of parameter definitions.
        request_body (dict): JSON schema for request body (if applicable).
        responses (dict): JSON object mapping status codes to response schemas.
        deprecated (bool): Whether this endpoint is deprecated in the API.
        requires_auth (bool): Whether this endpoint requires authentication.
        rate_limit_override (int): Optional custom rate limit for this endpoint.
        tags (list): JSON array of tags for categorization.
    
    Relationships:
        provider: Parent Provider object (CASCADE delete).
        generated_nodes: Related GeneratedNode objects (CASCADE delete).
        
     
    
    Indexes:
            - (provider, path, method) - For unique endpoint identification
            - deprecated - For filtering deprecated endpoints
            - operation_id - For quick lookup by operation ID
    
    Constraints:
        - Unique (provider, path, method) - Each endpoint must be unique per provider
    
    Example:
        >>> endpoint = APIEndpoint.objects.create(
        ...     provider=provider,
        ...     path='/v2/entities/{address}',
        ...     method='GET',
        ...     operation_id='getEntity',
        ...     summary='Get entity information'
        ... )
        >>> print(endpoint.full_url)
        'https://api.chainalysis.com/v2/entities/{address}'
    """
    
    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------
    
    provider = models.ForeignKey(
        Provider,
        on_delete=models.CASCADE,
        related_name='endpoints',
        verbose_name='Provider',
        help_text='The provider this endpoint belongs to',
    )
    
    # -------------------------------------------------------------------------
    # Endpoint Identity
    # -------------------------------------------------------------------------
    
    path = models.CharField(
        verbose_name='Path',
        max_length=MAX_LENGTH_PATH,
        help_text='URL path (e.g., "/v2/entities/{address}")',
    )
    
    method = models.CharField(
        verbose_name='HTTP Method',
        max_length=MAX_LENGTH_METHOD,
        choices=HTTP_METHOD_CHOICES,
        default=HTTP_METHOD_GET,
        help_text='HTTP method for this endpoint',
    )
    
    operation_id = models.CharField(
        verbose_name='Operation ID',
        max_length=MAX_LENGTH_OPERATION_ID,
        help_text='Unique operation identifier from OpenAPI spec',
    )
    
    # -------------------------------------------------------------------------
    # Documentation
    # -------------------------------------------------------------------------
    
    summary = models.CharField(
        verbose_name='Summary',
        max_length=MAX_LENGTH_SUMMARY,
        blank=True,
        default='',
        help_text='Short description of what this endpoint does',
    )
    
    description = models.TextField(
        verbose_name='Description',
        blank=True,
        default='',
        help_text='Detailed description of the endpoint',
    )
    
    # -------------------------------------------------------------------------
    # API Specification
    # -------------------------------------------------------------------------
    
    parameters = models.JSONField(
        verbose_name='Parameters',
        default=list,
        blank=True,
        help_text='Array of parameter definitions from OpenAPI spec',
    )
    
    request_body = models.JSONField(
        verbose_name='Request Body',
        default=dict,
        blank=True,
        null=True,
        help_text='Request body schema (for POST/PUT/PATCH)',
    )
    
    responses = models.JSONField(
        verbose_name='Responses',
        default=dict,
        blank=True,
        help_text='Response schemas mapped by status code',
    )
    
    # -------------------------------------------------------------------------
    # Status & Configuration
    # -------------------------------------------------------------------------
    
    deprecated = models.BooleanField(
        verbose_name='Deprecated',
        default=False,
        db_index=True,
        help_text='Whether this endpoint is deprecated',
    )
    
    requires_auth = models.BooleanField(
        verbose_name='Requires Authentication',
        default=True,
        help_text='Whether this endpoint requires authentication',
    )
    
    rate_limit_override = models.PositiveIntegerField(
        verbose_name='Rate Limit Override',
        blank=True,
        null=True,
        validators=[
            MinValueValidator(MIN_RATE_LIMIT),
            MaxValueValidator(MAX_RATE_LIMIT)
        ],
        help_text='Optional custom rate limit for this specific endpoint',
    )
    
    tags = models.JSONField(
        verbose_name='Tags',
        default=list,
        blank=True,
        help_text='Array of tags for categorization',
    )
    
    # -------------------------------------------------------------------------
    # Meta & Indexes
    # -------------------------------------------------------------------------
    
    class Meta:
        db_table = 'api_endpoints'
        verbose_name = 'API Endpoint'
        verbose_name_plural = 'API Endpoints'
        ordering = ['provider', 'path', 'method']
        indexes = [
            models.Index(
                fields=['provider', 'path', 'method'],
                name='endpoint_provider_path_idx'
            ),
            models.Index(
                fields=['deprecated'],
                name='endpoint_deprecated_idx'
            ),
            models.Index(
                fields=['operation_id'],
                name='endpoint_operation_id_idx'
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'path', 'method'],
                name='unique_endpoint_per_provider',
            ),
        ]
    
    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------
    
    def __str__(self) -> str:
        """
        String representation of the endpoint.
        
        Returns:
            String in format "METHOD /path"
        """
        return f"{self.method} {self.path}"
    
    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------
    
    @property
    def full_url(self) -> str:
        """
        Get the full URL for this endpoint.
        
        Combines the provider's base URL with this endpoint's path to
        create the complete URL that would be used in actual API requests.
        
        Returns:
            Complete URL string.
        
        Example:
            >>> endpoint.provider.base_url = 'https://api.example.com'
            >>> endpoint.path = '/v2/entities'
            >>> print(endpoint.full_url)
            'https://api.example.com/v2/entities'
        """
        base = self.provider.base_url.rstrip('/')
        path = self.path.lstrip('/')
        return f"{base}/{path}"
    
    @property
    def effective_rate_limit(self) -> int:
        """
        Get the effective rate limit for this endpoint.
        
        Returns the endpoint-specific rate limit if set, otherwise falls
        back to the provider's default rate limit.
        
        Returns:
            Rate limit in requests per minute.
        
        Example:
            >>> endpoint.rate_limit_override = 30
            >>> print(endpoint.effective_rate_limit)
            30
            >>> endpoint.rate_limit_override = None
            >>> print(endpoint.effective_rate_limit)  # Falls back to provider
            60
        """
        return self.rate_limit_override or self.provider.rate_limit
    
    @property
    def has_path_parameters(self) -> bool:
        """
        Check if this endpoint has path parameters.
        
        Returns:
            True if the path contains parameter placeholders like {id}.
        """
        return '{' in self.path and '}' in self.path
    
    @property
    def has_query_parameters(self) -> bool:
        """
        Check if this endpoint has query parameters.
        
        Returns:
            True if parameters include any query parameters.
        """
        if not isinstance(self.parameters, list):
            return False
        
        for param in self.parameters:
            if param.get('in') == 'query':
                return True
        return False
    
    @property
    def has_request_body(self) -> bool:
        """
        Check if this endpoint accepts a request body.
        
        Returns:
            True if request_body is defined and not empty.
        """
        return bool(self.request_body)
    
    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------
    
    def get_parameter_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get a parameter definition by name.
        
        Args:
            name: The parameter name to search for.
        
        Returns:
            Parameter definition dict if found, None otherwise.
        
        Example:
            >>> param = endpoint.get_parameter_by_name('address')
            >>> print(param['type'])
            'string'
        """
        if not isinstance(self.parameters, list):
            return None
        
        for param in self.parameters:
            if param.get('name') == name:
                return param
        return None
    
    def get_required_parameters(self) -> List[Dict[str, Any]]:
        """
        Get all required parameters for this endpoint.
        
        Returns:
            List of parameter definitions marked as required.
        
        Example:
            >>> required = endpoint.get_required_parameters()
            >>> print([p['name'] for p in required])
            ['address', 'blockchain']
        """
        if not isinstance(self.parameters, list):
            return []
        
        return [p for p in self.parameters if p.get('required', False)]
    
    def get_optional_parameters(self) -> List[Dict[str, Any]]:
        """
        Get all optional parameters for this endpoint.
        
        Returns:
            List of parameter definitions marked as optional.
        """
        if not isinstance(self.parameters, list):
            return []
        
        return [p for p in self.parameters if not p.get('required', False)]
    
    def get_success_response_schema(self) -> Optional[Dict[str, Any]]:
        """
        Get the schema for successful responses (200 or 201).
        
        Returns:
            Response schema dict if found, None otherwise.
        
        Example:
            >>> schema = endpoint.get_success_response_schema()
            >>> print(schema['type'])
            'object'
        """
        if not isinstance(self.responses, dict):
            return None
        
        # Try 200 first, then 201
        for status_code in ['200', '201']:
            if status_code in self.responses:
                return self.responses[status_code]
        
        return None
    
    # -------------------------------------------------------------------------
    # Validation
    # -------------------------------------------------------------------------
    
    def clean(self) -> None:
        """
        Validate model fields before saving.
        
        Raises:
            ValidationError: If validation fails.
        """
        super().clean()
        
        errors = {}
        
        # Validate path starts with /
        if self.path and not self.path.startswith('/'):
            errors['path'] = 'Path must start with /'
        
        # Validate parameters is a list
        if self.parameters is not None and not isinstance(self.parameters, list):
            errors['parameters'] = 'Parameters must be a list'
        
        # Validate responses is a dict
        if self.responses is not None and not isinstance(self.responses, dict):
            errors['responses'] = 'Responses must be a dictionary'
        
        # Validate tags is a list
        if self.tags is not None and not isinstance(self.tags, list):
            errors['tags'] = 'Tags must be a list'
        
        if errors:
            raise ValidationError(errors)


# =============================================================================
# GENERATED NODE MODEL
# =============================================================================


class GeneratedNode(BaseModel):
    """
    Represents a workflow node generated from an API endpoint.
    
    Generated nodes are automatically created from API endpoints and define
    how those endpoints appear and behave in the visual workflow canvas.
    Each node includes pin definitions, validation rules, and display properties.
    
    Pin Structure:
        Input/Output pins are defined as JSON arrays with objects containing:
        - name: Pin identifier
        - type: Data type (string, number, boolean, object, array, etc.)
        - label: Human-readable label
        - required: Whether the pin must be connected
        - description: Help text for the pin
    
    Attributes:
        provider (FK): Foreign key to the parent provider.
        endpoint (FK): Foreign key to the source API endpoint.
        node_type (str): Unique identifier for this node type.
        category (str): Node category (configuration, input, query, output).
        display_name (str): Human-readable name shown in the UI.
        description (str): Description shown in node palette.
        icon (str): Icon name/path for visual representation.
        color (str): Hex color code for node styling.
        input_pins (list): JSON array defining input pin configuration.
        output_pins (list): JSON array defining output pin configuration.
        config_schema (dict): JSON schema for node configuration panel.
        validation_rules (dict): JSON object defining validation rules.
        default_values (dict): JSON object with default values for pins/config.
    
    Relationships:
        provider: Parent Provider object (CASCADE delete).
        endpoint: Source APIEndpoint object (CASCADE delete).
    
    Indexes:
        - node_type (unique) - For quick node type lookups
        - category - For filtering by category
        - provider - For filtering by provider
    
    Example:
        >>> node = GeneratedNode.objects.create(
        ...     provider=provider,
        ...     endpoint=endpoint,
        ...     node_type='chainalysis_entity_lookup',
        ...     category='query',
        ...     display_name='Entity Lookup',
        ...     input_pins=[
        ...         {'name': 'credentials', 'type': 'credentials', 'required': True},
        ...         {'name': 'address', 'type': 'string', 'required': True}
        ...     ],
        ...     output_pins=[
        ...         {'name': 'entity', 'type': 'object'},
        ...         {'name': 'risk_score', 'type': 'number'}
        ...     ]
        ... )
    """
    
    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------
    
    provider = models.ForeignKey(
        Provider,
        on_delete=models.CASCADE,
        related_name='generated_nodes',
        verbose_name='Provider',
        help_text='The provider this node belongs to',
    )
    
    endpoint = models.ForeignKey(
        APIEndpoint,
        on_delete=models.CASCADE,
        related_name='generated_nodes',
        verbose_name='API Endpoint',
        help_text='The API endpoint this node was generated from',
    )
    
    # -------------------------------------------------------------------------
    # Node Identity
    # -------------------------------------------------------------------------
    
    node_type = models.CharField(
        verbose_name='Node Type',
        max_length=MAX_LENGTH_NODE_TYPE,
        unique=True,
        db_index=True,
        help_text='Unique identifier for this node type (e.g., "chainalysis_entity_lookup")',
    )
    
    category = models.CharField(
        verbose_name='Category',
        max_length=MAX_LENGTH_CATEGORY,
        choices=NODE_CATEGORY_CHOICES,
        default=NODE_CATEGORY_QUERY,
        db_index=True,
        help_text='Node category determines where it appears in the palette',
    )
    
    # -------------------------------------------------------------------------
    # Display Properties
    # -------------------------------------------------------------------------
    
    display_name = models.CharField(
        verbose_name='Display Name',
        max_length=MAX_LENGTH_DISPLAY_NAME,
        help_text='Human-readable name shown in the node palette',
    )
    
    description = models.TextField(
        verbose_name='Description',
        blank=True,
        default='',
        help_text='Description shown in the node palette',
    )
    
    icon = models.CharField(
        verbose_name='Icon',
        max_length=MAX_LENGTH_ICON,
        blank=True,
        default=DEFAULT_NODE_ICON,
        help_text='Icon name or path for visual representation',
    )
    
    color = models.CharField(
        verbose_name='Color',
        max_length=MAX_LENGTH_COLOR,
        default=DEFAULT_NODE_COLOR,
        help_text='Hex color code for node styling (e.g., "#4CAF50")',
    )
    
    # -------------------------------------------------------------------------
    # Pin Configuration
    # -------------------------------------------------------------------------
    
    input_pins = models.JSONField(
        verbose_name='Input Pins',
        default=list,
        blank=True,
        help_text='Array of input pin definitions',
    )
    
    output_pins = models.JSONField(
        verbose_name='Output Pins',
        default=list,
        blank=True,
        help_text='Array of output pin definitions',
    )
    
    # -------------------------------------------------------------------------
    # Configuration & Validation
    # -------------------------------------------------------------------------
    
    config_schema = models.JSONField(
        verbose_name='Configuration Schema',
        default=dict,
        blank=True,
        help_text='JSON schema for node configuration panel',
    )
    
    validation_rules = models.JSONField(
        verbose_name='Validation Rules',
        default=dict,
        blank=True,
        help_text='Validation rules for pin values',
    )
    
    default_values = models.JSONField(
        verbose_name='Default Values',
        default=dict,
        blank=True,
        help_text='Default values for pins and configuration',
    )
    
    # -------------------------------------------------------------------------
    # Meta & Indexes
    # -------------------------------------------------------------------------
    
    class Meta:
        db_table = 'generated_nodes'
        verbose_name = 'Generated Node'
        verbose_name_plural = 'Generated Nodes'
        ordering = ['category', 'display_name']
        indexes = [
            models.Index(
                fields=['node_type'],
                name='node_node_type_idx'
            ),
            models.Index(
                fields=['category'],
                name='node_category_idx'
            ),
            models.Index(
                fields=['provider'],
                name='node_provider_idx'
            ),
        ]
    
    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------
    
    def __str__(self) -> str:
        """
        String representation of the node.
        
        Returns:
            String in format "Display Name (node_type)"
        """
        return f"{self.display_name} ({self.node_type})"
    
    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------
    
    @property
    def input_pin_count(self) -> int:
        """
        Get the number of input pins.
        
        Returns:
            Count of input pins defined for this node.
        """
        return len(self.input_pins) if isinstance(self.input_pins, list) else 0
    
    @property
    def output_pin_count(self) -> int:
        """
        Get the number of output pins.
        
        Returns:
            Count of output pins defined for this node.
        """
        return len(self.output_pins) if isinstance(self.output_pins, list) else 0
    
    @property
    def total_pin_count(self) -> int:
        """
        Get the total number of pins (input + output).
        
        Returns:
            Total pin count.
        """
        return self.input_pin_count + self.output_pin_count
    
    @property
    def has_required_pins(self) -> bool:
        """
        Check if this node has any required input pins.
        
        Returns:
            True if any input pin is marked as required.
        """
        if not isinstance(self.input_pins, list):
            return False
        
        return any(pin.get('required', False) for pin in self.input_pins)
    
    @property
    def required_pin_names(self) -> List[str]:
        """
        Get names of all required input pins.
        
        Returns:
            List of required pin names.
        """
        if not isinstance(self.input_pins, list):
            return []
        
        return [
            pin['name']
            for pin in self.input_pins
            if pin.get('required', False)
        ]
    
    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------
    
    def get_input_pin_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get an input pin definition by name.
        
        Args:
            name: The pin name to search for.
        
        Returns:
            Pin definition dict if found, None otherwise.
        
        Example:
            >>> pin = node.get_input_pin_by_name('address')
            >>> print(pin['type'])
            'string'
        """
        if not isinstance(self.input_pins, list):
            return None
        
        for pin in self.input_pins:
            if pin.get('name') == name:
                return pin
        return None
    
    def get_output_pin_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get an output pin definition by name.
        
        Args:
            name: The pin name to search for.
        
        Returns:
            Pin definition dict if found, None otherwise.
        """
        if not isinstance(self.output_pins, list):
            return None
        
        for pin in self.output_pins:
            if pin.get('name') == name:
                return pin
        return None
    
    def to_node_definition(self) -> Dict[str, Any]:
        """
        Convert this generated node to a node definition for the frontend.
        
        Returns:
            Dictionary containing all node configuration needed by React Flow.
        
        Example:
            >>> definition = node.to_node_definition()
            >>> print(definition['type'])
            'chainalysis_entity_lookup'
        """
        return {
            'type': self.node_type,
            'category': self.category,
            'displayName': self.display_name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'inputPins': self.input_pins,
            'outputPins': self.output_pins,
            'configSchema': self.config_schema,
            'validationRules': self.validation_rules,
            'defaultValues': self.default_values,
            'provider': {
                'uuid': str(self.provider.uuid),
                'name': self.provider.name,
                'version': self.provider.version,
            },
            'endpoint': {
                'path': self.endpoint.path,
                'method': self.endpoint.method,
                'operation_id': self.endpoint.operation_id,
            },
        }
    
    # -------------------------------------------------------------------------
    # Validation
    # -------------------------------------------------------------------------
    
    def clean(self) -> None:
        """
        Validate model fields before saving.
        
        Raises:
            ValidationError: If validation fails.
        """
        super().clean()
        
        errors = {}
        
        # Validate input_pins is a list
        if self.input_pins is not None and not isinstance(self.input_pins, list):
            errors['input_pins'] = 'Input pins must be a list'
        
        # Validate output_pins is a list
        if self.output_pins is not None and not isinstance(self.output_pins, list):
            errors['output_pins'] = 'Output pins must be a list'
        
        # Validate config_schema is a dict
        if self.config_schema is not None and not isinstance(self.config_schema, dict):
            errors['config_schema'] = 'Config schema must be a dictionary'
        
        # Validate validation_rules is a dict
        if self.validation_rules is not None and not isinstance(self.validation_rules, dict):
            errors['validation_rules'] = 'Validation rules must be a dictionary'
        
        # Validate default_values is a dict
        if self.default_values is not None and not isinstance(self.default_values, dict):
            errors['default_values'] = 'Default values must be a dictionary'
        
        # Validate color format (hex color)
        if self.color and not self.color.startswith('#'):
            errors['color'] = 'Color must be a hex color code (e.g., "#4CAF50")'
        
        # Validate node_type format (alphanumeric and underscores only)
        if self.node_type and not all(c.isalnum() or c == '_' for c in self.node_type):
            errors['node_type'] = 'Node type must contain only alphanumeric characters and underscores'
        
        if errors:
            raise ValidationError(errors)


# =============================================================================
# PROVIDER VERSION MODEL
# =============================================================================


class ProviderVersion(BaseModel):
    """
    Tracks version history for providers.
    
    Each time a provider's OpenAPI specification is updated, a new
    ProviderVersion record is created to track changes and enable
    version comparison. This allows the system to detect breaking changes
    and provide migration guidance.
    
    Attributes:
        provider (FK): Foreign key to the parent provider.
        version (str): Version string (e.g., "2.1.0").
        spec_file_path (str): Path to the spec file for this version.
        changelog (str): Human-readable description of changes.
        breaking_changes (list): JSON array of breaking changes.
        is_active (bool): Whether this version is currently active.
    
        Relationships:
                provider: Parent Provider object (CASCADE delete).
                generated_nodes: Related GeneratedNode objects (CASCADE delete).
        
        Indexes:
            - (provider, path, method) - For unique endpoint identification
            - deprecated - For filtering deprecated endpoints
            - operation_id - For quick lookup by operation ID
        
        Constraints:
            - Unique (provider, path, method) - Each endpoint must be unique per provider
        
        Example:
        >>> version = ProviderVersion.objects.create(
        ...     provider=provider,
        ...     version='2.0.0',
        ...     spec_file_path='/path/to/spec_v2.yaml',
        ...     changelog='Major update with new endpoints',
        ...     breaking_changes=['Removed /v1/legacy endpoint'],
        ...     is_active=True
        ... )
    """
    
    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------
    
    provider = models.ForeignKey(
        Provider,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name='Provider',
        help_text='The provider this version belongs to',
    )
    
    # -------------------------------------------------------------------------
    # Version Information
    # -------------------------------------------------------------------------
    
    version = models.CharField(
        verbose_name='Version',
        max_length=MAX_LENGTH_VERSION,
        help_text='Version string (e.g., "2.1.0")',
    )
    
    spec_file_path = models.CharField(
        verbose_name='Spec File Path',
        max_length=MAX_LENGTH_PATH,
        help_text='Path to the OpenAPI specification file for this version',
    )
    
    changelog = models.TextField(
        verbose_name='Changelog',
        blank=True,
        default='',
        help_text='Human-readable description of changes in this version',
    )
    
    breaking_changes = models.JSONField(
        verbose_name='Breaking Changes',
        default=list,
        blank=True,
        help_text='Array of breaking changes introduced in this version',
    )
    
    is_active = models.BooleanField(
        verbose_name='Is Active',
        default=False,
        db_index=True,
        help_text='Whether this is the currently active version',
    )
    
    # -------------------------------------------------------------------------
    # Meta & Indexes
    # -------------------------------------------------------------------------
    
    class Meta:
        db_table = 'provider_versions'
        verbose_name = 'Provider Version'
        verbose_name_plural = 'Provider Versions'
        ordering = ['provider', '-version']
        indexes = [
            models.Index(
                fields=['provider', 'version'],
                name='version_provider_ver_idx'
            ),
            models.Index(
                fields=['is_active'],
                name='version_is_active_idx'
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'version'],
                name='unique_provider_version',
            ),
        ]
    
    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------
    
    def __str__(self) -> str:
        """
        String representation of the version.
        
        Returns:
            String in format "Provider Name vX.Y.Z [ACTIVE]"
        """
        active_tag = " [ACTIVE]" if self.is_active else ""
        return f"{self.provider.name} v{self.version}{active_tag}"
    
    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------
    
    @property
    def has_breaking_changes(self) -> bool:
        """
        Check if this version introduced breaking changes.
        
        Returns:
            True if breaking_changes is not empty.
        """
        return bool(self.breaking_changes) and len(self.breaking_changes) > 0
    
    @property
    def breaking_change_count(self) -> int:
        """
        Get the number of breaking changes in this version.
        
        Returns:
            Count of breaking changes.
        """
        if not isinstance(self.breaking_changes, list):
            return 0
        return len(self.breaking_changes)
    
    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------
    
    def activate(self, deactivate_others: bool = True) -> None:
        """
        Activate this version and optionally deactivate all others.
        
        Args:
            deactivate_others: If True, deactivate all other versions of
                             this provider (default: True).
        
        Example:
            >>> version = ProviderVersion.objects.get(version='2.0.0')
            >>> version.activate()
            >>> print(version.is_active)
            True
        """
        logger.info(
            f"Activating version: {self.provider.name} v{self.version}"
        )
        
        if deactivate_others:
            # Deactivate all other versions of this provider
            ProviderVersion.objects.filter(
                provider=self.provider,
                is_active=True
            ).exclude(uuid=self.uuid).update(is_active=False)
        
        self.is_active = True
        self.save(update_fields=['is_active', 'updated_at'])
    
    def deactivate(self) -> None:
        """
        Deactivate this version.
        
        Warning:
            Deactivating the only active version will leave the provider
            without an active version.
        """
        logger.info(
            f"Deactivating version: {self.provider.name} v{self.version}"
        )
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])
    
    # -------------------------------------------------------------------------
    # Validation
    # -------------------------------------------------------------------------
    
    def clean(self) -> None:
        """
        Validate model fields before saving.
        
        Raises:
            ValidationError: If validation fails.
        """
        super().clean()
        
        errors = {}
        
        # Validate spec file exists
        try:
            spec_path = Path(self.spec_file_path)
            if not spec_path.exists():
                errors['spec_file_path'] = (
                    f'Specification file not found: {self.spec_file_path}'
                )
        except (TypeError, ValueError) as e:
            errors['spec_file_path'] = f'Invalid file path: {e}'
        
        # Validate breaking_changes is a list
        if self.breaking_changes is not None and not isinstance(self.breaking_changes, list):
            errors['breaking_changes'] = 'Breaking changes must be a list'
        
        if errors:
            raise ValidationError(errors)


# =============================================================================
# MANAGER CLASSES
# =============================================================================


class ActiveProviderManager(models.Manager):
    """
    Manager that returns only active providers by default.
    
    This manager filters out deprecated and inactive providers,
    returning only those that are currently active and available
    for use in new workflows.
    
    Example:
        >>> active_providers = Provider.active.all()
        >>> print(active_providers.count())
        5
    """
    
    def get_queryset(self):
        """
        Return queryset filtered to active providers only.
        
        Returns:
            QuerySet with status='active' filter applied.
        """
        return super().get_queryset().filter(status=PROVIDER_STATUS_ACTIVE)


# Add the custom manager to the Provider model
# This allows: Provider.active.all() to get only active providers
Provider.add_to_class('active', ActiveProviderManager())


# =============================================================================
# SIGNALS (for future use)
# =============================================================================

# Signal handlers can be added here or in a separate signals.py file
# For example:
# - Auto-generate nodes when a provider is created
# - Update workflow nodes when provider is deprecated
# - Clean up spec files when provider is deleted

# Example signal (commented out for now):
# from django.db.models.signals import post_save
# from django.dispatch import receiver
#
# @receiver(post_save, sender=Provider)
# def generate_nodes_on_provider_save(sender, instance, created, **kwargs):
#     """Auto-generate nodes when a new provider is created."""
#     if created:
#         from apps.providers.services import ProviderService
#         service = ProviderService()
#         service.generate_nodes_for_provider(instance)