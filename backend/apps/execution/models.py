# =============================================================================
# FILE: easycall/backend/apps/execution/models.py
# =============================================================================
# Database models for workflow execution tracking.
# =============================================================================
"""
Execution models for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Optional

from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel
from fields.choices import EXECUTION_STATUS_CHOICES, ExecutionStatus
from fields.names import (
    FIELD_EXECUTION_STATUS,
    FIELD_STARTED_AT,
    FIELD_COMPLETED_AT,
    FIELD_ERROR_MESSAGE,
    FIELD_RESULT,
    get_verbose_name,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# EXECUTION LOG MODEL
# =============================================================================

class ExecutionLog(BaseModel):
    """
    Tracks workflow execution history.
    
    Each execution of a workflow creates a new ExecutionLog record
    that tracks:
    - Which workflow was executed
    - When execution started and completed
    - Execution status and any errors
    - Overall results
    
    Attributes:
        workflow: Foreign key to the workflow that was executed.
        status: Current execution status (pending, running, completed, failed).
        started_at: When execution began.
        completed_at: When execution finished (if completed).
        error_message: Error details if execution failed.
        result_data: Final aggregated results from all nodes.
    """
    
    workflow = models.ForeignKey(
        "workflows.Workflow",
        on_delete=models.CASCADE,
        related_name="executions",
        help_text="The workflow that was executed",
    )
    
    status = models.CharField(
        verbose_name=get_verbose_name(FIELD_EXECUTION_STATUS),
        max_length=20,
        choices=EXECUTION_STATUS_CHOICES,
        default=ExecutionStatus.PENDING.value,
        db_index=True,
        help_text="Current execution status",
    )
    
    started_at = models.DateTimeField(
        verbose_name=get_verbose_name(FIELD_STARTED_AT),
        null=True,
        blank=True,
        help_text="When execution started",
    )
    
    completed_at = models.DateTimeField(
        verbose_name=get_verbose_name(FIELD_COMPLETED_AT),
        null=True,
        blank=True,
        help_text="When execution completed",
    )
    
    error_message = models.TextField(
        verbose_name=get_verbose_name(FIELD_ERROR_MESSAGE),
        blank=True,
        default="",
        help_text="Error details if execution failed",
    )
    
    result_data = models.JSONField(
        verbose_name=get_verbose_name(FIELD_RESULT),
        default=dict,
        help_text="Aggregated results from all nodes",
    )
    
    class Meta:
        db_table = "execution_logs"
        verbose_name = "Execution Log"
        verbose_name_plural = "Execution Logs"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["workflow", "-started_at"]),
            models.Index(fields=["status", "-started_at"]),
        ]
    
    def __str__(self) -> str:
        """String representation of the execution."""
        return f"Execution {self.uuid} - {self.workflow.name} ({self.status})"
    
    def start(self) -> None:
        """Mark execution as started."""
        self.status = ExecutionStatus.RUNNING.value
        self.started_at = timezone.now()
        self.save(update_fields=["status", "started_at", "updated_at"])
        logger.info(f"Execution {self.uuid} started")
    
    def complete(self, result_data: dict) -> None:
        """
        Mark execution as completed successfully.
        
        Args:
            result_data: Final aggregated results.
        """
        self.status = ExecutionStatus.COMPLETED.value
        self.completed_at = timezone.now()
        self.result_data = result_data
        self.save(update_fields=["status", "completed_at", "result_data", "updated_at"])
        logger.info(f"Execution {self.uuid} completed successfully")
    
    def fail(self, error_message: str) -> None:
        """
        Mark execution as failed.
        
        Args:
            error_message: Error details.
        """
        self.status = ExecutionStatus.FAILED.value
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.save(update_fields=["status", "completed_at", "error_message", "updated_at"])
        logger.error(f"Execution {self.uuid} failed: {error_message}")
    
    def get_duration_seconds(self) -> Optional[float]:
        """
        Calculate execution duration in seconds.
        
        Returns:
            Duration in seconds, or None if not completed.
        """
        if not self.started_at or not self.completed_at:
            return None
        
        duration = self.completed_at - self.started_at
        return duration.total_seconds()
    
    def to_dict(self) -> dict:
        """
        Convert execution to dictionary.
        
        Returns:
            Dictionary representation.
        """
        base_dict = super().to_dict()
        base_dict.update({
            "workflow_id": str(self.workflow.uuid),
            "workflow_name": self.workflow.name,
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_seconds": self.get_duration_seconds(),
            "error_message": self.error_message,
            "result_data": self.result_data,
        })
        return base_dict