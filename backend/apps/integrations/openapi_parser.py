# =============================================================================
# FILE: backend/apps/integrations/openapi_parser.py
# =============================================================================
# OpenAPI specification parser for extracting endpoint information.
# Extracts endpoints, security schemes, and server configuration.
# =============================================================================
"""
Parser for OpenAPI 3.0 specifications.

This module provides functionality to parse OpenAPI YAML/JSON files
and extract endpoint information, authentication schemes, and server
configuration that can be used to generate workflow nodes.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import yaml
import json
from typing import Dict, Any, List, Optional
from pathlib import Path

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# EXCEPTIONS
# =============================================================================

class OpenAPIParseError(Exception):
    """Raised when OpenAPI spec parsing fails."""
    pass


# =============================================================================
# OPENAPI PARSER
# =============================================================================

class OpenAPIParser:
    """
    Parses OpenAPI 3.0 specifications to extract endpoint information.
    
    This parser reads YAML or JSON OpenAPI spec files and extracts:
    - API metadata (title, version, servers)
    - Endpoint paths and methods
    - Request parameters and body schemas
    - Response schemas
    - Authentication requirements (securitySchemes)
    
    Example:
        parser = OpenAPIParser()
        result = parser.parse_file("/path/to/openapi.yaml")
        endpoints = result["endpoints"]
        security_schemes = result["security_schemes"]
    """
    
    def __init__(self):
        """Initialize the parser."""
        self.spec_data: Optional[Dict[str, Any]] = None
    
    # =========================================================================
    # PUBLIC METHODS
    # =========================================================================
    
    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """
        Parse an OpenAPI specification file.
        
        Args:
            file_path: Path to the YAML or JSON file.
            
        Returns:
            Dictionary containing parsed API information:
                {
                    "api_info": {...},
                    "servers": [...],
                    "endpoints": [...],
                    "security_schemes": {...}
                }
                
        Raises:
            OpenAPIParseError: If parsing fails.
        """
        logger.info(f"Parsing OpenAPI spec from: {file_path}")
        
        try:
            # Load the specification file
            self.spec_data = self._load_spec_file(file_path)
            
            # Validate OpenAPI version
            self._validate_openapi_version()
            
            # Extract information
            result = self._extract_all_info()
            
            logger.info(
                f"✅ Successfully parsed spec: {result['api_info']['title']} "
                f"with {len(result['endpoints'])} endpoints"
            )
            
            return result
            
        except OpenAPIParseError:
            # Re-raise OpenAPIParseError as-is
            raise
        except Exception as e:
            logger.error(f"Failed to parse OpenAPI spec: {e}", exc_info=True)
            raise OpenAPIParseError(f"Failed to parse OpenAPI specification: {str(e)}")
    
    def parse_content(self, content: str, file_format: str = "yaml") -> Dict[str, Any]:
        """
        Parse OpenAPI specification from string content.
        
        Args:
            content: The spec content as string.
            file_format: Format of content ("yaml" or "json").
            
        Returns:
            Dictionary containing parsed API information.
            
        Raises:
            OpenAPIParseError: If parsing fails.
        """
        logger.info(f"Parsing OpenAPI spec from {file_format} content")
        
        try:
            # Load spec data
            if file_format.lower() == "json":
                self.spec_data = json.loads(content)
            else:  # YAML
                self.spec_data = yaml.safe_load(content)
            
            # Validate and extract
            self._validate_openapi_version()
            
            result = self._extract_all_info()
            
            logger.info(
                f"✅ Successfully parsed spec with {len(result['endpoints'])} endpoints"
            )
            return result
            
        except (json.JSONDecodeError, yaml.YAMLError) as e:
            logger.error(f"Failed to parse {file_format} content: {e}")
            raise OpenAPIParseError(f"Invalid {file_format} format: {str(e)}")
        except OpenAPIParseError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse OpenAPI content: {e}", exc_info=True)
            raise OpenAPIParseError(f"Failed to parse OpenAPI content: {str(e)}")
    
    # =========================================================================
    # PRIVATE METHODS - FILE LOADING
    # =========================================================================
    
    def _load_spec_file(self, file_path: str) -> Dict[str, Any]:
        """
        Load OpenAPI spec from file.
        
        Args:
            file_path: Path to the spec file.
            
        Returns:
            Parsed spec data as dictionary.
            
        Raises:
            OpenAPIParseError: If file cannot be loaded or parsed.
        """
        path = Path(file_path)
        
        if not path.exists():
            raise OpenAPIParseError(f"File not found: {file_path}")
        
        try:
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            
            logger.debug(f"Loaded file: {path} ({len(content)} bytes)")
            
            # Determine format and parse
            if path.suffix.lower() in [".yaml", ".yml"]:
                return yaml.safe_load(content)
            elif path.suffix.lower() == ".json":
                return json.loads(content)
            else:
                raise OpenAPIParseError(f"Unsupported file format: {path.suffix}")
                
        except (yaml.YAMLError, json.JSONDecodeError) as e:
            raise OpenAPIParseError(f"Failed to parse file content: {str(e)}")
        except Exception as e:
            raise OpenAPIParseError(f"Failed to load file: {str(e)}")
    
    # =========================================================================
    # PRIVATE METHODS - VALIDATION
    # =========================================================================
    
    def _validate_openapi_version(self) -> None:
        """
        Validate OpenAPI version is 3.x.
        
        Raises:
            OpenAPIParseError: If version is not supported.
        """
        if not self.spec_data:
            raise OpenAPIParseError("No specification data loaded")
        
        version = self.spec_data.get("openapi", "")
        
        if not version.startswith("3."):
            raise OpenAPIParseError(
                f"Unsupported OpenAPI version: {version}. Only 3.x is supported."
            )
        
        logger.debug(f"OpenAPI version: {version} ✅")
    
    # =========================================================================
    # PRIVATE METHODS - EXTRACTION
    # =========================================================================
    
    def _extract_all_info(self) -> Dict[str, Any]:
        """
        Extract all information from spec.
        
        Returns:
            Dictionary with api_info, servers, endpoints, security_schemes.
        """
        try:
            return {
                "api_info": self._extract_api_info(),
                "servers": self._extract_servers(),
                "endpoints": self._extract_endpoints(),
                "security_schemes": self._extract_security_schemes(),
            }
        except Exception as e:
            logger.error(f"Error extracting spec info: {e}", exc_info=True)
            raise OpenAPIParseError(f"Failed to extract spec information: {str(e)}")
    
    def _extract_api_info(self) -> Dict[str, Any]:
        """
        Extract API metadata.
        
        Returns:
            Dictionary with API title, version, and description.
        """
        try:
            info = self.spec_data.get("info", {})
            
            return {
                "title": info.get("title", "Untitled API"),
                "version": info.get("version", "1.0.0"),
                "description": info.get("description", ""),
            }
        except Exception as e:
            logger.warning(f"Error extracting API info: {e}")
            return {
                "title": "Untitled API",
                "version": "1.0.0",
                "description": ""
            }
    
    def _extract_servers(self) -> List[Dict[str, str]]:
        """
        Extract server URLs.
        
        Returns:
            List of server dictionaries with url and description.
        """
        try:
            servers = self.spec_data.get("servers", [])
            
            result = [
                {
                    "url": server.get("url", ""),
                    "description": server.get("description", ""),
                }
                for server in servers
            ]
            
            logger.debug(f"Extracted {len(result)} servers")
            return result
            
        except Exception as e:
            logger.warning(f"Error extracting servers: {e}")
            return []
    
    def _extract_endpoints(self) -> List[Dict[str, Any]]:
        """
        Extract all API endpoints with their details.
        
        Returns:
            List of endpoint dictionaries.
        """
        try:
            paths = self.spec_data.get("paths", {})
            endpoints = []
            
            for path, path_item in paths.items():
                for method, operation in path_item.items():
                    # Skip non-method keys like "parameters", "servers", etc.
                    if method not in ["get", "post", "put", "patch", "delete", "head", "options"]:
                        continue
                    
                    try:
                        endpoint = self._extract_operation_details(path, method, operation)
                        endpoints.append(endpoint)
                    except Exception as e:
                        logger.warning(
                            f"Failed to extract {method.upper()} {path}: {e}"
                        )
                        continue
            
            logger.debug(f"Extracted {len(endpoints)} endpoints")
            return endpoints
            
        except Exception as e:
            logger.error(f"Error extracting endpoints: {e}", exc_info=True)
            return []
    
    def _extract_operation_details(
        self,
        path: str,
        method: str,
        operation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract details for a single operation.
        
        Args:
            path: The endpoint path.
            method: HTTP method.
            operation: Operation object from spec.
            
        Returns:
            Dictionary with endpoint details.
        """
        try:
            return {
                "path": path,
                "method": method.upper(),
                "operation_id": operation.get("operationId", f"{method}_{path}"),
                "summary": operation.get("summary", ""),
                "description": operation.get("description", ""),
                "tags": operation.get("tags", []),
                "parameters": self._extract_parameters(operation),
                "request_body": self._extract_request_body(operation),
                "responses": self._extract_responses(operation),
                "security": operation.get("security", []),
            }
        except Exception as e:
            logger.error(f"Error extracting operation {method} {path}: {e}")
            raise
    
    def _extract_parameters(self, operation: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract parameters from operation.
        
        Args:
            operation: Operation object.
            
        Returns:
            List of parameter dictionaries with intelligent required/optional handling.
        """
        try:
            parameters = operation.get("parameters", [])
            
            result = []
            for param in parameters:
                try:
                    param_name = param.get("name", "")
                    param_schema = param.get("schema", {})
                    param_required = param.get("required", False)
                    
                    # Extract default value from schema
                    default_value = param_schema.get("default")
                    
                    # === INTELLIGENT REQUIRED HANDLING ===
                    
                    # 1. Parameters with default values should be optional
                    if default_value is not None:
                        param_required = False
                        logger.debug(
                            f"Parameter '{param_name}' has default '{default_value}', "
                            f"marking as optional"
                        )
                    
                    # 2. Common auto-populated parameters should be optional
                    auto_fill_params = ['module', 'action', 'format', 'output']
                    if param_name.lower() in auto_fill_params:
                        param_required = False
                        logger.debug(
                            f"Parameter '{param_name}' is auto-fill type, marking as optional"
                        )
                    
                    # 3. Credential parameters should be optional (handled by config nodes)
                    credential_params = [
                        'apikey', 'api_key', 'key', 'token', 'auth', 
                        'authorization', 'access_token', 'bearer'
                    ]
                    if param_name.lower() in credential_params:
                        param_required = False
                        logger.debug(
                            f"Parameter '{param_name}' is credential type, marking as optional"
                        )
                    
                    # 4. Extract all schema properties
                    param_type = param_schema.get("type", "string")
                    param_enum = param_schema.get("enum")
                    param_pattern = param_schema.get("pattern")
                    param_minimum = param_schema.get("minimum")
                    param_maximum = param_schema.get("maximum")
                    param_min_length = param_schema.get("minLength")
                    param_max_length = param_schema.get("maxLength")
                    
                    result.append({
                        "name": param_name,
                        "in": param.get("in", "query"),  # path, query, header, cookie
                        "description": param.get("description", ""),
                        "required": param_required,
                        "type": param_type,
                        "default": default_value,
                        "enum": param_enum,
                        "pattern": param_pattern,
                        "minimum": param_minimum,
                        "maximum": param_maximum,
                        "min_length": param_min_length,
                        "max_length": param_max_length,
                        "schema": param_schema,  # Keep full schema for reference
                    })
                    
                except Exception as e:
                    logger.warning(f"Error extracting parameter: {e}")
                    continue
            
            logger.debug(f"Extracted {len(result)} parameters")
            return result
            
        except Exception as e:
            logger.warning(f"Error extracting parameters: {e}")
            return []
    
    
    
    
    def _extract_request_body(self, operation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract request body schema.
        
        Args:
            operation: Operation object.
            
        Returns:
            Request body dictionary or None.
        """
        try:
            request_body = operation.get("requestBody")
            
            if not request_body:
                return None
            
            content = request_body.get("content", {})
            
            # Get first content type (usually application/json)
            for content_type, media_type in content.items():
                return {
                    "content_type": content_type,
                    "required": request_body.get("required", False),
                    "schema": media_type.get("schema", {}),
                }
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting request body: {e}")
            return None
    
    def _extract_responses(self, operation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract response schemas.
        
        Args:
            operation: Operation object.
            
        Returns:
            Dictionary mapping status codes to response schemas.
        """
        try:
            responses = operation.get("responses", {})
            result = {}
            
            for status_code, response in responses.items():
                try:
                    content = response.get("content", {})
                    
                    # Get first content type
                    for content_type, media_type in content.items():
                        result[status_code] = {
                            "description": response.get("description", ""),
                            "content_type": content_type,
                            "schema": media_type.get("schema", {}),
                        }
                        break  # Only take first content type
                        
                except Exception as e:
                    logger.warning(f"Error extracting response {status_code}: {e}")
                    continue
            
            return result
            
        except Exception as e:
            logger.warning(f"Error extracting responses: {e}")
            return {}
    
    def _extract_security_schemes(self) -> Dict[str, Any]:
        """
        Extract security scheme definitions.
        
        Returns:
            Dictionary of security schemes.
        """
        try:
            components = self.spec_data.get("components", {})
            security_schemes = components.get("securitySchemes", {})
            
            result = {}
            
            for name, scheme in security_schemes.items():
                try:
                    result[name] = {
                        "type": scheme.get("type", ""),
                        "scheme": scheme.get("scheme", ""),
                        "bearer_format": scheme.get("bearerFormat", ""),
                        "in": scheme.get("in", ""),
                        "name": scheme.get("name", ""),
                    }
                except Exception as e:
                    logger.warning(f"Error extracting security scheme {name}: {e}")
                    continue
            
            logger.debug(f"Extracted {len(result)} security schemes")
            return result
            
        except Exception as e:
            logger.warning(f"Error extracting security schemes: {e}")
            return {}