# =============================================================================
# FILE: backend/apps/integrations/node_generator.py
# =============================================================================
# Generate workflow node definitions from parsed OpenAPI endpoints.
# Creates both configuration nodes (for credentials) and query nodes.
# =============================================================================
"""
Node generator for creating workflow nodes from API endpoints.

This module takes parsed OpenAPI endpoint data and generates node
type definitions that can be used in the workflow canvas. It automatically
creates configuration nodes for API credentials and query nodes for each
endpoint.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Dict, Any, List, Optional

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# NODE GENERATOR
# =============================================================================

class NodeGenerator:
    """
    Generates workflow node definitions from API endpoints.
    
    Takes parsed OpenAPI endpoint data and creates node type definitions
    compatible with the workflow system. Automatically generates:
    - Configuration nodes (for storing API credentials)
    - Query nodes (one per endpoint)
    
    Example:
        generator = NodeGenerator()
        nodes = generator.generate_nodes(
            endpoints=parsed_endpoints,
            provider_name="coingecko",
            security_schemes=security_schemes,
            base_url="https://api.coingecko.com/api/v3"
        )
    """
    
    # =========================================================================
    # NODE TYPE MAPPING
    # =========================================================================
    
    # Map OpenAPI types to workflow data types
    TYPE_MAPPING = {
        "string": "STRING",
        "integer": "NUMBER",
        "number": "NUMBER",
        "boolean": "BOOLEAN",
        "array": "ADDRESS_LIST",  # Default for arrays
        "object": "JSON_DATA",
    }
    
    # =========================================================================
    # PUBLIC METHODS
    # =========================================================================
    
    def generate_nodes(
        self,
        endpoints: List[Dict[str, Any]],
        provider_name: str,
        category: str = "query",
        security_schemes: Optional[Dict[str, Any]] = None,
        base_url: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate node definitions from endpoints.
        
        Creates a configuration node first (if security schemes exist),
        then generates query nodes for each endpoint.
        
        Args:
            endpoints: List of parsed endpoint dictionaries.
            provider_name: Provider identifier (e.g., 'coingecko', 'etherscan').
            category: Default node category (default: 'query').
            security_schemes: OpenAPI securitySchemes for auth configuration.
            base_url: API base URL from servers section.
            
        Returns:
            List of node type definitions (config node + query nodes).
            
        Raises:
            Exception: If node generation fails (logged and re-raised).
        """
        logger.info(f"Generating nodes for {len(endpoints)} endpoints from {provider_name}")
        
        nodes = []
        
        try:
            # =====================================================================
            # STEP 1: Generate Configuration Node (if auth required)
            # =====================================================================
            
            if security_schemes or base_url:
                try:
                    config_node = self._generate_config_node(
                        provider_name=provider_name,
                        security_schemes=security_schemes or {},
                        base_url=base_url or ''
                    )
                    nodes.append(config_node)
                    logger.info(f"✅ Generated config node: {config_node['type']}")
                    
                except Exception as e:
                    logger.error(
                        f"Failed to generate config node for {provider_name}: {e}",
                        exc_info=True
                    )
                    # Continue without config node - query nodes will still be created
            else:
                logger.warning(
                    f"No security schemes or base URL provided for {provider_name}. "
                    "Config node not generated."
                )
            
            # =====================================================================
            # STEP 2: Generate Query Nodes (one per endpoint)
            # =====================================================================
            
            successful_nodes = 0
            failed_nodes = 0
            
            for idx, endpoint in enumerate(endpoints, 1):
                try:
                    node = self._generate_node_from_endpoint(
                        endpoint=endpoint,
                        provider_name=provider_name,
                        category=category
                    )
                    nodes.append(node)
                    successful_nodes += 1
                    logger.debug(f"Generated node {idx}/{len(endpoints)}: {node['type']}")
                    
                except Exception as e:
                    failed_nodes += 1
                    endpoint_path = endpoint.get('path', 'unknown')
                    endpoint_method = endpoint.get('method', 'unknown')
                    logger.error(
                        f"Failed to generate node for {endpoint_method} {endpoint_path}: {e}",
                        exc_info=True
                    )
                    continue
            
            # =====================================================================
            # STEP 3: Log Summary
            # =====================================================================
            
            logger.info(
                f"✅ Successfully generated {len(nodes)} total nodes "
                f"({successful_nodes} query nodes + {1 if security_schemes or base_url else 0} config node)"
            )
            
            if failed_nodes > 0:
                logger.warning(f"⚠️  Failed to generate {failed_nodes} nodes")
            
            return nodes
            
        except Exception as e:
            logger.error(f"Critical error in node generation for {provider_name}: {e}", exc_info=True)
            raise
    
    # =========================================================================
    # PRIVATE METHODS - CONFIG NODE GENERATION
    # =========================================================================
    
    def _generate_config_node(
        self,
        provider_name: str,
        security_schemes: Dict[str, Any],
        base_url: str
    ) -> Dict[str, Any]:
        """
        Generate a configuration node for provider credentials.
        
        Analyzes the OpenAPI securitySchemes to determine authentication
        method and creates appropriate configuration fields.
        
        Args:
            provider_name: Provider identifier (e.g., 'coingecko').
            security_schemes: OpenAPI securitySchemes object.
            base_url: API base URL.
            
        Returns:
            Configuration node definition dictionary.
            
        Raises:
            ValueError: If provider_name is empty.
        """
        if not provider_name:
            raise ValueError("provider_name cannot be empty")
        
        logger.debug(f"Generating config node for {provider_name}")
        
        # =====================================================================
        # Determine Authentication Method
        # =====================================================================
        
        auth_type = "api_key"  # Default
        auth_location = "header"
        auth_field_name = "api_key"
        auth_description = f"{provider_name.title()} API key"
        
        if security_schemes:
            try:
                # Get first security scheme
                scheme_name = list(security_schemes.keys())[0]
                scheme = security_schemes[scheme_name]
                
                logger.debug(f"Security scheme '{scheme_name}': {scheme}")
                
                # API Key authentication
                if scheme.get('type') == 'apiKey':
                    auth_location = scheme.get('in', 'header')  # header or query
                    auth_field_name = scheme.get('name', 'api_key')
                    auth_description = f"API key (sent as {auth_location} '{auth_field_name}')"
                
                # Bearer token authentication
                elif scheme.get('type') == 'http' and scheme.get('scheme') == 'bearer':
                    auth_type = "bearer_token"
                    auth_field_name = "token"
                    auth_description = "Bearer token for authentication"
                
                logger.debug(
                    f"Auth config: type={auth_type}, location={auth_location}, "
                    f"field={auth_field_name}"
                )
                
            except Exception as e:
                logger.warning(
                    f"Error parsing security scheme for {provider_name}: {e}. "
                    "Using default API key configuration."
                )
        
        # =====================================================================
        # Build Configuration Node
        # =====================================================================
        
        node_type = f"{provider_name}_config"
        display_name = f"{provider_name.replace('_', ' ').title()} Configuration"
        
        config_node = {
            'type': node_type,
            'name': display_name,
            'category': 'config',
            'provider': provider_name,
            'description': f"Configuration and authentication for {provider_name.replace('_', ' ').title()} API",
            
            # Config nodes have no inputs
            'inputs': [],
            
            # Config nodes output credentials
            'outputs': [
                {
                    'id': 'credentials',
                    'label': 'API Credentials',
                    'type': 'CREDENTIALS',
                    'description': f'Authenticated credentials for {provider_name.replace("_", " ").title()} API'
                }
            ],
            
            # Configuration fields (what user enters)
            'config': [
                {
                    'id': 'api_key',
                    'label': 'API Key',
                    'type': 'string',
                    'required': True,
                    'sensitive': True,
                    'description': auth_description,
                    'placeholder': 'Enter your API key',
                },
                {
                    'id': 'base_url',
                    'label': 'Base URL',
                    'type': 'string',
                    'required': True,
                    'default': base_url,
                    'description': 'API base URL (usually no need to change)',
                }
            ],
            
            # Visual styling (purple for config nodes)
            'visual': {
                'icon': '🔑',
                'color': '#9c27b0',
                'width': 220,
                'height': 'auto'
            },
            
            # Metadata
            'metadata': {
                'auth_type': auth_type,
                'auth_location': auth_location,
                'auth_field_name': auth_field_name,
            }
        }
        
        logger.debug(f"Config node created: {node_type}")
        return config_node
    
    # =========================================================================
    # PRIVATE METHODS - QUERY NODE GENERATION
    # =========================================================================
    
    def _generate_node_from_endpoint(
        self,
        endpoint: Dict[str, Any],
        provider_name: str,
        category: str
    ) -> Dict[str, Any]:
        """
        Generate a single query node definition from an endpoint.
        
        Args:
            endpoint: Parsed endpoint dictionary.
            provider_name: Provider identifier.
            category: Node category (e.g., 'query').
            
        Returns:
            Query node type definition dictionary.
            
        Raises:
            ValueError: If endpoint is missing required fields.
        """
        # Validate endpoint
        if not endpoint.get('path'):
            raise ValueError("Endpoint missing 'path' field")
        if not endpoint.get('method'):
            raise ValueError("Endpoint missing 'method' field")
        
        logger.debug(f"Generating node for {endpoint['method']} {endpoint['path']}")
        
        try:
            # Generate identifiers
            node_type = self._generate_node_type(endpoint, provider_name)
            node_name = self._generate_node_name(endpoint)
            
            # Extract node components
            inputs = self._extract_node_inputs(endpoint)
            outputs = self._extract_node_outputs(endpoint)
            config_fields = self._extract_config_fields(endpoint)
            
            return {
                "type": node_type,
                "name": node_name,
                "category": category,
                "provider": provider_name,
                "description": endpoint.get("description") or endpoint.get("summary", ""),
                "endpoint": {
                    "path": endpoint["path"],
                    "method": endpoint["method"],
                    "operation_id": endpoint.get("operation_id"),
                },
                "inputs": inputs,
                "outputs": outputs,
                "config": config_fields,
            }
            
        except Exception as e:
            logger.error(
                f"Error building node from endpoint {endpoint.get('path')}: {e}",
                exc_info=True
            )
            raise
    
    def _generate_node_type(self, endpoint: Dict[str, Any], provider_name: str) -> str:
        """
        Generate a unique node type identifier.
        
        Args:
            endpoint: Endpoint data.
            provider_name: Provider identifier.
            
        Returns:
            Node type string (e.g., "coingecko_simple_price").
        """
        try:
            # Use operation_id if available
            operation_id = endpoint.get("operation_id")
            
            if operation_id:
                # Clean operation ID
                node_type = operation_id.lower().replace(" ", "_").replace("-", "_")
            else:
                # Generate from method and path
                method = endpoint["method"].lower()
                path = endpoint["path"].replace("/", "_").replace("{", "").replace("}", "")
                path = path.strip("_")
                node_type = f"{method}{path}" if path else method
            
            # Remove multiple underscores
            node_type = "_".join(filter(None, node_type.split("_")))
            
            # Add provider prefix
            return f"{provider_name}_{node_type}"
            
        except Exception as e:
            logger.warning(f"Error generating node type, using fallback: {e}")
            # Fallback to simple naming
            return f"{provider_name}_endpoint_{hash(endpoint['path']) % 10000}"
    
    def _generate_node_name(self, endpoint: Dict[str, Any]) -> str:
        """
        Generate a human-readable node name.
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            Node display name string.
        """
        try:
            # Priority 1: Use summary if available
            if endpoint.get("summary"):
                return endpoint["summary"]
            
            # Priority 2: Use operation_id and clean it
            if endpoint.get("operation_id"):
                name = endpoint["operation_id"]
                # Convert camelCase or snake_case to Title Case
                name = name.replace("_", " ").replace("-", " ")
                return " ".join(word.capitalize() for word in name.split())
            
            # Priority 3: Generate from path
            path = endpoint["path"].replace("/", " ").replace("{", "").replace("}", "")
            return f"{endpoint['method'].upper()} {path.strip().title()}"
            
        except Exception as e:
            logger.warning(f"Error generating node name, using fallback: {e}")
            return f"API Call: {endpoint.get('path', 'Unknown')}"
    
    # =========================================================================
    # PRIVATE METHODS - INPUT/OUTPUT EXTRACTION
    # =========================================================================
    
    def _extract_node_inputs(self, endpoint: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract node inputs from endpoint parameters.
        
        Creates input pins for:
        - Credentials (always first)
        - Path parameters
        - Query parameters
        - Request body fields
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            List of input pin definitions.
        """
        inputs = []
        
        try:
            # =====================================================================
            # ALWAYS ADD CREDENTIALS INPUT FIRST
            # =====================================================================
            
            inputs.append({
                "id": "credentials",
                "label": "API Credentials",
                "type": "CREDENTIALS",
                "required": True,
            })
            
            # =====================================================================
            # EXTRACT FROM PARAMETERS
            # =====================================================================
            
            for param in endpoint.get("parameters", []):
                try:
                    # Skip header/cookie parameters (handled by credentials)
                    if param.get("in") in ["header", "cookie"]:
                        continue
                    
                    # Map parameter type
                    param_schema = param.get("schema", {})
                    param_type = self._map_openapi_type(param_schema.get("type", "string"))
                    
                    # Special handling for address parameters
                    param_name = param.get("name", "")
                    if "address" in param_name.lower():
                        param_type = "ADDRESS"
                    
                    inputs.append({
                        "id": param_name,
                        "label": param_name.replace("_", " ").title(),
                        "type": param_type,
                        "required": param.get("required", False),
                        "description": param.get("description", ""),
                    })
                    
                except Exception as e:
                    logger.warning(f"Error extracting parameter {param.get('name')}: {e}")
                    continue
            
            # =====================================================================
            # EXTRACT FROM REQUEST BODY
            # =====================================================================
            
            request_body = endpoint.get("request_body")
            if request_body:
                try:
                    schema = request_body.get("schema", {})
                    properties = schema.get("properties", {})
                    required_fields = schema.get("required", [])
                    
                    for prop_name, prop_schema in properties.items():
                        try:
                            prop_type = self._map_openapi_type(prop_schema.get("type", "string"))
                            
                            # Special handling for address fields
                            if "address" in prop_name.lower():
                                prop_type = "ADDRESS"
                            
                            inputs.append({
                                "id": prop_name,
                                "label": prop_name.replace("_", " ").title(),
                                "type": prop_type,
                                "required": prop_name in required_fields,
                                "description": prop_schema.get("description", ""),
                            })
                            
                        except Exception as e:
                            logger.warning(f"Error extracting body field {prop_name}: {e}")
                            continue
                    
                except Exception as e:
                    logger.warning(f"Error extracting request body: {e}")
            
            logger.debug(f"Extracted {len(inputs)} inputs")
            return inputs
            
        except Exception as e:
            logger.error(f"Critical error extracting inputs: {e}", exc_info=True)
            # Return at least credentials input
            return [{
                "id": "credentials",
                "label": "API Credentials",
                "type": "CREDENTIALS",
                "required": True,
            }]
    
    def _extract_node_outputs(self, endpoint: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract node outputs from endpoint responses.
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            List of output pin definitions.
        """
        outputs = []
        
        try:
            # Get successful response schema (200, 201, etc.)
            responses = endpoint.get("responses", {})
            
            for status_code in ["200", "201"]:
                if status_code in responses:
                    response = responses[status_code]
                    schema = response.get("schema", {})
                    
                    # =====================================================================
                    # If response is object with properties, create output for each
                    # =====================================================================
                    
                    if schema.get("type") == "object" and "properties" in schema:
                        try:
                            for prop_name, prop_schema in schema["properties"].items():
                                prop_type = self._map_openapi_type(prop_schema.get("type", "string"))
                                
                                outputs.append({
                                    "id": prop_name,
                                    "label": prop_name.replace("_", " ").title(),
                                    "type": prop_type,
                                    "description": prop_schema.get("description", ""),
                                })
                        except Exception as e:
                            logger.warning(f"Error extracting response properties: {e}")
                    
                    # =====================================================================
                    # Otherwise, create generic JSON output
                    # =====================================================================
                    
                    else:
                        outputs.append({
                            "id": "response",
                            "label": "Response Data",
                            "type": "JSON_DATA",
                            "description": response.get("description", "API response data"),
                        })
                    
                    break  # Only process first successful response
            
            # =====================================================================
            # If no outputs extracted, add default
            # =====================================================================
            
            if not outputs:
                outputs.append({
                    "id": "result",
                    "label": "Result",
                    "type": "JSON_DATA",
                    "description": "API response",
                })
            
            logger.debug(f"Extracted {len(outputs)} outputs")
            return outputs
            
        except Exception as e:
            logger.error(f"Error extracting outputs: {e}", exc_info=True)
            # Return default output
            return [{
                "id": "result",
                "label": "Result",
                "type": "JSON_DATA",
                "description": "API response",
            }]
    
    def _extract_config_fields(self, endpoint: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract configuration fields for the endpoint.
        
        Adds common fields like timeout and retry settings.
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            List of configuration field definitions.
        """
        config = []
        
        try:
            # Timeout field
            config.append({
                "id": "timeout",
                "label": "Timeout (seconds)",
                "type": "number",
                "default": 30,
                "description": "Request timeout in seconds",
            })
            
            # Retry field
            config.append({
                "id": "retry",
                "label": "Retry on Failure",
                "type": "boolean",
                "default": True,
                "description": "Retry failed requests",
            })
            
        except Exception as e:
            logger.warning(f"Error adding config fields: {e}")
        
        return config
    
    # =========================================================================
    # PRIVATE METHODS - TYPE MAPPING
    # =========================================================================
    
    def _map_openapi_type(self, openapi_type: str) -> str:
        """
        Map OpenAPI schema type to workflow data type.
        
        Args:
            openapi_type: OpenAPI type string (string, integer, boolean, etc.).
            
        Returns:
            Workflow data type string (STRING, NUMBER, BOOLEAN, etc.).
        """
        if not openapi_type:
            logger.warning("Empty OpenAPI type, defaulting to JSON_DATA")
            return "JSON_DATA"
        
        mapped_type = self.TYPE_MAPPING.get(openapi_type, "JSON_DATA")
        
        if mapped_type == "JSON_DATA" and openapi_type not in self.TYPE_MAPPING:
            logger.debug(f"Unknown OpenAPI type '{openapi_type}', mapping to JSON_DATA")
        
        return mapped_type