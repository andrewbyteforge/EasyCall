"""
Generic API executor for database-generated nodes.
"""
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class GenericAPIExecutor:
    """
    Generic API executor that can call any API based on node definition.
    
    Handles:
    - HTTP method (GET/POST/PUT/DELETE)
    - URL construction with path parameters
    - Query parameters
    - Request body
    - Authentication (API key, Bearer token)
    - Response parsing
    """
    
    def execute(self, request_config: dict) -> dict:
        """
        Execute API request.
        
        Args:
            request_config: {
                'method': 'GET',
                'url': 'https://api.example.com/endpoint',
                'headers': {...},
                'params': {...},
                'json': {...},
                'timeout': 30
            }
        
        Returns:
            Response data dictionary
        """
        method = request_config.get('method', 'GET')
        url = request_config['url']
        headers = request_config.get('headers', {})
        params = request_config.get('params', {})
        json_data = request_config.get('json')
        timeout = request_config.get('timeout', 30)
        
        logger.info(f"Generic API call: {method} {url}")
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                timeout=timeout
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.Timeout:
            logger.error(f"API timeout: {url}")
            raise
        except requests.HTTPError as e:
            logger.error(f"API HTTP error: {e}")
            raise
        except Exception as e:
            logger.error(f"API call failed: {e}")
            raise