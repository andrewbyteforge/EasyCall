# =============================================================================
# FILE: easycall/backend/apps/workflows/models.py
# =============================================================================
# Database models for workflow management including Workflow, Node, and
# Connection models.
# =============================================================================
"""
Workflow models for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Any, Dict, List, Optional

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from apps.core.models import BaseModel, ActiveManager
from fields.constants import (
    MAX_LENGTH_NAME,
    MAX_LENGTH_DESCRIPTION,
    MAX_LENGTH_JSON,
    NODE_POSITION_MIN,
    NODE_POSITION_MAX,
    NODE_POSITION_DEFAULT,
    MAX_LENGTH_PIN_ID,
)
from fields.choices import (
    NodeCategory,
    NODE_CATEGORY_CHOICES,
    NodeType,
    NODE_TYPE_CHOICES,
)
from fields.names import (
    FIELD_NAME,
    FIELD_DESCRIPTION,
    FIELD_CANVAS_DATA,
    FIELD_NODE_TYPE,
    FIELD_NODE_CATEGORY,
    FIELD_NODE_LABEL,
    FIELD_NODE_CONFIG,
    FIELD_POSITION_X,
    FIELD_POSITION_Y,
    FIELD_SOURCE_NODE,
    FIELD_TARGET_NODE,
    FIELD_SOURCE_PIN,
    FIELD_TARGET_PIN,
    get_verbose_name,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# WORKFLOW MODEL
# =============================================================================


class Workflow(BaseModel):
    """
    Represents a complete workflow containing nodes and connections.

    A workflow is the main container that holds all nodes and their
    connections. It stores the canvas state for the React Flow editor
    and can be saved, loaded, and executed.

    Attributes:
        name: Human-readable name for the workflow.
        description: Optional detailed description.
        canvas_data: JSON data for React Flow canvas state (viewport, etc.).
        is_template: Whether this workflow is a reusable template.
        last_executed_at: Timestamp of the last execution.
    """

    # -------------------------------------------------------------------------
    # Fields
    # -------------------------------------------------------------------------

    name = models.CharField(
        verbose_name=get_verbose_name(FIELD_NAME),
        max_length=MAX_LENGTH_NAME,
        help_text="Human-readable name for this workflow.",
    )

    description = models.TextField(
        verbose_name=get_verbose_name(FIELD_DESCRIPTION),
        max_length=MAX_LENGTH_DESCRIPTION,
        blank=True,
        default="",
        help_text="Optional detailed description of what this workflow does.",
    )

    canvas_data = models.JSONField(
        verbose_name=get_verbose_name(FIELD_CANVAS_DATA),
        default=dict,
        blank=True,
        help_text="React Flow canvas state (viewport position, zoom, etc.).",
    )

    is_template = models.BooleanField(
        verbose_name="Is Template",
        default=False,
        help_text="Whether this workflow is a reusable template.",
    )

    last_executed_at = models.DateTimeField(
        verbose_name="Last Executed At",
        null=True,
        blank=True,
        help_text="Timestamp of the last execution.",
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
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["is_template"]),
            models.Index(fields=["is_active", "-updated_at"]),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.name} ({self.uuid})"

    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------

    @property
    def node_count(self) -> int:
        """Return the number of nodes in this workflow."""
        return self.nodes.count()

    @property
    def connection_count(self) -> int:
        """Return the number of connections in this workflow."""
        return self.connections.count()

    # -------------------------------------------------------------------------
    # Methods
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert workflow to dictionary representation.

        Returns:
            Dictionary with workflow data including nodes and connections.
        """
        base_dict = super().to_dict()
        base_dict.update({
            "name": self.name,
            "description": self.description,
            "canvas_data": self.canvas_data,
            "is_template": self.is_template,
            "last_executed_at": (
                self.last_executed_at.isoformat()
                if self.last_executed_at else None
            ),
            "node_count": self.node_count,
            "connection_count": self.connection_count,
        })
        return base_dict

    def duplicate(self, new_name: Optional[str] = None) -> "Workflow":
        """
        Create a duplicate of this workflow.

        Args:
            new_name: Optional new name for the duplicate.

        Returns:
            New Workflow instance (not saved).
        """
        duplicate = Workflow(
            name=new_name or f"{self.name} (Copy)",
            description=self.description,
            canvas_data=self.canvas_data.copy() if self.canvas_data else {},
            is_template=False,
        )
        return duplicate

    def get_nodes_by_type(self, node_type: str) -> models.QuerySet:
        """
        Get all nodes of a specific type.

        Args:
            node_type: The node type to filter by.

        Returns:
            QuerySet of matching nodes.
        """
        return self.nodes.filter(node_type=node_type)

    def get_input_nodes(self) -> models.QuerySet:
        """Get all input nodes in this workflow."""
        return self.nodes.filter(node_category=NodeCategory.INPUT.value)

    def get_output_nodes(self) -> models.QuerySet:
        """Get all output nodes in this workflow."""
        return self.nodes.filter(node_category=NodeCategory.OUTPUT.value)


# =============================================================================
# NODE MODEL
# =============================================================================


class Node(BaseModel):
    """
    Represents a single node in a workflow.

    Nodes are the building blocks of workflows. Each node has a type
    (e.g., single_address, trm_address_attribution, excel_export),
    a position on the canvas, and configuration data.

    Attributes:
        workflow: The workflow this node belongs to.
        node_type: Type identifier for this node.
        node_category: Category (input, query, output, configuration).
        node_label: User-customizable display label.
        position_x: X coordinate on the canvas.
        position_y: Y coordinate on the canvas.
        config: JSON configuration data for the node.
    """

    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------

    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="nodes",
        help_text="The workflow this node belongs to.",
    )

    # -------------------------------------------------------------------------
    # Node Type Fields
    # -------------------------------------------------------------------------

    node_type = models.CharField(
        verbose_name=get_verbose_name(FIELD_NODE_TYPE),
        max_length=100,
        choices=NODE_TYPE_CHOICES,
        help_text="Type identifier for this node.",
    )

    node_category = models.CharField(
        verbose_name=get_verbose_name(FIELD_NODE_CATEGORY),
        max_length=50,
        choices=NODE_CATEGORY_CHOICES,
        help_text="Category of this node (input, query, output, etc.).",
    )

    node_label = models.CharField(
        verbose_name=get_verbose_name(FIELD_NODE_LABEL),
        max_length=MAX_LENGTH_NAME,
        blank=True,
        default="",
        help_text="User-customizable display label for this node.",
    )

    # -------------------------------------------------------------------------
    # Position Fields
    # -------------------------------------------------------------------------

    position_x = models.FloatField(
        verbose_name=get_verbose_name(FIELD_POSITION_X),
        default=NODE_POSITION_DEFAULT,
        validators=[
            MinValueValidator(NODE_POSITION_MIN),
            MaxValueValidator(NODE_POSITION_MAX),
        ],
        help_text="X coordinate on the canvas.",
    )

    position_y = models.FloatField(
        verbose_name=get_verbose_name(FIELD_POSITION_Y),
        default=NODE_POSITION_DEFAULT,
        validators=[
            MinValueValidator(NODE_POSITION_MIN),
            MaxValueValidator(NODE_POSITION_MAX),
        ],
        help_text="Y coordinate on the canvas.",
    )

    # -------------------------------------------------------------------------
    # Configuration
    # -------------------------------------------------------------------------

    config = models.JSONField(
        verbose_name=get_verbose_name(FIELD_NODE_CONFIG),
        default=dict,
        blank=True,
        help_text="JSON configuration data for this node.",
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
        verbose_name = "Node"
        verbose_name_plural = "Nodes"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["workflow", "node_type"]),
            models.Index(fields=["workflow", "node_category"]),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        label = self.node_label or self.node_type
        return f"{label} ({self.uuid})"

    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------

    @property
    def display_name(self) -> str:
        """Return the display name for this node."""
        return self.node_label if self.node_label else self.get_node_type_display()

    @property
    def position(self) -> Dict[str, float]:
        """Return position as a dictionary."""
        return {"x": self.position_x, "y": self.position_y}

    @property
    def incoming_connections(self) -> models.QuerySet:
        """Get all connections where this node is the target."""
        return self.incoming.all()

    @property
    def outgoing_connections(self) -> models.QuerySet:
        """Get all connections where this node is the source."""
        return self.outgoing.all()

    # -------------------------------------------------------------------------
    # Methods
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Convert node to dictionary representation."""
        base_dict = super().to_dict()
        base_dict.update({
            "workflow_id": str(self.workflow_id),
            "node_type": self.node_type,
            "node_category": self.node_category,
            "node_label": self.node_label,
            "display_name": self.display_name,
            "position": self.position,
            "config": self.config,
        })
        return base_dict

    def update_position(self, x: float, y: float) -> None:
        """
        Update the node's position on the canvas.

        Args:
            x: New X coordinate.
            y: New Y coordinate.
        """
        self.position_x = x
        self.position_y = y
        self.save(update_fields=["position_x", "position_y", "updated_at"])

    def update_config(self, config: Dict[str, Any]) -> None:
        """
        Update the node's configuration.

        Args:
            config: New configuration dictionary.
        """
        self.config = config
        self.save(update_fields=["config", "updated_at"])


# =============================================================================
# CONNECTION MODEL
# =============================================================================


class Connection(BaseModel):
    """
    Represents a connection between two nodes.

    Connections define the data flow between nodes. Each connection
    links a source node's output pin to a target node's input pin.

    Attributes:
        workflow: The workflow this connection belongs to.
        source_node: The node where the connection originates.
        target_node: The node where the connection terminates.
        source_pin: The output pin identifier on the source node.
        target_pin: The input pin identifier on the target node.
    """

    # -------------------------------------------------------------------------
    # Relationships
    # -------------------------------------------------------------------------

    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="connections",
        help_text="The workflow this connection belongs to.",
    )

    source_node = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name="outgoing",
        help_text="The node where the connection originates.",
    )

    target_node = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name="incoming",
        help_text="The node where the connection terminates.",
    )

    # -------------------------------------------------------------------------
    # Pin Identifiers
    # -------------------------------------------------------------------------

    source_pin = models.CharField(
        verbose_name=get_verbose_name(FIELD_SOURCE_PIN),
        max_length=MAX_LENGTH_PIN_ID,
        default="output",
        help_text="The output pin identifier on the source node.",
    )

    target_pin = models.CharField(
        verbose_name=get_verbose_name(FIELD_TARGET_PIN),
        max_length=MAX_LENGTH_PIN_ID,
        default="input",
        help_text="The input pin identifier on the target node.",
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
        verbose_name = "Connection"
        verbose_name_plural = "Connections"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["workflow"]),
            models.Index(fields=["source_node"]),
            models.Index(fields=["target_node"]),
        ]
        constraints = [
            # Prevent duplicate connections
            models.UniqueConstraint(
                fields=["source_node", "target_node", "source_pin", "target_pin"],
                name="unique_connection",
            ),
            # Prevent self-connections
            models.CheckConstraint(
                check=~models.Q(source_node=models.F("target_node")),
                name="no_self_connection",
            ),
        ]

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------

    def __str__(self) -> str:
        """Return string representation."""
        return (
            f"{self.source_node_id}:{self.source_pin} → "
            f"{self.target_node_id}:{self.target_pin}"
        )

    # -------------------------------------------------------------------------
    # Methods
    # -------------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Convert connection to dictionary representation."""
        base_dict = super().to_dict()
        base_dict.update({
            "workflow_id": str(self.workflow_id),
            "source_node_id": str(self.source_node_id),
            "target_node_id": str(self.target_node_id),
            "source_pin": self.source_pin,
            "target_pin": self.target_pin,
        })
        return base_dict

    def clean(self) -> None:
        """Validate the connection."""
        from django.core.exceptions import ValidationError

        # Ensure both nodes belong to the same workflow
        if self.source_node.workflow_id != self.target_node.workflow_id:
            raise ValidationError(
                "Source and target nodes must belong to the same workflow."
            )

        # Ensure the connection workflow matches the nodes' workflow
        if self.workflow_id != self.source_node.workflow_id:
            raise ValidationError(
                "Connection workflow must match the nodes' workflow."
            )

    def save(self, *args, **kwargs) -> None:
        """Save the connection with validation."""
        self.full_clean()
        super().save(*args, **kwargs)