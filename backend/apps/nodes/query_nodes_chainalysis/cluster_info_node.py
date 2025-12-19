# =============================================================================
# FILE: easycall/backend/apps/nodes/query_nodes_chainalysis/cluster_info_node.py
# =============================================================================
# Chainalysis Cluster Info Node - Production Ready Implementation
#
# Returns cluster name, category, and root address for a blockchain address.
# =============================================================================
"""
Chainalysis Cluster Info Node.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Any, Dict, Optional

# Django imports
from django.conf import settings

# Local imports
from apps.nodes.base_node import BaseNode
from apps.nodes.execution_context import ExecutionContext
from apps.nodes.node_result import NodeResult
from apps.integrations.chainalysis_client import (
    ChainalysisClient,
    ChainalysisAPIError
)
from apps.settings_manager.models import GlobalSettings

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# CLUSTER INFO NODE
# =============================================================================


class ChainalysisClusterInfoNode(BaseNode):
    """
    Chainalysis cluster information node.

    Returns cluster name, category, and root address for a blockchain address.
    This helps identify which known entity (exchange, service, etc.) an address
    belongs to.

    **Inputs:**
        - credentials (dict, optional): Chainalysis credentials override
        - address (str, required): Blockchain address to query

    **Outputs:**
        - cluster_name (str): Name of the cluster entity
        - category (str): Category of the cluster
        - cluster_address (str): Root address of the cluster
        - address (str): Original address (pass-through)

    **Configuration:**
        - asset (str): Cryptocurrency asset (bitcoin, ethereum, etc.)
        - timeout (int): Request timeout in seconds

    **Example Usage:**
        Single Address Input → Cluster Info → Excel Export
    """

    node_type = "chainalysis_cluster_info"

    # -------------------------------------------------------------------------
    # MAIN EXECUTION METHOD
    # -------------------------------------------------------------------------

    def execute(self, context: ExecutionContext) -> NodeResult:
        """
        Execute node: query Chainalysis for cluster info.

        Args:
            context: Execution context containing input data

        Returns:
            NodeResult with cluster information
        """
        try:
            # Get inputs from context
            address = self.get_input('address', context)
            credentials = self.get_input('credentials', context)

            # Validate required inputs
            if not address:
                return NodeResult(
                    status='FAILED',
                    error_message="Missing required input: address"
                )

            # Get configuration
            asset = self.get_config('asset', 'bitcoin')
            timeout = self.get_config('timeout', 30)

            # Get API client (with optional credentials override)
            client = self._get_client(credentials)

            # Make API call
            self.log_info(
                f"Querying Chainalysis cluster info for {address[:10]}..."
            )

            response = client.get_cluster_name_and_category(
                address=address,
                asset=asset,
                timeout=timeout
            )

            # Extract data from response
            cluster_name = response.get('clusterName', 'Unknown')
            category = response.get('category', 'Unknown')
            cluster_address = response.get('rootAddress', address)

            self.log_info(
                f"Cluster identified: {cluster_name} ({category})"
            )

            # Build output data
            output_data = {
                'cluster_name': cluster_name,
                'category': category,
                'cluster_address': cluster_address,
                'address': address
            }

            return NodeResult(
                status='SUCCESS',
                output_data=output_data,
                message=f"Cluster: {cluster_name} ({category})"
            )

        except ChainalysisAPIError as e:
            return self._handle_api_error(e)
        except Exception as e:
            self.log_error(f"Unexpected error: {e}")
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )

    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------

    def _get_client(
        self,
        credentials: Optional[Dict[str, Any]] = None
    ) -> ChainalysisClient:
        """
        Get Chainalysis API client with credentials.

        Args:
            credentials: Optional credentials dict from Credentials node

        Returns:
            Configured ChainalysisClient instance
        """
        if credentials:
            # Use credentials from connected Credentials node
            api_key = self._decrypt_api_key(
                credentials.get('api_key_encrypted', '')
            )
            api_url = credentials.get('api_url', 'https://iapi.chainalysis.com')

            self.log_info("Using credentials from Credentials node")
            return ChainalysisClient(api_key=api_key, base_url=api_url)

        else:
            # Use global settings
            settings_obj = GlobalSettings.load()

            # Check if API key is configured
            if not settings_obj.chainalysis_api_key:
                raise ValueError(
                    "Chainalysis API key not configured. "
                    "Please configure in Settings or connect Credentials node."
                )

            api_key = self._decrypt_api_key(settings_obj.chainalysis_api_key)
            api_url = settings_obj.chainalysis_api_url or 'https://iapi.chainalysis.com'

            self.log_info("Using credentials from Global Settings")
            return ChainalysisClient(api_key=api_key, base_url=api_url)

    def _handle_api_error(self, error: ChainalysisAPIError) -> NodeResult:
        """
        Handle Chainalysis API errors with context-aware responses.

        Args:
            error: ChainalysisAPIError exception

        Returns:
            NodeResult with appropriate status and error handling
        """
        status_code = getattr(error, 'status_code', None)

        # Log error with details
        self.log_error(
            f"Chainalysis API error: {error}",
            status_code=status_code
        )

        # Handle specific error codes
        if status_code == 404:
            # Address not in database - not an error, just no data
            return NodeResult(
                status='SUCCESS',
                output_data={
                    'cluster_name': 'Unknown',
                    'category': 'Unknown',
                    'cluster_address': None,
                    'address': self.get_input('address', None)
                },
                message="Address not found in Chainalysis database",
                metadata={'no_data': True}
            )

        elif status_code == 429:
            # Rate limit exceeded - retryable
            return NodeResult(
                status='FAILED',
                error_message="Rate limit exceeded. Please wait and try again.",
                metadata={'retryable': True, 'status_code': 429}
            )

        elif status_code == 401:
            # Authentication failed - not retryable
            return NodeResult(
                status='FAILED',
                error_message="Authentication failed. Check API credentials.",
                metadata={'retryable': False, 'status_code': 401}
            )

        else:
            # Generic error
            return NodeResult(
                status='FAILED',
                error_message=f"API error: {error}",
                metadata={'retryable': status_code >= 500 if status_code else False}
            )

    def _decrypt_api_key(self, encrypted_key: str) -> str:
        """
        Decrypt an encrypted API key.

        Args:
            encrypted_key: Encrypted API key string

        Returns:
            Decrypted plaintext API key

        Raises:
            ValueError: If decryption fails
        """
        if not encrypted_key:
            raise ValueError("API key is empty")

        from utils.encryption import decrypt_value

        try:
            return decrypt_value(encrypted_key)
        except Exception as e:
            self.log_error(f"Failed to decrypt API key: {e}")
            raise ValueError("Invalid or corrupted API key")

    def get_input(
        self,
        pin_id: str,
        context: Optional[ExecutionContext]
    ) -> Any:
        """
        Get input value from execution context.

        Overrides base method to handle None context gracefully.

        Args:
            pin_id: Input pin identifier
            context: Execution context (may be None)

        Returns:
            Input value or None
        """
        if not context:
            return None

        return context.get_input_data(self.node_id, pin_id)