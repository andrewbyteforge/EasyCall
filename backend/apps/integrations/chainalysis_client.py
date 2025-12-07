"""
Chainalysis API client that reads from Django settings.
"""
import requests
from django.conf import settings

class ChainalysisClient:
    """Client for Chainalysis Reactor API"""
    
    def __init__(self, api_key: str = None, base_url: str = None):
        """
        Initialize client with API key from settings or override.
        
        Args:
            api_key: Optional override (defaults to settings.CHAINALYSIS_CONFIG)
            base_url: Optional override (defaults to settings.CHAINALYSIS_CONFIG)
        """
        # Use provided key or fall back to settings
        config = settings.CHAINALYSIS_CONFIG
        self.api_key = api_key or config['api_key']
        self.base_url = base_url or config['api_url']
        
        if not self.api_key:
            raise ValueError("Chainalysis API key not configured in .env")
        
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Token": self.api_key  # Chainalysis uses 'Token' header
        })
    
    def get_cluster_info(self, address: str, asset: str = "bitcoin") -> dict:
        """
        Get cluster information for an address.
        
        Args:
            address: Blockchain address
            asset: Asset type (bitcoin, ethereum, etc.)
            
        Returns:
            API response with cluster data
        """
        url = f"{self.base_url}/clusters/{address}"
        params = {"filterAsset": asset}
        
        response = self.session.get(url, params=params, timeout=30)
        response.raise_for_status()  # Raises exception for 4xx/5xx
        
        return response.json()