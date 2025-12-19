# =============================================================================
# FILE: easycall/backend/apps/settings_manager/serializers.py
# =============================================================================
# Serializers for settings management models.
#
# This module provides serializers for:
# - GlobalSettings (singleton application settings)
# - APICredential (encrypted API credentials)
# =============================================================================
"""
Serializers for the settings manager application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Dict, Any

from rest_framework import serializers

from apps.settings_manager.models import GlobalSettings, APICredential
from fields.choices import API_PROVIDER_CHOICES

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# GLOBAL SETTINGS SERIALIZERS
# =============================================================================


class GlobalSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for global application settings.
    
    Provides read and write access to singleton settings.
    Settings are automatically created if they don't exist.
    """
    
    class Meta:
        model = GlobalSettings
        fields = [
            "uuid",
            "batch_size_limit",
            "execution_timeout",
            "chainalysis_rate_limit",
            "trm_rate_limit",
            "default_blockchain",
            "enable_detailed_logging",
            "enable_websocket_logs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]
    
    def validate_batch_size_limit(self, value: int) -> int:
        """
        Validate batch size limit is within acceptable range.
        
        Args:
            value: The batch size limit
            
        Returns:
            Validated value
            
        Raises:
            ValidationError: If value is out of range
        """
        from fields.constants import BATCH_SIZE_MIN, BATCH_SIZE_MAX
        
        if value < BATCH_SIZE_MIN:
            raise serializers.ValidationError(
                f"Batch size must be at least {BATCH_SIZE_MIN}"
            )
        if value > BATCH_SIZE_MAX:
            raise serializers.ValidationError(
                f"Batch size cannot exceed {BATCH_SIZE_MAX}"
            )
        return value
    
    def validate_execution_timeout(self, value: int) -> int:
        """
        Validate execution timeout is within acceptable range.
        
        Args:
            value: The timeout in seconds
            
        Returns:
            Validated value
            
        Raises:
            ValidationError: If value is out of range
        """
        from fields.constants import (
            EXECUTION_TIMEOUT_MIN,
            EXECUTION_TIMEOUT_MAX,
        )
        
        if value < EXECUTION_TIMEOUT_MIN:
            raise serializers.ValidationError(
                f"Timeout must be at least {EXECUTION_TIMEOUT_MIN} seconds"
            )
        if value > EXECUTION_TIMEOUT_MAX:
            raise serializers.ValidationError(
                f"Timeout cannot exceed {EXECUTION_TIMEOUT_MAX} seconds"
            )
        return value
    
    def validate_chainalysis_rate_limit(self, value: int) -> int:
        """Validate Chainalysis rate limit is positive."""
        if value <= 0:
            raise serializers.ValidationError(
                "Rate limit must be a positive integer"
            )
        return value
    
    def validate_trm_rate_limit(self, value: int) -> int:
        """Validate TRM rate limit is positive."""
        if value <= 0:
            raise serializers.ValidationError(
                "Rate limit must be a positive integer"
            )
        return value


# =============================================================================
# API CREDENTIAL SERIALIZERS
# =============================================================================


class APICredentialListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for credential list view.
    Excludes sensitive data, optimized for listing.
    """
    
    provider_display = serializers.CharField(
        source="get_provider_display",
        read_only=True
    )
    
    has_api_key = serializers.SerializerMethodField()
    has_api_secret = serializers.SerializerMethodField()
    
    class Meta:
        model = APICredential
        fields = [
            "uuid",
            "provider",
            "provider_display",
            "label",
            "is_default",
            "is_verified",
            "has_api_key",
            "has_api_secret",
            "last_used_at",
            "created_at",
        ]
        read_only_fields = [
            "uuid",
            "is_verified",
            "last_used_at",
            "created_at",
        ]
    
    def get_has_api_key(self, obj: APICredential) -> bool:
        """Check if credential has an API key."""
        return bool(obj.api_key_encrypted)
    
    def get_has_api_secret(self, obj: APICredential) -> bool:
        """Check if credential has an API secret."""
        return bool(obj.api_secret_encrypted)


class APICredentialSerializer(serializers.ModelSerializer):
    """
    Full serializer for API credentials (without exposing keys).
    
    Used for retrieving and displaying credential details.
    API keys are never exposed in responses for security.
    """
    
    provider_display = serializers.CharField(
        source="get_provider_display",
        read_only=True
    )
    
    has_api_key = serializers.SerializerMethodField()
    has_api_secret = serializers.SerializerMethodField()
    
    class Meta:
        model = APICredential
        fields = [
            "uuid",
            "provider",
            "provider_display",
            "label",
            "api_url",
            "is_default",
            "is_verified",
            "has_api_key",
            "has_api_secret",
            "last_used_at",
            "last_verified_at",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = [
            "uuid",
            "is_verified",
            "last_used_at",
            "last_verified_at",
            "created_at",
            "updated_at",
        ]
    
    def get_has_api_key(self, obj: APICredential) -> bool:
        """Check if credential has an API key."""
        return bool(obj.api_key_encrypted)
    
    def get_has_api_secret(self, obj: APICredential) -> bool:
        """Check if credential has an API secret."""
        return bool(obj.api_secret_encrypted)


class APICredentialCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating API credentials.
    
    Accepts plaintext API keys/secrets which are automatically
    encrypted before storage.
    """
    
    api_key = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Plaintext API key (will be encrypted)",
        style={'input_type': 'password'},
    )
    
    api_secret = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="Plaintext API secret (will be encrypted, optional)",
        style={'input_type': 'password'},
    )
    
    class Meta:
        model = APICredential
        fields = [
            "uuid",
            "provider",
            "label",
            "api_key",
            "api_secret",
            "api_url",
            "is_default",
        ]
        read_only_fields = ["uuid"]
    
    def validate_provider(self, value: str) -> str:
        """Validate provider is supported."""
        valid_providers = [choice[0] for choice in API_PROVIDER_CHOICES]
        if value not in valid_providers:
            raise serializers.ValidationError(
                f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
            )
        return value
    
    def validate_api_key(self, value: str) -> str:
        """Validate API key is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("API key cannot be empty")
        return value.strip()
    
    def create(self, validated_data: Dict[str, Any]) -> APICredential:
        """
        Create API credential with encrypted keys.
        
        Args:
            validated_data: Validated data from serializer
            
        Returns:
            Created APICredential instance
        """
        # Extract plaintext keys
        api_key = validated_data.pop("api_key")
        api_secret = validated_data.pop("api_secret", "")
        
        # Create credential instance
        credential = APICredential(**validated_data)
        
        # Encrypt and set keys
        credential.set_api_key(api_key)
        if api_secret:
            credential.set_api_secret(api_secret)
        
        credential.save()
        
        logger.info(
            f"Created API credential: {credential.provider} - {credential.label}"
        )
        
        return credential
    
    def update(
        self, 
        instance: APICredential, 
        validated_data: Dict[str, Any]
    ) -> APICredential:
        """
        Update API credential with new encrypted keys.
        
        Args:
            instance: Existing credential instance
            validated_data: Validated data from serializer
            
        Returns:
            Updated APICredential instance
        """
        # Extract plaintext keys if provided
        api_key = validated_data.pop("api_key", None)
        api_secret = validated_data.pop("api_secret", None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update encrypted keys if provided
        if api_key:
            instance.set_api_key(api_key)
        if api_secret is not None:  # Allow empty string to clear secret
            if api_secret:
                instance.set_api_secret(api_secret)
            else:
                instance.api_secret_encrypted = ""
        
        instance.save()
        
        logger.info(
            f"Updated API credential: {instance.provider} - {instance.label}"
        )
        
        return instance


class APICredentialTestSerializer(serializers.Serializer):
    """
    Serializer for testing API credentials.
    
    Used to validate credentials without saving them.
    """
    
    provider = serializers.ChoiceField(
        choices=API_PROVIDER_CHOICES,
        required=True,
        help_text="API provider to test",
    )
    
    api_key = serializers.CharField(
        required=True,
        help_text="API key to test",
        style={'input_type': 'password'},
    )
    
    api_secret = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="API secret to test (if applicable)",
        style={'input_type': 'password'},
    )
    
    api_url = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text="Custom API URL (optional)",
    )
    
    def validate_api_key(self, value: str) -> str:
        """Validate API key is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("API key cannot be empty")
        return value.strip()