# =============================================================================
# FILE: backend/apps/execution/api_executor.py
# =============================================================================
# Generic API executor for database-generated nodes.
# 
# This module provides a generic HTTP client that can execute API calls
# based on node definitions from the database, without hardcoding specific
# API providers.
# =============================================================================
"""
Generic API executor for dynamic node execution.

This executor can call any REST API based on a node definition from the database,
handling authentication, parameter mapping, and response parsing automatically.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import requests
from typing import Dict, Any, Optional
from urllib.parse import urljoin

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# EXCEPTIONS
# =============================================================================

class APIExecutionError(Exception):
    """Error during API execution."""
    pass


# =============================================================================
# GENERIC API EXECUTOR
# =============================================================================

class GenericAPIExecutor:
    """
    Generic API executor that can call any REST API based on node definition.
    
    This class handles:
    - HTTP methods (GET, POST, PUT, DELETE, PATCH)
    - URL construction with path parameters
    - Query parameters
    - Request body (JSON)
    - Authentication (API key, Bearer token, Basic auth)
    - Response parsing
    - Error handling
    
    Example:
        executor = GenericAPIExecutor()
        request_config = {
            'method': 'GET',
            'url': 'https://api.example.com/endpoint',
            'headers': {'Authorization': 'Bearer token'},
            'params': {'address': '0x123...'},
            'timeout': 30
        }
        response = executor.execute(request_config)
    """
    
    def __init__(self):
        """Initialize the executor."""
        self.session = requests.Session()
    
    def execute(self, request_config: dict) -> dict:
        """
        Execute API request based on configuration.
        
        Args:
            request_config: Dictionary containing:
                - method: HTTP method (GET, POST, etc.)
                - url: Full API URL
                - headers: Request headers (optional)
                - params: Query parameters (optional)
                - json: Request body as JSON (optional)
                - timeout: Request timeout in seconds (default: 30)
        
        Returns:
            Response data as dictionary
            
        Raises:
            APIExecutionError: If request fails
        """
        # Extract request parameters
        method = request_config.get('method', 'GET').upper()
        url = request_config['url']
        headers = request_config.get('headers', {})
        params = request_config.get('params', {})
        json_data = request_config.get('json')
        timeout = request_config.get('timeout', 30)
        
        logger.info(f"[API] Generic executor: {method} {url}")
        logger.debug(f"[API] Headers: {list(headers.keys())}")
        logger.debug(f"[API] Params: {list(params.keys())}")
        
        try:
            # Make request
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                timeout=timeout
            )
            
            # Log response
            logger.info(f"[API] Response: {response.status_code}")
            
            # Check for errors
            if response.status_code >= 400:
                error_msg = f"API error {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg = f"{error_msg}: {error_data.get('message', error_data)}"
                except:
                    error_msg = f"{error_msg}: {response.text[:200]}"
                
                raise APIExecutionError(error_msg)
            
            # Parse response
            try:
                return response.json()
            except ValueError:
                # If response is not JSON, return text wrapped in dict
                return {'response': response.text}
        
        except requests.Timeout:
            logger.error(f"[API] Timeout: {url}")
            raise APIExecutionError(f"Request timeout after {timeout} seconds")
        
        except requests.ConnectionError as e:
            logger.error(f"[API] Connection error: {e}")
            raise APIExecutionError(f"Connection failed: {str(e)}")
        
        except requests.HTTPError as e:
            logger.error(f"[API] HTTP error: {e}")
            raise APIExecutionError(f"HTTP error: {str(e)}")
        
        except Exception as e:
            logger.error(f"[API] Unexpected error: {e}")
            raise APIExecutionError(f"Execution failed: {str(e)}")
    
    def build_url(self, base_url: str, path: str, path_params: Dict[str, str]) -> str:
        """
        Build full URL with path parameters substituted.
        
        Args:
            base_url: API base URL (e.g., 'https://api.example.com')
            path: Endpoint path with {param} placeholders
            path_params: Dictionary of parameter values
        
        Returns:
            Full URL with parameters substituted
            
        Example:
            build_url('https://api.com', '/users/{id}', {'id': '123'})
            -> 'https://api.com/users/123'
        """
        # Substitute path parameters
        formatted_path = path
        for param_name, param_value in path_params.items():
            placeholder = f"{{{param_name}}}"
            formatted_path = formatted_path.replace(placeholder, str(param_value))
        
        # Combine base URL and path
        return urljoin(base_url.rstrip('/') + '/', formatted_path.lstrip('/'))
    
    def build_headers(self, auth_config: Dict[str, Any]) -> Dict[str, str]:
        """
        Build request headers from authentication configuration.
        
        Args:
            auth_config: Dictionary containing:
                - type: 'apiKey', 'bearer', 'basic', or 'none'
                - key: API key or token
                - header: Header name (for apiKey type)
        
        Returns:
            Headers dictionary
        """
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        auth_type = auth_config.get('type', 'none').lower()
        
        if auth_type == 'apikey':
            # API key in custom header
            header_name = auth_config.get('header', 'Authorization')
            api_key = auth_config.get('key', '')
            headers[header_name] = api_key
        
        elif auth_type == 'bearer':
            # Bearer token
            token = auth_config.get('key', '')
            headers['Authorization'] = f'Bearer {token}'
        
        elif auth_type == 'basic':
            # Basic auth (handled by requests.auth, but can set header manually)
            import base64
            username = auth_config.get('username', '')
            password = auth_config.get('password', '')
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers['Authorization'] = f'Basic {credentials}'
        
        return headers