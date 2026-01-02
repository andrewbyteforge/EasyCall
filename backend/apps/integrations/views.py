# =============================================================================
# FILE: backend/apps/integrations/views.py
# =============================================================================
# API views for integration management.
# Handles OpenAPI spec upload, parsing, and node generation.
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
from django.db import transaction

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
        
        try:
            # Create the spec
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            spec = serializer.save()
            
            logger.info(f"✅ Created spec {spec.uuid}: {spec.name}")
            
            # Automatically parse the spec
            try:
                self._parse_spec(spec)
                logger.info(f"✅ Successfully parsed spec {spec.uuid}")
            except Exception as e:
                logger.error(f"❌ Failed to parse spec {spec.uuid}: {e}", exc_info=True)
                spec.mark_parse_failed(str(e))
            
            # Return full spec data
            output_serializer = OpenAPISpecSerializer(spec, context={"request": request})
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Failed to create spec: {e}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        
        try:
            spec.soft_delete()
            logger.info(f"✅ Soft deleted spec: {spec.name}")
            
            return Response(
                {"message": f"Specification '{spec.name}' deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            logger.error(f"Error deleting spec {spec.uuid}: {e}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
            logger.error(f"Unexpected error parsing spec {spec.uuid}: {e}", exc_info=True)
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
        
        Creates:
        - Configuration node (for API credentials)
        - Query nodes (one per endpoint)
        
        Saves generated nodes to the database.
        
        Returns:
            Generated node definitions.
        """
        spec = self.get_object()
        logger.info(f"Generating nodes for spec: {spec.name}")
        
        # =====================================================================
        # Validate Spec is Parsed
        # =====================================================================
        
        if not spec.is_parsed:
            logger.warning(f"Spec {spec.uuid} not parsed yet")
            return Response({
                "status": "error",
                "message": "Specification must be parsed before generating nodes",
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not spec.parsed_data:
            logger.error(f"Spec {spec.uuid} marked as parsed but has no parsed_data")
            return Response({
                "status": "error",
                "message": "Specification has no parsed data",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            # =================================================================
            # Import Provider Models
            # =================================================================
            
            from apps.providers.models import Provider, GeneratedNode
            
            # =================================================================
            # Extract Parsed Data
            # =================================================================
            
            parsed_data = spec.parsed_data
            endpoints = parsed_data.get("endpoints", [])
            security_schemes = parsed_data.get("security_schemes", {})
            servers = parsed_data.get("servers", [])
            
            # Extract base URL from servers
            base_url = servers[0].get("url", "") if servers else ""
            
            logger.info(
                f"Parsed data: {len(endpoints)} endpoints, "
                f"{len(security_schemes)} security schemes, "
                f"base_url: {base_url}"
            )
            
            # Get category from request (default: query)
            category = request.data.get("category", "query")
            
            # =================================================================
            # Generate Nodes (Config + Query Nodes)
            # =================================================================
            
            generator = NodeGenerator()
            
            nodes = generator.generate_nodes(
                endpoints=endpoints,
                provider_name=spec.provider,
                category=category,
                security_schemes=security_schemes,
                base_url=base_url
            )
            
            logger.info(f"✅ Generated {len(nodes)} nodes for spec {spec.uuid}")
            
            # =================================================================
            # Save Nodes to Database
            # =================================================================
            
            saved_count, updated_count = self._save_nodes_to_database(
                spec=spec,
                nodes=nodes
            )
            
            logger.info(
                f"✅ Database save complete: {saved_count} new, {updated_count} updated"
            )
            
            # =================================================================
            # Return Response
            # =================================================================
            
            output_serializer = GeneratedNodesSerializer({
                "nodes": nodes,
                "count": len(nodes),
                "provider": spec.provider,
            })
            
            return Response({
                "status": "success",
                "message": (
                    f"Successfully generated {len(nodes)} node definitions "
                    f"({saved_count} new, {updated_count} updated)"
                ),
                "data": output_serializer.data,
            })
            
        except Exception as e:
            logger.error(
                f"Failed to generate nodes for spec {spec.uuid}: {e}",
                exc_info=True
            )
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
        try:
            parser = OpenAPIParser()
            
            # Parse the file
            parsed_data = parser.parse_file(spec.spec_file.path)
            
            logger.debug(f"Parsed data keys: {parsed_data.keys()}")
            
            # Mark as parsed and save data
            spec.mark_as_parsed(parsed_data)
            
            logger.info(
                f"✅ Marked spec {spec.uuid} as parsed with "
                f"{len(parsed_data.get('endpoints', []))} endpoints"
            )
            
        except Exception as e:
            logger.error(f"Error in _parse_spec: {e}", exc_info=True)
            raise
    
    def _save_nodes_to_database(
        self,
        spec: OpenAPISpec,
        nodes: list
    ) -> tuple:
        """
        Save generated nodes to database.
        
        Args:
            spec: OpenAPISpec instance.
            nodes: List of node definitions.
            
        Returns:
            Tuple of (created_count, updated_count).
            
        Raises:
            Exception: If database operations fail.
        """
        from apps.providers.models import Provider, GeneratedNode
        
        created_count = 0
        updated_count = 0
        
        try:
            with transaction.atomic():
                # =============================================================
                # Get or Create Provider
                # =============================================================
                
                provider_obj, provider_created = Provider.objects.get_or_create(
                    slug=spec.provider,
                    defaults={
                        'name': spec.name,
                        'version': spec.version,
                        'base_url': '',
                        'description': f'Auto-generated from {spec.name}',
                        'status': 'active',
                    }
                )
                
                if provider_created:
                    logger.info(f"✅ Created new Provider: {provider_obj.slug}")
                else:
                    logger.debug(f"Using existing Provider: {provider_obj.slug}")
                
                # =============================================================
                # Save Each Node
                # =============================================================
                
                for node_def in nodes:
                    try:
                        # Extract visual properties
                        visual = node_def.get('visual', {})
                        
                        # Create or update the GeneratedNode
                        node, node_created = GeneratedNode.objects.update_or_create(
                            node_type=node_def['type'],
                            defaults={
                                'provider': provider_obj,
                                'display_name': node_def.get('name', node_def['type']),
                                'category': node_def.get('category', 'query'),
                                'description': node_def.get('description', ''),
                                'input_pins': node_def.get('inputs', []),
                                'output_pins': node_def.get('outputs', []),
                                'configuration_fields': node_def.get('config', []),
                                'icon': visual.get('icon', '🔌'),
                                'color': visual.get('color', '#00897b'),
                                'metadata': {
                                    'spec_uuid': str(spec.uuid),
                                    'endpoint': node_def.get('endpoint', {}),
                                },
                                'is_active': True,
                            }
                        )
                        
                        if node_created:
                            created_count += 1
                            logger.debug(f"✅ Created node: {node.node_type}")
                        else:
                            updated_count += 1
                            logger.debug(f"🔄 Updated node: {node.node_type}")
                        
                    except Exception as e:
                        logger.error(
                            f"Failed to save node {node_def.get('type')}: {e}",
                            exc_info=True
                        )
                        # Continue with other nodes
                        continue
            
            return created_count, updated_count
            
        except Exception as e:
            logger.error(f"Database transaction failed: {e}", exc_info=True)
            raise


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
            provider__in=active_providers,
            is_active=True
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
        
        Returns:
        - Configuration nodes in a special "Configuration" group
        - Query nodes grouped by provider
        """
        from apps.providers.models import Provider, GeneratedNode
        
        try:
            # =====================================================================
            # Get All Active Nodes
            # =====================================================================
            
            all_nodes = GeneratedNode.objects.filter(
                is_active=True,
                provider__status='active'
            ).select_related('provider')
            
            # =====================================================================
            # Separate Config Nodes from Query Nodes
            # =====================================================================
            
            config_nodes = all_nodes.filter(category='config')
            query_nodes = all_nodes.exclude(category='config')
            
            logger.debug(
                f"Found {config_nodes.count()} config nodes, "
                f"{query_nodes.count()} query nodes"
            )
            
            result = []
            
            # =====================================================================
            # 1. Add Configuration Group (All Config Nodes)
            # =====================================================================
            
            if config_nodes.exists():
                result.append({
                    'provider': 'configuration',  # Special provider identifier
                    'name': 'Configuration',
                    'icon': '🔑',
                    'nodes': GeneratedNodeListSerializer(
                        config_nodes.order_by('display_name'),
                        many=True
                    ).data
                })
                logger.debug(f"Added Configuration group with {config_nodes.count()} nodes")
            
            # =====================================================================
            # 2. Add Provider Groups (Query Nodes Only)
            # =====================================================================
            
            providers = Provider.objects.filter(
                status='active'
            ).prefetch_related('generated_nodes')
            
            for provider in providers:
                # Get only query nodes for this provider
                provider_query_nodes = query_nodes.filter(provider=provider)
                
                if provider_query_nodes.exists():
                    result.append({
                        'provider': provider.slug,
                        'name': provider.name,
                        'icon': provider.icon_path or '🔌',
                        'nodes': GeneratedNodeListSerializer(
                            provider_query_nodes.order_by('display_name'),
                            many=True
                        ).data
                    })
                    logger.debug(
                        f"Added {provider.name} group with "
                        f"{provider_query_nodes.count()} query nodes"
                    )
            
            logger.info(f"Returning {len(result)} groups with nodes")
            return Response(result)
            
        except Exception as e:
            logger.error(f"Error in grouped_by_provider: {e}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )