# =============================================================================
# FILE: backend/apps/integrations/views.py
# =============================================================================
# API views for integration management.
# =============================================================================
"""
Views for managing API integrations and specifications.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from apps.integrations.models import OpenAPISpec
from apps.integrations.serializers import (
    OpenAPISpecListSerializer,
    OpenAPISpecSerializer,
    OpenAPISpecCreateSerializer,
    GeneratedNodesSerializer,
)
from apps.integrations.openapi_parser import OpenAPIParser, OpenAPIParseError
from apps.integrations.node_generator import NodeGenerator
from apps.providers.serializers import GeneratedNodeListSerializer

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# OPENAPI SPEC VIEWSET
# =============================================================================

class OpenAPISpecViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing OpenAPI specifications.
    
    Endpoints:
        GET    /api/v1/integrations/specs/           - List all specs
        POST   /api/v1/integrations/specs/           - Upload new spec
        GET    /api/v1/integrations/specs/{uuid}/    - Get spec detail
        PUT    /api/v1/integrations/specs/{uuid}/    - Update spec
        PATCH  /api/v1/integrations/specs/{uuid}/    - Partial update
        DELETE /api/v1/integrations/specs/{uuid}/    - Delete spec
        POST   /api/v1/integrations/specs/{uuid}/parse/     - Parse spec
        POST   /api/v1/integrations/specs/{uuid}/generate/  - Generate nodes
    """
    
    queryset = OpenAPISpec.objects.filter(is_active=True)
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    lookup_field = "uuid"
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return OpenAPISpecListSerializer
        elif self.action == "create":
            return OpenAPISpecCreateSerializer
        return OpenAPISpecSerializer
    
    # =========================================================================
    # CRUD OPERATIONS
    # =========================================================================
    
    def list(self, request, *args, **kwargs):
        """List all OpenAPI specifications."""
        logger.info("Listing OpenAPI specifications")
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """
        Upload and create new OpenAPI specification.
        
        Automatically triggers parsing after upload.
        """
        logger.info(f"Creating OpenAPI spec: {request.data.get('name')}")
        
        # Create the spec
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        spec = serializer.save()
        
        # Automatically parse the spec
        try:
            self._parse_spec(spec)
            logger.info(f"Successfully parsed spec {spec.uuid}")
        except Exception as e:
            logger.error(f"Failed to parse spec {spec.uuid}: {e}")
            spec.mark_parse_failed(str(e))
        
        # Return full spec data
        output_serializer = OpenAPISpecSerializer(spec, context={"request": request})
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get OpenAPI specification details."""
        spec = self.get_object()
        logger.info(f"Retrieving spec: {spec.name}")
        return super().retrieve(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update OpenAPI specification."""
        spec = self.get_object()
        logger.info(f"Updating spec: {spec.name}")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete OpenAPI specification."""
        spec = self.get_object()
        spec.soft_delete()
        logger.info(f"Soft deleted spec: {spec.name}")
        
        return Response(
            {"message": f"Specification '{spec.name}' deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
    
    # =========================================================================
    # CUSTOM ACTIONS
    # =========================================================================
    
    @action(detail=True, methods=["post"])
    def parse(self, request, uuid=None):
        """
        Parse an OpenAPI specification.
        
        POST /api/v1/integrations/specs/{uuid}/parse/
        
        Returns:
            Parsed specification data with endpoints.
        """
        spec = self.get_object()
        logger.info(f"Parsing spec: {spec.name}")
        
        try:
            self._parse_spec(spec)
            
            serializer = OpenAPISpecSerializer(spec, context={"request": request})
            return Response({
                "status": "success",
                "message": f"Successfully parsed {spec.get_endpoint_count()} endpoints",
                "spec": serializer.data,
            })
            
        except OpenAPIParseError as e:
            logger.error(f"Parse error for spec {spec.uuid}: {e}")
            spec.mark_parse_failed(str(e))
            
            return Response({
                "status": "error",
                "message": str(e),
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected error parsing spec {spec.uuid}: {e}")
            spec.mark_parse_failed(f"Unexpected error: {str(e)}")
            
            return Response({
                "status": "error",
                "message": "Failed to parse specification",
                "error": str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=["post"])
    def generate(self, request, uuid=None):
        """
        Generate workflow nodes from parsed specification.
        
        POST /api/v1/integrations/specs/{uuid}/generate/
        
        Saves generated nodes to the database and returns definitions.
        
        Returns:
            Generated node definitions.
        """
        spec = self.get_object()
        logger.info(f"Generating nodes for spec: {spec.name}")
        
        # Check if spec is parsed
        if not spec.is_parsed:
            return Response({
                "status": "error",
                "message": "Specification must be parsed before generating nodes",
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Import Provider models
            from apps.providers.models import Provider, GeneratedNode
            
            # Get category from request (default: query)
            category = request.data.get("category", "query")
            
            # Generate nodes
            generator = NodeGenerator()
            endpoints = spec.parsed_data.get("endpoints", [])
            
            nodes = generator.generate_nodes(
                endpoints=endpoints,
                provider=spec.provider,
                category=category
            )
            
            logger.info(f"Generated {len(nodes)} nodes for spec {spec.uuid}")
            
            # =====================================================================
            # Save nodes to database
            # =====================================================================
            
            # Get or create Provider
            provider_obj, created = Provider.objects.get_or_create(
                slug=spec.provider,
                defaults={
                    'name': spec.name,
                    'version': spec.version,
                    'base_url': '',  # Add base URL if available in spec
                    'description': f'Auto-generated from {spec.name}',
                    'status': 'active',
                }
            )
            
            if created:
                logger.info(f"Created new Provider: {provider_obj.slug}")
            
            # Save each generated node
            saved_count = 0
            for node_def in nodes:
                # Create or update the GeneratedNode
                node, node_created = GeneratedNode.objects.update_or_create(
                    node_type=node_def['type'],
                    defaults={
                        'provider': provider_obj,
                        'display_name': node_def.get('label', node_def['type']),
                        'category': node_def.get('category', 'query'),
                        'description': node_def.get('description', ''),
                        'input_pins': node_def.get('inputs', []),
                        'output_pins': node_def.get('outputs', []),
                        'configuration_fields': node_def.get('config', []),
                        'icon': node_def.get('icon', '🔌'),
                        'color': node_def.get('color', '#00897b'),
                        'metadata': {
                            'spec_uuid': str(spec.uuid),
                            'endpoint': node_def.get('endpoint', {}),
                        }
                    }
                )
                
                if node_created:
                    logger.info(f"Created node: {node.node_type}")
                    saved_count += 1
                else:
                    logger.info(f"Updated node: {node.node_type}")
            
            logger.info(f"Saved {saved_count} new nodes to database")
            
            # Return generated nodes
            output_serializer = GeneratedNodesSerializer({
                "nodes": nodes,
                "count": len(nodes),
                "provider": spec.provider,
            })
            
            return Response({
                "status": "success",
                "message": f"Successfully generated {len(nodes)} node definitions ({saved_count} new)",
                "data": output_serializer.data,
            })
            
        except Exception as e:
            logger.error(f"Failed to generate nodes for spec {spec.uuid}: {e}")
            return Response({
                "status": "error",
                "message": "Failed to generate nodes",
                "error": str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _parse_spec(self, spec: OpenAPISpec) -> None:
        """
        Parse an OpenAPI specification file.
        
        Args:
            spec: OpenAPISpec instance to parse.
            
        Raises:
            OpenAPIParseError: If parsing fails.
        """
        parser = OpenAPIParser()
        
        # Parse the file
        parsed_data = parser.parse_file(spec.spec_file.path)
        
        # Mark as parsed
        spec.mark_as_parsed(parsed_data)


# =============================================================================
# AVAILABLE NODES VIEWSET
# =============================================================================

class AvailableNodesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for fetching available workflow nodes.
    
    Endpoints:
        GET /api/v1/integrations/nodes/ - List all available nodes
        GET /api/v1/integrations/nodes/grouped_by_provider/ - Nodes grouped by provider
    """
    
    serializer_class = GeneratedNodeListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Get all nodes from active providers."""
        from apps.providers.models import GeneratedNode, Provider
        
        # Get active providers
        active_providers = Provider.objects.filter(status='active')
        
        # Get nodes for active providers
        queryset = GeneratedNode.objects.filter(
            provider__in=active_providers
        ).select_related('provider').order_by('category', 'display_name')
        
        # Optional: Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Optional: Filter by provider
        provider = self.request.query_params.get('provider', None)
        if provider:
            queryset = queryset.filter(provider__slug=provider)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def grouped_by_provider(self, request):
        """
        Get nodes grouped by provider.
        
        GET /api/v1/integrations/nodes/grouped_by_provider/
        
        Returns nodes organized by provider for the palette.
        """
        from apps.providers.models import Provider, GeneratedNode
        
        providers = Provider.objects.filter(status='active').prefetch_related('generated_nodes')
        
        result = []
        for provider in providers:
            nodes = provider.generated_nodes.all()
            
            if nodes.exists():
                result.append({
                    'provider': provider.slug,
                    'name': provider.name,
                    'icon': provider.icon_path,
                    'nodes': GeneratedNodeListSerializer(nodes, many=True).data
                })
        
        return Response(result)