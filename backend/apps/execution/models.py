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
from typing import Any, Dict, Optional

from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel, ActiveManager
from apps.workflows.models import Workflow, Node
from fields.constants import (
    MAX_LENGTH_LONG,
    MAX_LENGTH_LOG,
)
from fields.choices import (
    ExecutionStatus,
    EXECUTION_STATUS_CHOICES,
    NodeExecutionStatus,
    NODE_EXECUTION_STATUS_CHOICES,
    LogLevel,
    LOG_LEVEL_CHOICES,
)
from fields.names import (
    FIELD_EXECUTION_STATUS,
    FIELD_STARTED_AT,
    FIELD_COMPLETED_AT,
    FIELD_DURATION,
    FIELD_ERROR_MESSAGE,
    FIELD_LOG_LEVEL,
    FIELD_LOG_MESSAGE,
    get_verbose_name,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# EXECUTION MODEL
# =============================================================================


class Execution(BaseModel):
    """
    Represents a single execution of a workflow.

    Tracks the status, timing, and results of workflow execution.
    Each execution can have multiple log entries and node results.

    Attributes:
        workflow: The workflow being executed.
        status: Current execution status.
        started_at: When execution started.
        completed_at: When execution completed (success or failure).
        duration_seconds: Total execution time in seconds.
        error_message: Error message if execution failed.
        result_data: JSON data containing execution results.
        executed_by: Optional identifier for who triggered the execution.
    """

    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------

    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="executions",
        help_text="The workflow being executed.",
    )

    # -------------------------------------------------------------------------
    # Status Fields
    # -------------------------------------------------------------------------

    status = models.CharField(
        verbose_name=get_verbose_name(FIELD_EXECUTION_STATUS),
        max_length=50,
        choices=EXECUTION_STATUS_CHOICES,
        default=ExecutionStatus.PENDING.value,
        db_index=True,
        help_text="Current execution status.",
    )

    # -------------------------------------------------------------------------
    # Timing Fields
    # -------------------------------------------------------------------------

    started_at = models.DateTimeField(
        verbose_name=get_verbose_name(FIELD_STARTED_AT),
        null=True,
        blank=True,
        help_text="When execution started.",
    )

    completed_at = models.DateTimeField(
        verbose_name=get_verbose_name(FIELD_COMPLETED_AT),
        null=True,
        blank=True,
        help_text="When execution completed.",
    )

    duration_seconds = models.FloatField(
        verbose_name=get_verbose_name(FIELD_DURATION),
        null=True,
        blank=True,
        help_text="Total execution time in seconds.",
    )

    # -------------------------------------------------------------------------
    # Result Fields
    # -------------------------------------------------------------------------

    error_message = models.TextField(
        verbose_name=get_verbose_name(FIELD_ERROR_MESSAGE),
        max_length=MAX_LENGTH_LONG,
        blank=True,
        default="",
        help_text="Error message if execution failed.",
    )

    result_data = models.JSONField(
        verbose_name="Result Data",
        default=dict,
        blank=True,
        help_text="JSON data containing execution results.",
    )

    # -------------------------------------------------------------------------
    # Metadata
    # -------------------------------------------------------------------------

    executed_by = models.CharField(
        verbose_name="Executed By",
        max_length=100,
        blank=True,
        default="",
        help_text="Identifier for who/what triggered the execution.",
    )

    # -------------------------------------------------------------------------
    # Managers
    # -------------------------------------------------------------------------

    objects = ActiveManager()
    all_objects = models.Manager()

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        verbose_name = "Execution"
        verbose_name_plural = "Executions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workflow", "status"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["-started_at"]),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return f"Execution {self.uuid} ({self.status})"

    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------

    @property
    def is_running(self) -> bool:
        """Check if execution is currently running."""
        return self.status == ExecutionStatus.RUNNING.value

    @property
    def is_completed(self) -> bool:
        """Check if execution has completed (success or failure)."""
        return self.status in [
            ExecutionStatus.COMPLETED.value,
            ExecutionStatus.FAILED.value,
            ExecutionStatus.CANCELLED.value,
        ]

    @property
    def is_successful(self) -> bool:
        """Check if execution completed successfully."""
        return self.status == ExecutionStatus.COMPLETED.value

    @property
    def log_count(self) -> int:
        """Return the number of log entries."""
        return self.logs.count()

    # -------------------------------------------------------------------------
    # Lifecycle Methods
    # -------------------------------------------------------------------------

    def start(self) -> None:
        """Mark execution as started."""
        self.status = ExecutionStatus.RUNNING.value
        self.started_at = timezone.now()
        self.save(update_fields=["status", "started_at", "updated_at"])

        logger.info(f"Execution {self.uuid} started")

    def complete(self, result_data: Optional[Dict] = None) -> None:
        """
        Mark execution as completed successfully.

        Args:
            result_data: Optional result data to store.
        """
        self.status = ExecutionStatus.COMPLETED.value
        self.completed_at = timezone.now()

        if self.started_at:
            self.duration_seconds = (
                self.completed_at - self.started_at
            ).total_seconds()

        if result_data:
            self.result_data = result_data

        self.save(update_fields=[
            "status", "completed_at", "duration_seconds",
            "result_data", "updated_at"
        ])

        # Update workflow's last_executed_at
        self.workflow.last_executed_at = self.completed_at
        self.workflow.save(update_fields=["last_executed_at", "updated_at"])

        logger.info(
            f"Execution {self.uuid} completed in {self.duration_seconds:.2f}s"
        )

    def fail(self, error_message: str) -> None:
        """
        Mark execution as failed.

        Args:
            error_message: Description of what went wrong.
        """
        self.status = ExecutionStatus.FAILED.value
        self.completed_at = timezone.now()
        self.error_message = error_message

        if self.started_at:
            self.duration_seconds = (
                self.completed_at - self.started_at
            ).total_seconds()

        self.save(update_fields=[
            "status", "completed_at", "duration_seconds",
            "error_message", "updated_at"
        ])

        logger.error(f"Execution {self.uuid} failed: {error_message}")

    def cancel(self) -> None:
        """Mark execution as cancelled."""
        self.status = ExecutionStatus.CANCELLED.value
        self.completed_at = timezone.now()

        if self.started_at:
            self.duration_seconds = (
                self.completed_at - self.started_at
            ).total_seconds()

        self.save(update_fields=[
            "status", "completed_at", "duration_seconds", "updated_at"
        ])

        logger.info(f"Execution {self.uuid} cancelled")

    # -------------------------------------------------------------------------
    # Logging Methods
    # -------------------------------------------------------------------------

    def add_log(
        self,
        message: str,
        level: str = LogLevel.INFO.value,
        node: Optional[Node] = None,
        metadata: Optional[Dict] = None
    ) -> "ExecutionLog":
        """
        Add a log entry to this execution.

        Args:
            message: Log message.
            level: Log level (debug, info, warning, error, critical).
            node: Optional node that generated the log.
            metadata: Optional additional metadata.

        Returns:
            The created ExecutionLog instance.
        """
        log_entry = ExecutionLog.objects.create(
            execution=self,
            node=node,
            level=level,
            message=message,
            metadata=metadata or {},
        )
        return log_entry

    # -------------------------------------------------------------------------
    # Serialization
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Convert execution to dictionary representation."""
        base_dict = super().to_dict()
        base_dict.update({
            "workflow_id": str(self.workflow_id),
            "workflow_name": self.workflow.name,
            "status": self.status,
            "started_at": (
                self.started_at.isoformat() if self.started_at else None
            ),
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "duration_seconds": self.duration_seconds,
            "error_message": self.error_message,
            "executed_by": self.executed_by,
            "log_count": self.log_count,
        })
        return base_dict


# =============================================================================
# EXECUTION LOG MODEL
# =============================================================================


class ExecutionLog(BaseModel):
    """
    Represents a log entry for a workflow execution.

    Logs are created during execution to track progress, debug issues,
    and provide feedback to users in real-time via WebSocket.

    Attributes:
        execution: The execution this log belongs to.
        node: Optional node that generated the log.
        level: Log level (debug, info, warning, error, critical).
        message: The log message.
        metadata: Additional JSON metadata.
    """

    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------

    execution = models.ForeignKey(
        Execution,
        on_delete=models.CASCADE,
        related_name="logs",
        help_text="The execution this log belongs to.",
    )

    node = models.ForeignKey(
        Node,
        on_delete=models.SET_NULL,
        related_name="execution_logs",
        null=True,
        blank=True,
        help_text="Optional node that generated the log.",
    )

    # -------------------------------------------------------------------------
    # Log Fields
    # -------------------------------------------------------------------------

    level = models.CharField(
        verbose_name=get_verbose_name(FIELD_LOG_LEVEL),
        max_length=20,
        choices=LOG_LEVEL_CHOICES,
        default=LogLevel.INFO.value,
        db_index=True,
        help_text="Log level.",
    )

    message = models.TextField(
        verbose_name=get_verbose_name(FIELD_LOG_MESSAGE),
        max_length=MAX_LENGTH_LOG,
        help_text="The log message.",
    )

    metadata = models.JSONField(
        verbose_name="Metadata",
        default=dict,
        blank=True,
        help_text="Additional JSON metadata.",
    )

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        verbose_name = "Execution Log"
        verbose_name_plural = "Execution Logs"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["execution", "level"]),
            models.Index(fields=["execution", "created_at"]),
            models.Index(fields=["node"]),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        truncated = self.message[:50] + "..." if len(self.message) > 50 else self.message
        return f"[{self.level.upper()}] {truncated}"

    # -------------------------------------------------------------------------
    # Serialization
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Convert log to dictionary representation."""
        base_dict = super().to_dict()
        base_dict.update({
            "execution_id": str(self.execution_id),
            "node_id": str(self.node_id) if self.node_id else None,
            "level": self.level,
            "message": self.message,
            "metadata": self.metadata,
            "timestamp": self.created_at.isoformat() if self.created_at else None,
        })
        return base_dict


# =============================================================================
# NODE EXECUTION RESULT MODEL
# =============================================================================


class NodeExecutionResult(BaseModel):
    """
    Stores the result of executing a single node.

    Tracks the status and output of each node during workflow execution.

    Attributes:
        execution: The parent execution.
        node: The node that was executed.
        status: Execution status for this node.
        started_at: When node execution started.
        completed_at: When node execution completed.
        duration_seconds: Node execution time.
        input_data: JSON data received as input.
        output_data: JSON data produced as output.
        error_message: Error message if node failed.
    """

    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------

    execution = models.ForeignKey(
        Execution,
        on_delete=models.CASCADE,
        related_name="node_results",
        help_text="The parent execution.",
    )

    node = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name="execution_results",
        help_text="The node that was executed.",
    )

    # -------------------------------------------------------------------------
    # Status Fields
    # -------------------------------------------------------------------------

    status = models.CharField(
        verbose_name="Status",
        max_length=50,
        choices=NODE_EXECUTION_STATUS_CHOICES,
        default=NodeExecutionStatus.PENDING.value,
        db_index=True,
        help_text="Execution status for this node.",
    )

    # -------------------------------------------------------------------------
    # Timing Fields
    # -------------------------------------------------------------------------

    started_at = models.DateTimeField(
        verbose_name="Started At",
        null=True,
        blank=True,
        help_text="When node execution started.",
    )

    completed_at = models.DateTimeField(
        verbose_name="Completed At",
        null=True,
        blank=True,
        help_text="When node execution completed.",
    )

    duration_seconds = models.FloatField(
        verbose_name="Duration (seconds)",
        null=True,
        blank=True,
        help_text="Node execution time in seconds.",
    )

    # -------------------------------------------------------------------------
    # Data Fields
    # -------------------------------------------------------------------------

    input_data = models.JSONField(
        verbose_name="Input Data",
        default=dict,
        blank=True,
        help_text="JSON data received as input.",
    )

    output_data = models.JSONField(
        verbose_name="Output Data",
        default=dict,
        blank=True,
        help_text="JSON data produced as output.",
    )

    error_message = models.TextField(
        verbose_name="Error Message",
        max_length=MAX_LENGTH_LONG,
        blank=True,
        default="",
        help_text="Error message if node failed.",
    )

    # -------------------------------------------------------------------------
    # Meta
    # -------------------------------------------------------------------------

    class Meta:
        verbose_name = "Node Execution Result"
        verbose_name_plural = "Node Execution Results"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["execution", "node"]),
            models.Index(fields=["execution", "status"]),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.node.display_name} - {self.status}"

    # -------------------------------------------------------------------------
    # Serialization
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        base_dict = super().to_dict()
        base_dict.update({
            "execution_id": str(self.execution_id),
            "node_id": str(self.node_id),
            "node_type": self.node.node_type,
            "node_label": self.node.display_name,
            "status": self.status,
            "started_at": (
                self.started_at.isoformat() if self.started_at else None
            ),
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "duration_seconds": self.duration_seconds,
            "error_message": self.error_message,
        })
        return base_dict