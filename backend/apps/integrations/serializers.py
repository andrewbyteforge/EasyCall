# =============================================================================
# FILE: backend/apps/integrations/serializers.py
# =============================================================================
# Serializers for API integration models.
# =============================================================================
"""
Serializers for API integration management.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from rest_framework import serializers

from apps.integrations.models import OpenAPISpec

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# OPENAPI SPEC SERIALIZERS
# =============================================================================

class OpenAPISpecListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing OpenAPI specifications.
    Excludes parsed_data to reduce payload size.
    """
    
    provider_display = serializers.CharField(source="get_provider_display", read_only=True)
    endpoint_count = serializers.SerializerMethodField()
    spec_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = OpenAPISpec
        fields = [
            "uuid",
            "provider",
            "provider_display",
            "name",
            "version",
            "endpoint_count",
            "is_parsed",
            "spec_file_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]
    
    def get_endpoint_count(self, obj: OpenAPISpec) -> int:
        """Get number of parsed endpoints."""
        return obj.get_endpoint_count()
    
    def get_spec_file_url(self, obj: OpenAPISpec) -> str:
        """Get spec file URL."""
        if obj.spec_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.spec_file.url)
            return obj.spec_file.url
        return ""


class OpenAPISpecSerializer(serializers.ModelSerializer):
    """
    Full serializer for OpenAPI specification detail view.
    Includes all fields including parsed data.
    """
    
    provider_display = serializers.CharField(source="get_provider_display", read_only=True)
    endpoint_count = serializers.SerializerMethodField()
    spec_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = OpenAPISpec
        fields = [
            "uuid",
            "provider",
            "provider_display",
            "name",
            "description",
            "version",
            "spec_file",
            "spec_file_url",
            "parsed_data",
            "endpoint_count",
            "is_parsed",
            "parse_error",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = [
            "uuid",
            "parsed_data",
            "is_parsed",
            "parse_error",
            "created_at",
            "updated_at",
        ]
    
    def get_endpoint_count(self, obj: OpenAPISpec) -> int:
        """Get number of parsed endpoints."""
        return obj.get_endpoint_count()
    
    def get_spec_file_url(self, obj: OpenAPISpec) -> str:
        """Get spec file URL."""
        if obj.spec_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.spec_file.url)
            return obj.spec_file.url
        return ""
    
    def validate_spec_file(self, value):
        """
        Validate spec file extension.
        
        Args:
            value: Uploaded file.
            
        Returns:
            Validated file.
            
        Raises:
            ValidationError: If file extension is invalid.
        """
        if not value:
            return value
        
        # Check file extension
        allowed_extensions = [".yaml", ".yml", ".json"]
        file_ext = value.name.lower().split(".")[-1]
        
        if f".{file_ext}" not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large. Maximum size: {max_size / (1024 * 1024)}MB"
            )
        
        return value


class OpenAPISpecCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new OpenAPI specifications.
    Handles file upload and triggers parsing.
    """
    
    class Meta:
        model = OpenAPISpec
        fields = [
            "provider",
            "name",
            "description",
            "version",
            "spec_file",
        ]
    
    def validate_spec_file(self, value):
        """Validate spec file."""
        if not value:
            raise serializers.ValidationError("Specification file is required")
        
        # Check file extension
        allowed_extensions = [".yaml", ".yml", ".json"]
        file_ext = value.name.lower().split(".")[-1]
        
        if f".{file_ext}" not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large. Maximum size: 5MB"
            )
        
        return value
    
    def create(self, validated_data):
        """Create spec and trigger parsing."""
        spec = super().create(validated_data)
        logger.info(f"Created OpenAPI spec: {spec.uuid}")
        return spec


class GeneratedNodesSerializer(serializers.Serializer):
    """
    Serializer for generated node definitions.
    Used to return generated nodes from API endpoint.
    """
    
    nodes = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of generated node definitions"
    )
    
    count = serializers.IntegerField(
        help_text="Number of generated nodes"
    )
    
    provider = serializers.CharField(
        help_text="API provider"
    )