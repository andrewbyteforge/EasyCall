# =============================================================================
# FILE: easycall/backend/apps/providers/views.py
# =============================================================================
# REST API views for provider management.
# =============================================================================
"""
API views for the providers application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Any, Dict

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from apps.providers.models import Provider, APIEndpoint, GeneratedNode
from apps.providers.serializers import (
    ProviderListSerializer,
    ProviderDetailSerializer,
    ProviderCreateSerializer,
    APIEndpointListSerializer,
    APIEndpointDetailSerializer,
    GeneratedNodeListSerializer,
    GeneratedNodeDetailSerializer,
    ProviderImpactAnalysisSerializer,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# PROVIDER VIEWSET
# =============================================================================


class ProviderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing API providers.
    
    Provides CRUD operations for providers plus additional actions:
    - Activate/deprecate/deactivate lifecycle management
    - Impact analysis for safe deletion
    - OpenAPI spec upload
    - Node generation
    
    Endpoints:
        GET    /api/v1/providers/              - List all providers
        POST   /api/v1/providers/              - Create new provider
        GET    /api/v1/providers/{uuid}/       - Get provider detail
        PUT    /api/v1/providers/{uuid}/       - Update provider
        PATCH  /api/v1/providers/{uuid}/       - Partial update
        DELETE /api/v1/providers/{uuid}/       - Delete provider
        POST   /api/v1/providers/{uuid}/activate/     - Activate provider
        POST   /api/v1/providers/{uuid}/deprecate/    - Deprecate provider
        POST   /api/v1/providers/{uuid}/deactivate/   - Deactivate provider
        GET    /api/v1/providers/{uuid}/impact/       - Impact analysis
    """
    
    queryset = Provider.objects.all()
    permission_classes = [AllowAny]
    lookup_field = 'uuid'
    
    # -------------------------------------------------------------------------
    # Serializer Selection
    # -------------------------------------------------------------------------
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        
        Returns:
            Serializer class for the current action.
        """
        if self.action == 'list':
            return ProviderListSerializer
        elif self.action == 'create':
            return ProviderCreateSerializer
        else:
            return ProviderDetailSerializer
    
    # -------------------------------------------------------------------------
    # Query Filtering
    # -------------------------------------------------------------------------
    
    def get_queryset(self):
        """
        Optionally filter providers by status.
        
        Query parameters:
            status: Filter by status (active, deprecated, inactive)
            auth_type: Filter by authentication type
        
        Returns:
            Filtered queryset.
        """
        queryset = Provider.objects.all()
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by auth type
        auth_type = self.request.query_params.get('auth_type', None)
        if auth_type:
            queryset = queryset.filter(auth_type=auth_type)
        
        return queryset
    
    # -------------------------------------------------------------------------
    # CRUD Operations
    # -------------------------------------------------------------------------
    
    def create(self, request: Request, *args, **kwargs) -> Response:
        """
        Create a new provider.
        
        Args:
            request: HTTP request with provider data.
            
        Returns:
            Response with created provider data.
        """
        logger.info("Creating new provider")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detail serializer for response
        detail_serializer = ProviderDetailSerializer(serializer.instance)
        headers = self.get_success_headers(detail_serializer.data)
        
        logger.info(f"Provider created: {serializer.instance.name}")
        return Response(
            detail_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        Delete a provider with safety checks.
        
        Args:
            request: HTTP request.
            
        Returns:
            Response confirming deletion or error.
        """
        instance = self.get_object()
        
        logger.warning(f"Delete requested for provider: {instance.name}")
        
        # Check if provider has endpoints or nodes
        endpoint_count = instance.endpoint_count
        node_count = instance.node_count
        
        if endpoint_count > 0 or node_count > 0:
            logger.warning(
                f"Provider {instance.name} has {endpoint_count} endpoints "
                f"and {node_count} nodes"
            )
            return Response(
                {
                    'error': 'Cannot delete provider with existing endpoints or nodes',
                    'detail': f'Provider has {endpoint_count} endpoints and {node_count} nodes. '
                              'Consider deprecating instead of deleting.',
                    'endpoint_count': endpoint_count,
                    'node_count': node_count,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_destroy(instance)
        logger.info(f"Provider deleted: {instance.name}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # -------------------------------------------------------------------------
    # Lifecycle Actions
    # -------------------------------------------------------------------------
    
    @action(detail=True, methods=['post'])
    def activate(self, request: Request, uuid=None) -> Response:
        """
        Activate a provider.
        
        Args:
            request: HTTP request.
            uuid: Provider UUID.
            
        Returns:
            Response with updated provider data.
        """
        provider = self.get_object()
        
        logger.info(f"Activating provider: {provider.name}")
        provider.activate()
        
        serializer = ProviderDetailSerializer(provider)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deprecate(self, request: Request, uuid=None) -> Response:
        """
        Deprecate a provider.
        
        Args:
            request: HTTP request.
            uuid: Provider UUID.
            
        Returns:
            Response with updated provider data.
        """
        provider = self.get_object()
        
        logger.info(f"Deprecating provider: {provider.name}")
        provider.deprecate()
        
        serializer = ProviderDetailSerializer(provider)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request: Request, uuid=None) -> Response:
        """
        Deactivate a provider.
        
        Args:
            request: HTTP request.
            uuid: Provider UUID.
            
        Returns:
            Response with updated provider data.
        """
        provider = self.get_object()
        
        logger.warning(f"Deactivating provider: {provider.name}")
        provider.deactivate()
        
        serializer = ProviderDetailSerializer(provider)
        return Response(serializer.data)
    
    # -------------------------------------------------------------------------
    # Impact Analysis
    # -------------------------------------------------------------------------
    
    @action(detail=True, methods=['get'])
    def impact(self, request: Request, uuid=None) -> Response:
        """
        Analyze impact of removing this provider.
        
        Returns information about workflows and nodes that would be affected.
        
        Args:
            request: HTTP request.
            uuid: Provider UUID.
            
        Returns:
            Response with impact analysis data.
        """
        provider = self.get_object()
        
        logger.info(f"Analyzing impact for provider: {provider.name}")
        
        # Get counts
        endpoint_count = provider.endpoint_count
        node_count = provider.node_count
        
        # Determine if safe to delete
        can_delete = endpoint_count == 0 and node_count == 0
        
        # Build warning message
        if not can_delete:
            warning_message = (
                f"Provider has {endpoint_count} endpoints and {node_count} nodes. "
                "Deletion will cascade to all related records."
            )
        else:
            warning_message = None
        
        # Prepare response
        analysis_data = {
            'provider_uuid': str(provider.uuid),
            'provider_name': provider.name,
            'can_delete': can_delete,
            'warning_message': warning_message,
            'affected_workflows': [],  # TODO: Implement workflow dependency check
            'endpoint_count': endpoint_count,
            'node_count': node_count,
        }
        
        serializer = ProviderImpactAnalysisSerializer(analysis_data)
        return Response(serializer.data)


# =============================================================================
# API ENDPOINT VIEWSET
# =============================================================================


class APIEndpointViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing API endpoints.
    
    Endpoints are read-only as they're auto-generated from OpenAPI specs.
    
    Endpoints:
        GET    /api/v1/endpoints/              - List all endpoints
        GET    /api/v1/endpoints/{uuid}/       - Get endpoint detail
    """
    
    queryset = APIEndpoint.objects.all()
    permission_classes = [AllowAny]
    lookup_field = 'uuid'
    
    # -------------------------------------------------------------------------
    # Serializer Selection
    # -------------------------------------------------------------------------
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        
        Returns:
            Serializer class for the current action.
        """
        if self.action == 'list':
            return APIEndpointListSerializer
        else:
            return APIEndpointDetailSerializer
    
    # -------------------------------------------------------------------------
    # Query Filtering
    # -------------------------------------------------------------------------
    
    def get_queryset(self):
        """
        Optionally filter endpoints by provider or method.
        
        Query parameters:
            provider: Filter by provider UUID
            method: Filter by HTTP method
            requires_auth: Filter by authentication requirement
        
        Returns:
            Filtered queryset.
        """
        queryset = APIEndpoint.objects.select_related('provider')
        
        # Filter by provider
        provider_uuid = self.request.query_params.get('provider', None)
        if provider_uuid:
            queryset = queryset.filter(provider__uuid=provider_uuid)
        
        # Filter by method
        method = self.request.query_params.get('method', None)
        if method:
            queryset = queryset.filter(method=method.upper())
        
        # Filter by auth requirement
        requires_auth = self.request.query_params.get('requires_auth', None)
        if requires_auth is not None:
            requires_auth_bool = requires_auth.lower() in ('true', '1', 'yes')
            queryset = queryset.filter(requires_auth=requires_auth_bool)
        
        return queryset


# =============================================================================
# GENERATED NODE VIEWSET
# =============================================================================


class GeneratedNodeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing generated workflow nodes.
    
    Nodes are read-only as they're auto-generated from API endpoints.
    
    Endpoints:
        GET    /api/v1/nodes/              - List all nodes
        GET    /api/v1/nodes/{uuid}/       - Get node detail
    """
    
    queryset = GeneratedNode.objects.all()
    permission_classes = [AllowAny]
    lookup_field = 'uuid'
    
    # -------------------------------------------------------------------------
    # Serializer Selection
    # -------------------------------------------------------------------------
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        
        Returns:
            Serializer class for the current action.
        """
        if self.action == 'list':
            return GeneratedNodeListSerializer
        else:
            return GeneratedNodeDetailSerializer
    
    # -------------------------------------------------------------------------
    # Query Filtering
    # -------------------------------------------------------------------------
    
    def get_queryset(self):
        """
        Optionally filter nodes by provider or category.
        
        Query parameters:
            provider: Filter by provider UUID
            category: Filter by node category
        
        Returns:
            Filtered queryset.
        """
        queryset = GeneratedNode.objects.select_related('provider', 'endpoint')
        
        # Filter by provider
        provider_uuid = self.request.query_params.get('provider', None)
        if provider_uuid:
            queryset = queryset.filter(provider__uuid=provider_uuid)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset