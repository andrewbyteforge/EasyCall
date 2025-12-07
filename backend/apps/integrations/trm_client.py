"""
TRM Labs API client that reads from Django settings.
"""
import requests
from django.conf import settings

class TRMLabsClient:
    """Client for TRM Labs API"""
    
    def __init__(self, api_key: str = None, base_url: str = None):
        """
        Initialize client with API key from settings or override.
        
        Args:
            api_key: Optional override (defaults to settings.TRM_CONFIG)
            base_url: Optional override
        """
        config = settings.TRM_CONFIG
        self.api_key = api_key or config['api_key']
        self.base_url = base_url or config['api_url']
        
        if not self.api_key:
            raise ValueError("TRM Labs API key not configured in .env")
        
        # TRM uses Basic Auth with API key as username
        self.session = requests.Session()
        self.session.auth = (self.api_key, '')
        self.session.headers.update({
            "Content-Type": "application/json"
        })
    
    def get_address_attribution(
        self, 
        blockchain_address: str, 
        chain: str
    ) -> dict:
        """
        Get entities for a blockchain address.
        
        Args:
            blockchain_address: Address to query
            chain: Blockchain identifier (bitcoin, ethereum, etc.)
            
        Returns:
            API response with entity data
        """
        url = f"{self.base_url}/public/v1/blockint/address-attribution"
        params = {
            'blockchainAddress': blockchain_address,
            'chain': chain
        }
        
        response = self.session.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        return response.json()