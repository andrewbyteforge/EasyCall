# =============================================================================
# FILE: backend/apps/integrations/serializers.py (UPDATED)
# =============================================================================
# Serializers for API integration models
# UPDATED: Auto-extract name and version from uploaded OpenAPI spec files
# =============================================================================
"""
Serializers for API integration management.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import json
import yaml
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
    
    UPDATED: Makes name and version optional, auto-extracts from spec file
    """
    
    provider_display = serializers.CharField(source="get_provider_display", read_only=True)
    endpoint_count = serializers.SerializerMethodField()
    spec_file_url = serializers.SerializerMethodField()
    
    # Make these optional - will be auto-extracted from spec file
    name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    version = serializers.CharField(required=False, allow_blank=True, max_length=50)
    
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
        
        # Check file size (max 10MB - increased from 5MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large. Maximum size: {max_size / (1024 * 1024)}MB"
            )
        
        return value
    
    def _extract_spec_metadata(self, spec_file):
        """
        Extract name and version from OpenAPI spec file.
        
        Args:
            spec_file: Uploaded spec file
            
        Returns:
            tuple: (name, version) extracted from spec
        """
        try:
            # Read file content
            spec_file.seek(0)  # Reset file pointer
            content = spec_file.read()
            
            # Decode if bytes
            if isinstance(content, bytes):
                content = content.decode('utf-8')
            
            # Try to parse as JSON first
            spec_data = None
            try:
                spec_data = json.loads(content)
                logger.info("Parsed spec file as JSON")
            except (json.JSONDecodeError, ValueError):
                # Try YAML
                try:
                    spec_data = yaml.safe_load(content)
                    logger.info("Parsed spec file as YAML")
                except yaml.YAMLError as e:
                    logger.warning(f"Could not parse spec file: {e}")
                    spec_data = None
            
            # Extract metadata from spec
            if spec_data and isinstance(spec_data, dict):
                info = spec_data.get('info', {})
                name = info.get('title', None)
                version = info.get('version', None)
                
                logger.info(f"Extracted from spec - name: {name}, version: {version}")
                
                # Reset file pointer for actual save
                spec_file.seek(0)
                
                return name, version
            
            # Reset file pointer
            spec_file.seek(0)
            return None, None
            
        except Exception as e:
            logger.error(f"Error extracting metadata from spec file: {e}")
            # Reset file pointer
            try:
                spec_file.seek(0)
            except:
                pass
            return None, None
    
    def create(self, validated_data):
        """
        Create OpenAPI spec with auto-extracted metadata.
        
        UPDATED: Auto-extracts name and version from uploaded spec file
        """
        spec_file = validated_data.get('spec_file')
        provider = validated_data.get('provider', 'unknown')
        
        # Extract metadata from spec file if not provided
        if spec_file:
            extracted_name, extracted_version = self._extract_spec_metadata(spec_file)
            
            # Use extracted values if not provided in request
            if not validated_data.get('name') and extracted_name:
                validated_data['name'] = extracted_name
                logger.info(f"Auto-populated name: {extracted_name}")
            
            if not validated_data.get('version') and extracted_version:
                validated_data['version'] = extracted_version
                logger.info(f"Auto-populated version: {extracted_version}")
        
        # Set defaults if still missing
        if not validated_data.get('name'):
            validated_data['name'] = f"{provider.replace('_', ' ').title()} API"
            logger.info(f"Using default name: {validated_data['name']}")
        
        if not validated_data.get('version'):
            validated_data['version'] = '1.0.0'
            logger.info(f"Using default version: {validated_data['version']}")
        
        # Create the spec
        spec = super().create(validated_data)
        logger.info(f"Created OpenAPI spec: {spec.uuid}")
        return spec
    
    def update(self, instance, validated_data):
        """
        Update OpenAPI spec with auto-extracted metadata.
        
        UPDATED: Auto-extracts name and version from uploaded spec file
        """
        spec_file = validated_data.get('spec_file')
        
        # If new spec file uploaded, extract metadata
        if spec_file and spec_file != instance.spec_file:
            extracted_name, extracted_version = self._extract_spec_metadata(spec_file)
            
            # Use extracted values if not provided in request
            if not validated_data.get('name') and extracted_name:
                validated_data['name'] = extracted_name
                logger.info(f"Auto-populated name: {extracted_name}")
            
            if not validated_data.get('version') and extracted_version:
                validated_data['version'] = extracted_version
                logger.info(f"Auto-populated version: {extracted_version}")
        
        return super().update(instance, validated_data)


class OpenAPISpecCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new OpenAPI specifications.
    Handles file upload and triggers parsing.
    
    UPDATED: Makes name and version optional, auto-extracts from spec file
    """
    
    # Make these optional - will be auto-extracted
    name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    version = serializers.CharField(required=False, allow_blank=True, max_length=50)
    
    class Meta:
        model = OpenAPISpec
        fields = [
            "provider",
            "name",
            "description",
            "version",
            "spec_file",
            "is_active",
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
        
        # Check file size (10MB max)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large. Maximum size: 10MB"
            )
        
        return value
    
    def _extract_spec_metadata(self, spec_file):
        """
        Extract name and version from OpenAPI spec file.
        
        Args:
            spec_file: Uploaded spec file
            
        Returns:
            tuple: (name, version) extracted from spec
        """
        try:
            # Read file content
            spec_file.seek(0)
            content = spec_file.read()
            
            # Decode if bytes
            if isinstance(content, bytes):
                content = content.decode('utf-8')
            
            # Try JSON first
            spec_data = None
            try:
                spec_data = json.loads(content)
            except (json.JSONDecodeError, ValueError):
                # Try YAML
                try:
                    spec_data = yaml.safe_load(content)
                except yaml.YAMLError:
                    pass
            
            # Extract from info section
            if spec_data and isinstance(spec_data, dict):
                info = spec_data.get('info', {})
                name = info.get('title')
                version = info.get('version')
                
                # Reset file pointer
                spec_file.seek(0)
                return name, version
            
            spec_file.seek(0)
            return None, None
            
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
            try:
                spec_file.seek(0)
            except:
                pass
            return None, None
    
    def create(self, validated_data):
        """
        Create spec and auto-extract metadata.
        
        UPDATED: Auto-extracts name and version from uploaded spec file
        """
        spec_file = validated_data.get('spec_file')
        provider = validated_data.get('provider', 'unknown')
        
        # Extract metadata if file provided
        if spec_file:
            extracted_name, extracted_version = self._extract_spec_metadata(spec_file)
            
            # Use extracted values if not provided
            if not validated_data.get('name') and extracted_name:
                validated_data['name'] = extracted_name
            
            if not validated_data.get('version') and extracted_version:
                validated_data['version'] = extracted_version
        
        # Set defaults if still missing
        if not validated_data.get('name'):
            validated_data['name'] = f"{provider.replace('_', ' ').title()} API"
        
        if not validated_data.get('version'):
            validated_data['version'] = '1.0.0'
        
        spec = super().create(validated_data)
        logger.info(f"Created OpenAPI spec: {spec.uuid} - {validated_data['name']} v{validated_data['version']}")
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