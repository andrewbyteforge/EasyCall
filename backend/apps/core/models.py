# =============================================================================
# FILE: easycall/backend/apps/core/models.py
# =============================================================================
# Base model classes with common fields and functionality.
#
# All application models should inherit from these base classes to ensure
# consistent behavior across the application.
# =============================================================================
"""
Base model classes for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import uuid
from typing import Any

from django.db import models
from django.utils import timezone

from fields.names import (
    FIELD_CREATED_AT,
    FIELD_IS_ACTIVE,
    FIELD_UPDATED_AT,
    FIELD_UUID,
    get_verbose_name,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# ABSTRACT BASE MODELS
# =============================================================================


class TimeStampedModel(models.Model):
    """
    Abstract base model with automatic timestamp fields.

    Provides created_at and updated_at fields that are automatically
    managed by Django.

    Attributes:
        created_at: Timestamp when the record was created.
        updated_at: Timestamp when the record was last updated.
    """

    created_at = models.DateTimeField(
        verbose_name=get_verbose_name(FIELD_CREATED_AT),
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when this record was created.",
    )

    updated_at = models.DateTimeField(
        verbose_name=get_verbose_name(FIELD_UPDATED_AT),
        auto_now=True,
        help_text="Timestamp when this record was last updated.",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def touch(self) -> None:
        """
        Update the updated_at timestamp without saving other fields.

        This is useful when you want to mark a record as updated
        without changing any other data.
        """
        self.updated_at = timezone.now()
        self.save(update_fields=["updated_at"])


class UUIDModel(models.Model):
    """
    Abstract base model with UUID as primary key.

    Uses UUID instead of auto-incrementing integer for the primary key.
    This is useful for distributed systems and provides better URL security.

    Attributes:
        uuid: UUID primary key for the record.
    """

    uuid = models.UUIDField(
        verbose_name=get_verbose_name(FIELD_UUID),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for this record.",
    )

    class Meta:
        abstract = True


class ActiveModel(models.Model):
    """
    Abstract base model with soft-delete functionality.

    Provides an is_active field for soft-delete operations.
    Records can be marked as inactive instead of being deleted.

    Attributes:
        is_active: Whether the record is active (not soft-deleted).
    """

    is_active = models.BooleanField(
        verbose_name=get_verbose_name(FIELD_IS_ACTIVE),
        default=True,
        db_index=True,
        help_text="Whether this record is active.",
    )

    class Meta:
        abstract = True

    def soft_delete(self) -> None:
        """
        Mark the record as inactive (soft delete).

        This sets is_active to False instead of deleting the record.
        """
        logger.info(
            f"Soft deleting {self.__class__.__name__} with pk={self.pk}"
        )
        self.is_active = False
        self.save(update_fields=["is_active"])

    def restore(self) -> None:
        """
        Restore a soft-deleted record.

        This sets is_active back to True.
        """
        logger.info(
            f"Restoring {self.__class__.__name__} with pk={self.pk}"
        )
        self.is_active = True
        self.save(update_fields=["is_active"])


class BaseModel(UUIDModel, TimeStampedModel, ActiveModel):
    """
    Full-featured base model combining UUID, timestamps, and soft-delete.

    This is the recommended base class for most application models.
    It provides:
    - UUID primary key
    - Automatic created_at and updated_at timestamps
    - Soft-delete functionality with is_active flag

    Attributes:
        uuid: UUID primary key for the record.
        created_at: Timestamp when the record was created.
        updated_at: Timestamp when the record was last updated.
        is_active: Whether the record is active (not soft-deleted).
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def __str__(self) -> str:
        """
        Return string representation of the model.

        Returns:
            A string in the format "ClassName (uuid)".
        """
        return f"{self.__class__.__name__} ({self.uuid})"

    def to_dict(self) -> dict[str, Any]:
        """
        Convert the model instance to a dictionary.

        Returns:
            Dictionary representation of the model's fields.
        """
        return {
            "uuid": str(self.uuid),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active,
        }


# =============================================================================
# MANAGER CLASSES
# =============================================================================


class ActiveManager(models.Manager):
    """
    Manager that returns only active records by default.

    Use this manager to automatically filter out soft-deleted records.
    The all() queryset will only return active records.

    Example:
        class MyModel(BaseModel):
            objects = ActiveManager()
            all_objects = models.Manager()  # Include inactive

        # Only active records
        MyModel.objects.all()

        # All records including inactive
        MyModel.all_objects.all()
    """

    def get_queryset(self) -> models.QuerySet:
        """
        Return queryset filtered to active records only.

        Returns:
            QuerySet with is_active=True filter applied.
        """
        return super().get_queryset().filter(is_active=True)