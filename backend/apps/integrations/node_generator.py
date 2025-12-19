# =============================================================================
# FILE: backend/apps/integrations/node_generator.py
# =============================================================================
# Generate workflow node definitions from parsed OpenAPI endpoints.
# =============================================================================
"""
Node generator for creating workflow nodes from API endpoints.

This module takes parsed OpenAPI endpoint data and generates node
type definitions that can be used in the workflow canvas.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Dict, Any, List

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
    compatible with the workflow system. Each endpoint becomes a query node
    with appropriate inputs, outputs, and configuration.
    
    Example:
        generator = NodeGenerator()
        nodes = generator.generate_nodes(parsed_endpoints, provider="trm_labs")
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
        provider: str,
        category: str = "query"
    ) -> List[Dict[str, Any]]:
        """
        Generate node definitions from endpoints.
        
        Args:
            endpoints: List of parsed endpoint dictionaries.
            provider: Provider name (e.g., "trm_labs", "chainalysis").
            category: Node category (default: "query").
            
        Returns:
            List of node type definitions.
        """
        logger.info(f"Generating nodes for {len(endpoints)} endpoints from {provider}")
        
        nodes = []
        
        for endpoint in endpoints:
            try:
                node = self._generate_node_from_endpoint(endpoint, provider, category)
                nodes.append(node)
            except Exception as e:
                logger.error(f"Failed to generate node for {endpoint.get('path')}: {e}")
                continue
        
        logger.info(f"Successfully generated {len(nodes)} node definitions")
        return nodes
    
    # =========================================================================
    # PRIVATE METHODS - NODE GENERATION
    # =========================================================================
    
    def _generate_node_from_endpoint(
        self,
        endpoint: Dict[str, Any],
        provider: str,
        category: str
    ) -> Dict[str, Any]:
        """
        Generate a single node definition from an endpoint.
        
        Args:
            endpoint: Parsed endpoint dictionary.
            provider: Provider name.
            category: Node category.
            
        Returns:
            Node type definition dictionary.
        """
        # Generate node type identifier
        node_type = self._generate_node_type(endpoint, provider)
        
        # Generate node name
        node_name = self._generate_node_name(endpoint)
        
        # Extract inputs and outputs
        inputs = self._extract_node_inputs(endpoint)
        outputs = self._extract_node_outputs(endpoint)
        config_fields = self._extract_config_fields(endpoint)
        
        return {
            "type": node_type,
            "name": node_name,
            "category": category,
            "provider": provider,
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
    
    def _generate_node_type(self, endpoint: Dict[str, Any], provider: str) -> str:
        """
        Generate a unique node type identifier.
        
        Args:
            endpoint: Endpoint data.
            provider: Provider name.
            
        Returns:
            Node type string (e.g., "trm_labs_get_address").
        """
        # Use operation_id if available, otherwise generate from path and method
        operation_id = endpoint.get("operation_id")
        
        if operation_id:
            # Clean operation ID
            node_type = operation_id.lower().replace(" ", "_").replace("-", "_")
        else:
            # Generate from method and path
            method = endpoint["method"].lower()
            path = endpoint["path"].replace("/", "_").replace("{", "").replace("}", "")
            node_type = f"{method}{path}"
        
        # Add provider prefix
        return f"{provider}_{node_type}"
    
    def _generate_node_name(self, endpoint: Dict[str, Any]) -> str:
        """
        Generate a human-readable node name.
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            Node name string.
        """
        # Use summary if available
        if endpoint.get("summary"):
            return endpoint["summary"]
        
        # Use operation_id and clean it up
        if endpoint.get("operation_id"):
            name = endpoint["operation_id"]
            # Convert camelCase or snake_case to Title Case
            name = name.replace("_", " ").replace("-", " ")
            return " ".join(word.capitalize() for word in name.split())
        
        # Fallback: generate from path
        path = endpoint["path"].replace("/", " ").replace("{", "").replace("}", "")
        return f"{endpoint['method'].upper()} {path.strip().title()}"
    
    # =========================================================================
    # PRIVATE METHODS - INPUT/OUTPUT EXTRACTION
    # =========================================================================
    
    def _extract_node_inputs(self, endpoint: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract node inputs from endpoint parameters.
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            List of input pin definitions.
        """
        inputs = []
        
        # Add credential input (all API nodes need credentials)
        inputs.append({
            "id": "credentials",
            "label": "API Credentials",
            "type": "CREDENTIALS",
            "required": True,
        })
        
        # Extract from parameters
        for param in endpoint.get("parameters", []):
            # Skip header/cookie parameters (handled by credentials)
            if param.get("in") in ["header", "cookie"]:
                continue
            
            param_type = self._map_openapi_type(param.get("schema", {}).get("type", "string"))
            
            # Special handling for address parameters
            if "address" in param.get("name", "").lower():
                param_type = "ADDRESS"
            
            inputs.append({
                "id": param["name"],
                "label": param["name"].replace("_", " ").title(),
                "type": param_type,
                "required": param.get("required", False),
                "description": param.get("description", ""),
            })
        
        # Extract from request body
        request_body = endpoint.get("request_body")
        if request_body:
            schema = request_body.get("schema", {})
            properties = schema.get("properties", {})
            
            for prop_name, prop_schema in properties.items():
                prop_type = self._map_openapi_type(prop_schema.get("type", "string"))
                
                # Special handling for address fields
                if "address" in prop_name.lower():
                    prop_type = "ADDRESS"
                
                inputs.append({
                    "id": prop_name,
                    "label": prop_name.replace("_", " ").title(),
                    "type": prop_type,
                    "required": request_body.get("required", False),
                    "description": prop_schema.get("description", ""),
                })
        
        return inputs
    
    def _extract_node_outputs(self, endpoint: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract node outputs from endpoint responses.
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            List of output pin definitions.
        """
        outputs = []
        
        # Get successful response schema (200, 201, etc.)
        responses = endpoint.get("responses", {})
        
        for status_code in ["200", "201"]:
            if status_code in responses:
                response = responses[status_code]
                schema = response.get("schema", {})
                
                # If response is an object with properties, create outputs for each
                if schema.get("type") == "object" and "properties" in schema:
                    for prop_name, prop_schema in schema["properties"].items():
                        prop_type = self._map_openapi_type(prop_schema.get("type", "string"))
                        
                        outputs.append({
                            "id": prop_name,
                            "label": prop_name.replace("_", " ").title(),
                            "type": prop_type,
                            "description": prop_schema.get("description", ""),
                        })
                else:
                    # Generic JSON output
                    outputs.append({
                        "id": "response",
                        "label": "Response Data",
                        "type": "JSON_DATA",
                        "description": response.get("description", "API response data"),
                    })
                
                break  # Only process first successful response
        
        # If no outputs extracted, add a default
        if not outputs:
            outputs.append({
                "id": "result",
                "label": "Result",
                "type": "JSON_DATA",
                "description": "API response",
            })
        
        return outputs
    
    def _extract_config_fields(self, endpoint: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract configuration fields from endpoint.
        
        Args:
            endpoint: Endpoint data.
            
        Returns:
            List of configuration field definitions.
        """
        config = []
        
        # Add common config fields
        
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
        
        return config
    
    # =========================================================================
    # PRIVATE METHODS - TYPE MAPPING
    # =========================================================================
    
    def _map_openapi_type(self, openapi_type: str) -> str:
        """
        Map OpenAPI schema type to workflow data type.
        
        Args:
            openapi_type: OpenAPI type string.
            
        Returns:
            Workflow data type string.
        """
        return self.TYPE_MAPPING.get(openapi_type, "JSON_DATA")