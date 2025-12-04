# =============================================================================
# FILE: easycall/backend/apps/workflows/serializers.py
# =============================================================================
# DRF serializers for workflow models.
# =============================================================================
"""
Serializers for the workflows application.
"""

from rest_framework import serializers
from apps.workflows.models import Workflow


class WorkflowSerializer(serializers.ModelSerializer):
    """Serializer for Workflow model."""
    
    node_count = serializers.IntegerField(read_only=True)
    connection_count = serializers.IntegerField(read_only=True)
    
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
    
    def to_representation(self, instance):
        """Add computed fields to response."""
        data = super().to_representation(instance)
        data["node_count"] = instance.get_node_count()
        data["connection_count"] = instance.get_connection_count()
        return data


class WorkflowListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for workflow lists."""
    
    node_count = serializers.IntegerField(read_only=True)
    
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
    
    def to_representation(self, instance):
        """Add node count."""
        data = super().to_representation(instance)
        data["node_count"] = instance.get_node_count()
        return data