# =============================================================================
# FILE: easycall/backend/apps/settings_manager/models.py
# =============================================================================
# Database models for application settings and API credentials.
# =============================================================================
"""
Settings models for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Any, Dict, Optional

from django.db import models
from django.core.cache import cache

from apps.core.models import BaseModel
from fields.constants import (
    MAX_LENGTH_NAME,
    MAX_LENGTH_API_KEY,
    MAX_LENGTH_API_URL,
    BATCH_SIZE_DEFAULT,
    BATCH_SIZE_MAX,
    RATE_LIMIT_DEFAULT,
    EXECUTION_TIMEOUT_DEFAULT,
)
from fields.choices import (
    APIProvider,
    API_PROVIDER_CHOICES,
)
from fields.names import (
    FIELD_API_KEY,
    FIELD_API_SECRET,
    FIELD_API_URL,
    FIELD_API_PROVIDER,
    get_verbose_name,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# CACHE KEYS
# =============================================================================

GLOBAL_SETTINGS_CACHE_KEY = "global_settings"
CACHE_TIMEOUT = 300  # 5 minutes

# =============================================================================
# GLOBAL SETTINGS MODEL
# =============================================================================


class GlobalSettings(BaseModel):
    """
    Singleton model for application-wide settings.

    Stores configuration that applies to the entire application,
    such as batch processing limits, rate limits, and default timeouts.

    This is a singleton model - only one instance should exist.

    Attributes:
        batch_size_limit: Maximum addresses per batch.
        execution_timeout: Default workflow timeout in seconds.
        chainalysis_rate_limit: Requests per minute for Chainalysis.
        trm_rate_limit: Requests per minute for TRM Labs.
        default_blockchain: Default blockchain for new nodes.
        enable_logging: Whether detailed logging is enabled.
    """

    # -------------------------------------------------------------------------
    # Batch Processing Settings
    # -------------------------------------------------------------------------

    batch_size_limit = models.PositiveIntegerField(
        verbose_name="Batch Size Limit",
        default=BATCH_SIZE_DEFAULT,
        help_text=f"Maximum addresses per batch (max: {BATCH_SIZE_MAX}).",
    )

    # -------------------------------------------------------------------------
    # Execution Settings
    # -------------------------------------------------------------------------

    execution_timeout = models.PositiveIntegerField(
        verbose_name="Execution Timeout",
        default=EXECUTION_TIMEOUT_DEFAULT,
        help_text="Default workflow timeout in seconds.",
    )

    # -------------------------------------------------------------------------
    # Rate Limiting Settings
    # -------------------------------------------------------------------------

    chainalysis_rate_limit = models.PositiveIntegerField(
        verbose_name="Chainalysis Rate Limit",
        default=RATE_LIMIT_DEFAULT,
        help_text="Requests per minute for Chainalysis API.",
    )

    trm_rate_limit = models.PositiveIntegerField(
        verbose_name="TRM Labs Rate Limit",
        default=RATE_LIMIT_DEFAULT,
        help_text="Requests per minute for TRM Labs API.",
    )

    # -------------------------------------------------------------------------
    # Default Settings
    # -------------------------------------------------------------------------

    default_blockchain = models.CharField(
        verbose_name="Default Blockchain",
        max_length=50,
        default="bitcoin",
        help_text="Default blockchain for new input nodes.",
    )

    # -------------------------------------------------------------------------
    # Feature Flags
    # -------------------------------------------------------------------------

    enable_detailed_logging = models.BooleanField(
        verbose_name="Enable Detailed Logging",
        default=True,
        help_text="Whether to log detailed execution information.",
    )

    enable_websocket_logs = models.BooleanField(
        verbose_name="Enable WebSocket Logs",
        default=True,
        help_text="Whether to send logs via WebSocket in real-time.",
    )

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        verbose_name = "Global Settings"
        verbose_name_plural = "Global Settings"

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return "Global Settings"

    # -------------------------------------------------------------------------
    # Singleton Pattern
    # -------------------------------------------------------------------------

    def save(self, *args, **kwargs) -> None:
        """Ensure only one instance exists and invalidate cache."""
        self.pk = 1  # Force primary key to 1
        super().save(*args, **kwargs)

        # Invalidate cache
        cache.delete(GLOBAL_SETTINGS_CACHE_KEY)

        logger.info("Global settings updated")

    @classmethod
    def load(cls) -> "GlobalSettings":
        """
        Load the global settings instance.

        Creates default settings if none exist. Uses caching for performance.

        Returns:
            The GlobalSettings instance.
        """
        # Try cache first
        cached = cache.get(GLOBAL_SETTINGS_CACHE_KEY)
        if cached:
            return cached

        # Get or create settings
        settings, created = cls.objects.get_or_create(pk=1)

        if created:
            logger.info("Created default global settings")

        # Cache for future requests
        cache.set(GLOBAL_SETTINGS_CACHE_KEY, settings, CACHE_TIMEOUT)

        return settings

    # -------------------------------------------------------------------------
    # Serialization
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Convert settings to dictionary representation."""
        return {
            "batch_size_limit": self.batch_size_limit,
            "execution_timeout": self.execution_timeout,
            "chainalysis_rate_limit": self.chainalysis_rate_limit,
            "trm_rate_limit": self.trm_rate_limit,
            "default_blockchain": self.default_blockchain,
            "enable_detailed_logging": self.enable_detailed_logging,
            "enable_websocket_logs": self.enable_websocket_logs,
        }


# =============================================================================
# API CREDENTIAL MODEL
# =============================================================================


class APICredential(BaseModel):
    """
    Stores encrypted API credentials for external services.

    API keys are encrypted at rest using Fernet symmetric encryption.
    The encryption key is stored in the environment variables.

    Attributes:
        provider: API provider (chainalysis, trm_labs).
        label: Human-readable label for this credential set.
        api_key_encrypted: Encrypted API key.
        api_secret_encrypted: Encrypted API secret (if applicable).
        api_url: Base URL for the API.
        is_default: Whether this is the default credential for the provider.
        last_used_at: When these credentials were last used.
        last_verified_at: When these credentials were last verified.
    """

    # -------------------------------------------------------------------------
    # Provider Information
    # -------------------------------------------------------------------------

    provider = models.CharField(
        verbose_name=get_verbose_name(FIELD_API_PROVIDER),
        max_length=50,
        choices=API_PROVIDER_CHOICES,
        db_index=True,
        help_text="API provider (chainalysis, trm_labs).",
    )

    label = models.CharField(
        verbose_name="Label",
        max_length=MAX_LENGTH_NAME,
        default="Default",
        help_text="Human-readable label for this credential set.",
    )

    # -------------------------------------------------------------------------
    # Encrypted Credentials
    # -------------------------------------------------------------------------

    api_key_encrypted = models.CharField(
        verbose_name="API Key (Encrypted)",
        max_length=MAX_LENGTH_API_KEY * 2,  # Encrypted is longer
        help_text="Encrypted API key.",
    )

    api_secret_encrypted = models.CharField(
        verbose_name="API Secret (Encrypted)",
        max_length=MAX_LENGTH_API_KEY * 2,
        blank=True,
        default="",
        help_text="Encrypted API secret (if applicable).",
    )

    # -------------------------------------------------------------------------
    # API Configuration
    # -------------------------------------------------------------------------

    api_url = models.URLField(
        verbose_name=get_verbose_name(FIELD_API_URL),
        max_length=MAX_LENGTH_API_URL,
        blank=True,
        default="",
        help_text="Base URL for the API (leave empty for default).",
    )

    # -------------------------------------------------------------------------
    # Status Fields
    # -------------------------------------------------------------------------

    is_default = models.BooleanField(
        verbose_name="Is Default",
        default=False,
        help_text="Whether this is the default credential for the provider.",
    )

    last_used_at = models.DateTimeField(
        verbose_name="Last Used At",
        null=True,
        blank=True,
        help_text="When these credentials were last used.",
    )

    last_verified_at = models.DateTimeField(
        verbose_name="Last Verified At",
        null=True,
        blank=True,
        help_text="When these credentials were last verified.",
    )

    is_verified = models.BooleanField(
        verbose_name="Is Verified",
        default=False,
        help_text="Whether these credentials have been verified.",
    )

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        verbose_name = "API Credential"
        verbose_name_plural = "API Credentials"
        ordering = ["-is_default", "provider", "label"]
        indexes = [
            models.Index(fields=["provider", "is_default"]),
            models.Index(fields=["provider", "is_active"]),
        ]
        constraints = [
            # Only one default per provider
            models.UniqueConstraint(
                fields=["provider"],
                condition=models.Q(is_default=True, is_active=True),
                name="unique_default_per_provider",
            ),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        default_marker = " (Default)" if self.is_default else ""
        return f"{self.get_provider_display()} - {self.label}{default_marker}"

    # -------------------------------------------------------------------------
    # Encryption Methods
    # -------------------------------------------------------------------------

    def set_api_key(self, api_key: str) -> None:
        """
        Encrypt and store the API key.

        Args:
            api_key: The plaintext API key to encrypt.
        """
        from utils.encryption import encrypt_value

        self.api_key_encrypted = encrypt_value(api_key)

    def get_api_key(self) -> str:
        """
        Decrypt and return the API key.

        Returns:
            The decrypted API key.
        """
        from utils.encryption import decrypt_value

        return decrypt_value(self.api_key_encrypted)

    def set_api_secret(self, api_secret: str) -> None:
        """
        Encrypt and store the API secret.

        Args:
            api_secret: The plaintext API secret to encrypt.
        """
        from utils.encryption import encrypt_value

        self.api_secret_encrypted = encrypt_value(api_secret)

    def get_api_secret(self) -> Optional[str]:
        """
        Decrypt and return the API secret.

        Returns:
            The decrypted API secret, or None if not set.
        """
        from utils.encryption import decrypt_value

        if not self.api_secret_encrypted:
            return None

        return decrypt_value(self.api_secret_encrypted)

    # -------------------------------------------------------------------------
    # Status Methods
    # -------------------------------------------------------------------------

    def mark_as_used(self) -> None:
        """Update the last_used_at timestamp."""
        from django.utils import timezone

        self.last_used_at = timezone.now()
        self.save(update_fields=["last_used_at", "updated_at"])

    def mark_as_verified(self, verified: bool = True) -> None:
        """
        Update the verification status.

        Args:
            verified: Whether verification succeeded.
        """
        from django.utils import timezone

        self.is_verified = verified
        self.last_verified_at = timezone.now()
        self.save(update_fields=["is_verified", "last_verified_at", "updated_at"])

    def set_as_default(self) -> None:
        """Set this credential as the default for its provider."""
        # Remove default from other credentials of same provider
        APICredential.objects.filter(
            provider=self.provider,
            is_default=True,
            is_active=True,
        ).exclude(pk=self.pk).update(is_default=False)

        # Set this as default
        self.is_default = True
        self.save(update_fields=["is_default", "updated_at"])

        logger.info(f"Set {self} as default credential")

    # -------------------------------------------------------------------------
    # Class Methods
    # -------------------------------------------------------------------------

    @classmethod
    def get_default(cls, provider: str) -> Optional["APICredential"]:
        """
        Get the default credential for a provider.

        Args:
            provider: The API provider (chainalysis, trm_labs).

        Returns:
            The default APICredential, or None if not configured.
        """
        try:
            return cls.objects.get(
                provider=provider,
                is_default=True,
                is_active=True,
            )
        except cls.DoesNotExist:
            return None

    # -------------------------------------------------------------------------
    # Serialization
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dictionary representation.

        Note: API keys are NOT included for security.
        """
        base_dict = super().to_dict()
        base_dict.update({
            "provider": self.provider,
            "provider_display": self.get_provider_display(),
            "label": self.label,
            "api_url": self.api_url,
            "is_default": self.is_default,
            "is_verified": self.is_verified,
            "last_used_at": (
                self.last_used_at.isoformat() if self.last_used_at else None
            ),
            "last_verified_at": (
                self.last_verified_at.isoformat() if self.last_verified_at else None
            ),
            # NOTE: api_key is intentionally NOT included
            "has_api_key": bool(self.api_key_encrypted),
            "has_api_secret": bool(self.api_secret_encrypted),
        })
        return base_dict