# =============================================================================
# FILE: backend/apps/integrations/models.py
# =============================================================================
# Database models for API integration management.
# =============================================================================
"""
Integration models for managing external API specifications.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Optional, Dict, Any

from django.db import models
from django.core.validators import FileExtensionValidator

from apps.core.models import BaseModel
from fields.constants import MAX_LENGTH_NAME, MAX_LENGTH_DESCRIPTION
from fields.names import (
    FIELD_API_PROVIDER_NAME,
    FIELD_API_VERSION,
    FIELD_SPEC_FILE,
    FIELD_PARSED_ENDPOINTS,
    get_verbose_name,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# API PROVIDER CHOICES
# =============================================================================

class APIProvider:
    """API provider types."""
    CHAINALYSIS = "chainalysis"
    TRM_LABS = "trm_labs"
    CUSTOM = "custom"


# API_PROVIDER_CHOICES = [
#     (APIProvider.CHAINALYSIS, "Chainalysis Reactor"),
#     (APIProvider.TRM_LABS, "TRM Labs"),
#     (APIProvider.CUSTOM, "Custom Provider"),
# ]


# =============================================================================
# OPENAPI SPECIFICATION MODEL
# =============================================================================

class OpenAPISpec(BaseModel):
    """
    Stores uploaded OpenAPI specification files.
    
    This model manages API specification files and tracks their
    parsing status. When a spec is uploaded, it's parsed to extract
    endpoint information which can then be used to generate workflow nodes.
    
    Attributes:
        provider: The API provider (Chainalysis, TRM Labs, or Custom).
        name: Human-readable name for this specification.
        description: Optional description.
        version: API version (e.g., "1.0", "v2").
        spec_file: Uploaded OpenAPI YAML/JSON file.
        parsed_data: Extracted endpoint data from the spec.
        is_parsed: Whether the spec has been successfully parsed.
        parse_error: Error message if parsing failed.
    """
    
    provider = models.CharField(
        verbose_name="API Provider",
        max_length=50,        
        db_index=True,
        help_text="The API provider this specification is for",
    )
    
    name = models.CharField(
        verbose_name=get_verbose_name(FIELD_API_PROVIDER_NAME),
        blank=True,
        default='',
        max_length=MAX_LENGTH_NAME,
        help_text="Name for this API specification",
    )
    
    description = models.TextField(
        verbose_name="Description",
        max_length=MAX_LENGTH_DESCRIPTION,
        blank=True,
        default="",
        help_text="Optional description of this specification",
    )
    
    version = models.CharField(
        verbose_name=get_verbose_name(FIELD_API_VERSION),
        blank=True,
        default='1.0.0',
        max_length=50,
        help_text="API version (e.g., '1.0', 'v2')",
    )
    
    spec_file = models.FileField(
        verbose_name=get_verbose_name(FIELD_SPEC_FILE),
        upload_to="api_specs/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=["yaml", "yml", "json"])],
        help_text="OpenAPI specification file (YAML or JSON)",
    )
    
    parsed_data = models.JSONField(
        verbose_name=get_verbose_name(FIELD_PARSED_ENDPOINTS),
        default=dict,
        blank=True,
        help_text="Parsed endpoint data from the specification",
    )
    
    is_parsed = models.BooleanField(
        verbose_name="Is Parsed",
        default=False,
        db_index=True,
        help_text="Whether the spec has been successfully parsed",
    )
    
    parse_error = models.TextField(
        verbose_name="Parse Error",
        blank=True,
        default="",
        help_text="Error message if parsing failed",
    )
    
    class Meta:
        db_table = "api_specs"
        verbose_name = "OpenAPI Specification"
        verbose_name_plural = "OpenAPI Specifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["provider", "-created_at"]),
            models.Index(fields=["is_parsed", "-created_at"]),
        ]
        unique_together = [["provider", "version"]]
    
    def __str__(self) -> str:
        """String representation."""
        return f"{self.get_provider_display()} {self.version} - {self.name}"
    
    def get_endpoint_count(self) -> int:
        """
        Get the number of parsed endpoints.
        
        Returns:
            Number of endpoints in parsed_data.
        """
        if not self.parsed_data or "endpoints" not in self.parsed_data:
            return 0
        return len(self.parsed_data.get("endpoints", []))
    
    def mark_as_parsed(self, parsed_data: Dict[str, Any]) -> None:
        """
        Mark spec as successfully parsed.
        
        Args:
            parsed_data: Dictionary containing parsed endpoint information.
        """
        self.parsed_data = parsed_data
        self.is_parsed = True
        self.parse_error = ""
        self.save(update_fields=["parsed_data", "is_parsed", "parse_error", "updated_at"])
        logger.info(f"Marked spec {self.uuid} as parsed with {self.get_endpoint_count()} endpoints")
    
    def mark_parse_failed(self, error_message: str) -> None:
        """
        Mark spec parsing as failed.
        
        Args:
            error_message: Error details.
        """
        self.is_parsed = False
        self.parse_error = error_message
        self.parsed_data = {}
        self.save(update_fields=["is_parsed", "parse_error", "parsed_data", "updated_at"])
        logger.error(f"Spec {self.uuid} parse failed: {error_message}")
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dictionary representation.
        
        Returns:
            Dictionary with spec details.
        """
        base_dict = super().to_dict()
        base_dict.update({
            "provider": self.provider,
            "provider_display": self.get_provider_display(),
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "spec_file_url": self.spec_file.url if self.spec_file else None,
            "endpoint_count": self.get_endpoint_count(),
            "is_parsed": self.is_parsed,
            "parse_error": self.parse_error,
        })
        return base_dict