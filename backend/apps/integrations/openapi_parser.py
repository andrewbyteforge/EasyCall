# =============================================================================
# FILE: backend/apps/integrations/openapi_parser.py
# =============================================================================
# OpenAPI specification parser for extracting endpoint information.
# =============================================================================
"""
Parser for OpenAPI 3.0 specifications.

This module provides functionality to parse OpenAPI YAML/JSON files
and extract endpoint information that can be used to generate workflow nodes.
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
    - Authentication requirements
    
    Example:
        parser = OpenAPIParser()
        result = parser.parse_file("/path/to/openapi.yaml")
        endpoints = result["endpoints"]
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
            result = {
                "api_info": self._extract_api_info(),
                "servers": self._extract_servers(),
                "endpoints": self._extract_endpoints(),
                "security_schemes": self._extract_security_schemes(),
            }
            
            logger.info(
                f"Successfully parsed spec: {result['api_info']['title']} "
                f"with {len(result['endpoints'])} endpoints"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to parse OpenAPI spec: {e}")
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
            
            result = {
                "api_info": self._extract_api_info(),
                "servers": self._extract_servers(),
                "endpoints": self._extract_endpoints(),
                "security_schemes": self._extract_security_schemes(),
            }
            
            logger.info(f"Successfully parsed spec with {len(result['endpoints'])} endpoints")
            return result
            
        except Exception as e:
            logger.error(f"Failed to parse OpenAPI content: {e}")
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
        
        logger.debug(f"OpenAPI version: {version}")
    
    # =========================================================================
    # PRIVATE METHODS - EXTRACTION
    # =========================================================================
    
    def _extract_api_info(self) -> Dict[str, Any]:
        """
        Extract API metadata.
        
        Returns:
            Dictionary with API title, version, and description.
        """
        info = self.spec_data.get("info", {})
        
        return {
            "title": info.get("title", "Untitled API"),
            "version": info.get("version", "1.0.0"),
            "description": info.get("description", ""),
        }
    
    def _extract_servers(self) -> List[Dict[str, str]]:
        """
        Extract server URLs.
        
        Returns:
            List of server dictionaries with url and description.
        """
        servers = self.spec_data.get("servers", [])
        
        return [
            {
                "url": server.get("url", ""),
                "description": server.get("description", ""),
            }
            for server in servers
        ]
    
    def _extract_endpoints(self) -> List[Dict[str, Any]]:
        """
        Extract all API endpoints with their details.
        
        Returns:
            List of endpoint dictionaries.
        """
        paths = self.spec_data.get("paths", {})
        endpoints = []
        
        for path, path_item in paths.items():
            for method, operation in path_item.items():
                # Skip non-method keys like "parameters", "servers", etc.
                if method not in ["get", "post", "put", "patch", "delete", "head", "options"]:
                    continue
                
                endpoint = self._extract_operation_details(path, method, operation)
                endpoints.append(endpoint)
        
        return endpoints
    
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
    
    def _extract_parameters(self, operation: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract parameters from operation.
        
        Args:
            operation: Operation object.
            
        Returns:
            List of parameter dictionaries.
        """
        parameters = operation.get("parameters", [])
        
        return [
            {
                "name": param.get("name", ""),
                "in": param.get("in", ""),  # path, query, header, cookie
                "description": param.get("description", ""),
                "required": param.get("required", False),
                "schema": param.get("schema", {}),
            }
            for param in parameters
        ]
    
    def _extract_request_body(self, operation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract request body schema.
        
        Args:
            operation: Operation object.
            
        Returns:
            Request body dictionary or None.
        """
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
    
    def _extract_responses(self, operation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract response schemas.
        
        Args:
            operation: Operation object.
            
        Returns:
            Dictionary mapping status codes to response schemas.
        """
        responses = operation.get("responses", {})
        result = {}
        
        for status_code, response in responses.items():
            content = response.get("content", {})
            
            # Get first content type
            for content_type, media_type in content.items():
                result[status_code] = {
                    "description": response.get("description", ""),
                    "content_type": content_type,
                    "schema": media_type.get("schema", {}),
                }
                break  # Only take first content type
        
        return result
    
    def _extract_security_schemes(self) -> Dict[str, Any]:
        """
        Extract security scheme definitions.
        
        Returns:
            Dictionary of security schemes.
        """
        components = self.spec_data.get("components", {})
        security_schemes = components.get("securitySchemes", {})
        
        result = {}
        
        for name, scheme in security_schemes.items():
            result[name] = {
                "type": scheme.get("type", ""),
                "scheme": scheme.get("scheme", ""),
                "bearer_format": scheme.get("bearerFormat", ""),
                "in": scheme.get("in", ""),
                "name": scheme.get("name", ""),
            }
        
        return result