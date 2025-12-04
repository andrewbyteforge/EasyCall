# =============================================================================
# FILE: backend/apps/workflows/serializers.py
# =============================================================================
"""
Serializers for workflow models.
"""

import logging
from rest_framework import serializers
from apps.workflows.models import Workflow

logger = logging.getLogger(__name__)


class WorkflowListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for workflow list view.
    Excludes canvas_data to reduce payload size.
    """

    node_count = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            "uuid",
            "name",
            "description",
            "node_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]

    def get_node_count(self, obj: Workflow) -> int:
        """Get number of nodes in workflow."""
        return obj.get_node_count()


class WorkflowSerializer(serializers.ModelSerializer):
    """
    Full serializer for workflow detail view.
    Includes all fields and computed properties.
    """

    node_count = serializers.SerializerMethodField()
    connection_count = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            "uuid",
            "name",
            "description",
            "canvas_data",
            "node_count",
            "connection_count",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]

    def get_node_count(self, obj: Workflow) -> int:
        """Get number of nodes in workflow."""
        return obj.get_node_count()

    def get_connection_count(self, obj: Workflow) -> int:
        """Get number of connections in workflow."""
        return obj.get_connection_count()

    def validate_canvas_data(self, value):
        """
        Validate canvas_data is a valid dictionary.
        
        Args:
            value: The canvas_data value
            
        Returns:
            Validated dictionary
            
        Raises:
            ValidationError: If canvas_data is invalid
        """
        # If value is None or empty dict, set default structure
        if value is None or value == {}:
            return {
                "nodes": [],
                "edges": [],
                "viewport": {"x": 0, "y": 0, "zoom": 1}
            }
        
        # Ensure it's a dictionary
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "canvas_data must be a JSON object/dictionary"
            )
        
        # Validate required keys exist
        if "nodes" not in value:
            value["nodes"] = []
        if "edges" not in value:
            value["edges"] = []
        if "viewport" not in value:
            value["viewport"] = {"x": 0, "y": 0, "zoom": 1}
        
        # Validate nodes is a list
        if not isinstance(value["nodes"], list):
            raise serializers.ValidationError(
                "canvas_data.nodes must be an array"
            )
        
        # Validate edges is a list
        if not isinstance(value["edges"], list):
            raise serializers.ValidationError(
                "canvas_data.edges must be an array"
            )
        
        return value