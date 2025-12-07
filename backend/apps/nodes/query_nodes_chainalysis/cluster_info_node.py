"""
Chainalysis Cluster Info Node - actually makes API calls.
"""
import logging
from apps.integrations.chainalysis_client import ChainalysisClient

logger = logging.getLogger(__name__)

class ClusterInfoNode:
    """
    Node that queries Chainalysis for cluster information.
    """
    
    def __init__(self, node_id: str, configuration: dict):
        """
        Initialize node.
        
        Args:
            node_id: Unique node identifier
            configuration: Node settings (asset type, timeout, etc.)
        """
        self.node_id = node_id
        self.configuration = configuration
    
    def execute(self, input_data: dict) -> dict:
        """
        Execute node: query Chainalysis API.
        
        Args:
            input_data: Data from connected input nodes
                {
                    'address': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                    'blockchain': 'bitcoin'
                }
        
        Returns:
            {
                'cluster_name': 'Binance',
                'category': 'exchange',
                'cluster_address': '...',
                'address': '...'  (pass-through)
            }
        """
        try:
            # Get address from input
            address = input_data.get('address')
            if not address:
                raise ValueError("No address provided to ClusterInfoNode")
            
            # Get configuration
            asset = self.configuration.get('asset', 'bitcoin')
            
            # CREATE API CLIENT (reads from .env via settings)
            client = ChainalysisClient()
            
            # MAKE THE ACTUAL API CALL
            logger.info(f"Querying Chainalysis for {address[:10]}...")
            response = client.get_cluster_info(address, asset)
            
            # Extract data
            cluster_name = response.get('clusterName', 'Unknown')
            category = response.get('category', 'Unknown')
            cluster_address = response.get('rootAddress', address)
            
            logger.info(f"Found cluster: {cluster_name} ({category})")
            
            # Return results
            return {
                'status': 'SUCCESS',
                'cluster_name': cluster_name,
                'category': category,
                'cluster_address': cluster_address,
                'address': address
            }
            
        except Exception as e:
            logger.error(f"ClusterInfoNode failed: {e}")
            return {
                'status': 'FAILED',
                'error': str(e),
                'address': input_data.get('address')
            }