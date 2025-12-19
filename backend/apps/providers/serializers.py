# =============================================================================
# FILE: easycall/backend/apps/providers/serializers.py
# =============================================================================
# DRF serializers for provider models.
# =============================================================================
"""
Serializers for the providers application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Dict, Any

from rest_framework import serializers

from apps.providers.models import Provider, APIEndpoint, GeneratedNode

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# PROVIDER SERIALIZERS
# =============================================================================


class ProviderListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for provider lists.
    
    Used in list views where full detail is not needed.
    """
    
    endpoint_count = serializers.IntegerField(read_only=True)
    node_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Provider
        fields = [
            'uuid',
            'name',
            'slug',
            'version',
            'status',
            'auth_type',
            'base_url',
            'icon_path',
            'endpoint_count',
            'node_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']


class ProviderDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for provider details.
    
    Includes all fields and computed properties.
    """
    
    endpoint_count = serializers.IntegerField(read_only=True)
    node_count = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    has_spec = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Provider
        fields = [
            'uuid',
            'name',
            'slug',
            'description',
            'status',
            'base_url',
            'auth_type',
            'icon_path',
            'documentation_url',
            'spec_file_path',
            'spec_format',
            'spec_parsed_at',
            'version',
            'rate_limit_per_minute',
            'timeout_seconds',
            'supports_batch',
            'metadata',
            'endpoint_count',
            'node_count',
            'is_active',
            'has_spec',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'uuid',
            'created_at',
            'updated_at',
            'spec_parsed_at',
        ]


class ProviderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new providers.
    
    Validates required fields and ensures unique slug/version combination.
    """
    
    class Meta:
        model = Provider
        fields = [
            'name',
            'slug',
            'description',
            'base_url',
            'auth_type',
            'icon_path',
            'documentation_url',
            'spec_file_path',
            'spec_format',
            'version',
            'rate_limit_per_minute',
            'timeout_seconds',
            'supports_batch',
            'metadata',
            'status',
        ]
    
    def validate_slug(self, value: str) -> str:
        """
        Validate slug is URL-safe.
        
        Args:
            value: Slug value to validate.
            
        Returns:
            Validated slug.
            
        Raises:
            ValidationError: If slug is invalid.
        """
        if not value.replace('-', '').replace('_', '').isalnum():
            raise serializers.ValidationError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores."
            )
        return value.lower()


# =============================================================================
# API ENDPOINT SERIALIZERS
# =============================================================================


class APIEndpointListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for endpoint lists.
    """
    
    provider_name = serializers.CharField(
        source='provider.name',
        read_only=True
    )
    
    full_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = APIEndpoint
        fields = [
            'uuid',
            'provider',
            'provider_name',
            'path',
            'method',
            'operation_id',
            'summary',
            'requires_auth',
            'full_url',
            'created_at',
        ]
        read_only_fields = ['uuid', 'created_at']


class APIEndpointDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for endpoint details.
    """
    
    provider_name = serializers.CharField(
        source='provider.name',
        read_only=True
    )
    
    full_url = serializers.CharField(read_only=True)
    has_parameters = serializers.BooleanField(read_only=True)
    has_request_body = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = APIEndpoint
        fields = [
            'uuid',
            'provider',
            'provider_name',
            'path',
            'method',
            'operation_id',
            'summary',
            'description',
            'parameters',
            'request_body',
            'response_schema',
            'tags',
            'requires_auth',
            'rate_limit_override',
            'full_url',
            'has_parameters',
            'has_request_body',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']


# =============================================================================
# GENERATED NODE SERIALIZERS
# =============================================================================


class GeneratedNodeListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for node lists.
    """
    
    provider_name = serializers.CharField(
        source='provider.name',
        read_only=True
    )
    
    input_pin_count = serializers.IntegerField(read_only=True)
    output_pin_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = GeneratedNode
        fields = [
            'uuid',
            'provider',
            'provider_name',
            'node_type',
            'category',
            'display_name',
            'description',
            'icon',
            'color',
            'input_pin_count',
            'output_pin_count',
            'created_at',
        ]
        read_only_fields = ['uuid', 'created_at']


class GeneratedNodeDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for node details.
    """
    
    provider_name = serializers.CharField(
        source='provider.name',
        read_only=True
    )
    
    endpoint_path = serializers.CharField(
        source='endpoint.path',
        read_only=True,
        allow_null=True
    )
    
    endpoint_method = serializers.CharField(
        source='endpoint.method',
        read_only=True,
        allow_null=True
    )
    
    input_pin_count = serializers.IntegerField(read_only=True)
    output_pin_count = serializers.IntegerField(read_only=True)
    is_credential_node = serializers.BooleanField(read_only=True)
    is_query_node = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = GeneratedNode
        fields = [
            'uuid',
            'provider',
            'provider_name',
            'endpoint',
            'endpoint_path',
            'endpoint_method',
            'node_type',
            'category',
            'display_name',
            'description',
            'icon',
            'color',
            'input_pins',
            'output_pins',
            'configuration_fields',
            'validation_rules',
            'metadata',
            'input_pin_count',
            'output_pin_count',
            'is_credential_node',
            'is_query_node',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']


# =============================================================================
# IMPACT ANALYSIS SERIALIZER
# =============================================================================


class ProviderImpactAnalysisSerializer(serializers.Serializer):
    """
    Serializer for provider deletion impact analysis.
    
    Shows which workflows would be affected by removing a provider.
    """
    
    provider_uuid = serializers.UUIDField()
    provider_name = serializers.CharField()
    can_delete = serializers.BooleanField()
    warning_message = serializers.CharField(allow_null=True)
    affected_workflows = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
    endpoint_count = serializers.IntegerField()
    node_count = serializers.IntegerField()