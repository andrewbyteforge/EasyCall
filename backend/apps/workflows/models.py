# =============================================================================
# FILE: easycall/backend/apps/workflows/models.py
# =============================================================================
# Database models for workflow management.
# =============================================================================
"""
Workflow models for the EasyCall application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging

from django.db import models

from apps.core.models import BaseModel
from fields.constants import MAX_LENGTH_NAME, MAX_LENGTH_DESCRIPTION
from fields.names import (
    FIELD_WORKFLOW_NAME,
    FIELD_WORKFLOW_DESCRIPTION,
    FIELD_CANVAS_DATA,
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
    Represents a visual workflow with nodes and connections.
    
    A workflow is the top-level entity that contains:
    - Canvas data (nodes, edges, viewport)
    - Metadata (name, description)
    - Timestamps and soft-delete flag
    
    Attributes:
        name: Human-readable name for the workflow.
        description: Optional description of what the workflow does.
        canvas_data: JSON data containing React Flow canvas state.
    """
    
    name = models.CharField(
        verbose_name=get_verbose_name(FIELD_WORKFLOW_NAME),
        max_length=MAX_LENGTH_NAME,
        help_text="Name of the workflow (e.g., 'BTC Address Investigation')",
    )
    
    description = models.TextField(
        verbose_name=get_verbose_name(FIELD_WORKFLOW_DESCRIPTION),
        max_length=MAX_LENGTH_DESCRIPTION,
        blank=True,
        default="",
        help_text="Optional description of the workflow's purpose",
    )
    
    canvas_data = models.JSONField(
        verbose_name=get_verbose_name(FIELD_CANVAS_DATA),
        default=dict,
        help_text="JSON data containing nodes, edges, and viewport state",
    )
    
    class Meta:
        db_table = "workflows"
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["is_active", "-updated_at"]),
        ]
    
    def __str__(self) -> str:
        """String representation of the workflow."""
        return f"{self.name} ({self.uuid})"
    
    def get_node_count(self) -> int:
        """
        Get the number of nodes in this workflow.
        
        Returns:
            Number of nodes in canvas_data.
        """
        # Defensive: Handle None, string, or non-dict canvas_data
        if not self.canvas_data:
            return 0
        
        # If canvas_data is a string, try to parse it
        if isinstance(self.canvas_data, str):
            try:
                import json
                canvas_dict = json.loads(self.canvas_data)
            except (json.JSONDecodeError, TypeError):
                return 0
        elif isinstance(self.canvas_data, dict):
            canvas_dict = self.canvas_data
        else:
            return 0
        
        nodes = canvas_dict.get("nodes", [])
        return len(nodes) if isinstance(nodes, list) else 0


    def get_connection_count(self) -> int:
        """
        Get the number of connections in this workflow.
        
        Returns:
            Number of edges in canvas_data.
        """
        # Defensive: Handle None, string, or non-dict canvas_data
        if not self.canvas_data:
            return 0
        
        # If canvas_data is a string, try to parse it
        if isinstance(self.canvas_data, str):
            try:
                import json
                canvas_dict = json.loads(self.canvas_data)
            except (json.JSONDecodeError, TypeError):
                return 0
        elif isinstance(self.canvas_data, dict):
            canvas_dict = self.canvas_data
        else:
            return 0
        
        edges = canvas_dict.get("edges", [])
        return len(edges) if isinstance(edges, list) else 0
    
    
    
    
    
    def to_dict(self) -> dict:
        """
        Convert workflow to dictionary.
        
        Returns:
            Dictionary representation including metadata.
        """
        base_dict = super().to_dict()
        base_dict.update({
            "name": self.name,
            "description": self.description,
            "canvas_data": self.canvas_data,
            "node_count": self.get_node_count(),
            "connection_count": self.get_connection_count(),
        })
        return base_dict