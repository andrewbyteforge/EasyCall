# =============================================================================
# FILE: easycall/backend/apps/nodes/input_nodes/single_address_node.py
# =============================================================================
# Single address input node implementation.
#
# This node accepts a single cryptocurrency address from the user and
# validates it based on the selected blockchain network.
# =============================================================================
"""
Single address input node for blockchain address entry.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import re
from typing import Any, Dict, Optional

from fields.validators import validate_blockchain_address
from fields.choices import BlockchainNetwork, BLOCKCHAIN_NETWORK_CHOICES

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# NODE CLASS
# =============================================================================


class SingleAddressNode:
    """
    Single address input node.
    
    Accepts and validates a single blockchain address for investigation.
    Supports multiple blockchain networks with format-specific validation.
    
    Node Configuration:
        - address: The cryptocurrency address to analyze (required)
        - blockchain: The blockchain network (required)
    
    Outputs:
        - address: Validated blockchain address (string)
        - blockchain: Blockchain identifier (string)
    
    Example Usage:
        node = SingleAddressNode(config={
            'address': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            'blockchain': 'bitcoin'
        })
        result = node.execute()
        # result.output_data = {
        #     'address': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        #     'blockchain': 'bitcoin'
        # }
    """
    
    # Node metadata
    node_type = "single_address"
    node_category = "input"
    node_name = "Single Address Input"
    node_description = "Manually enter a single cryptocurrency address"
    
    # Address validation patterns for different networks
    ADDRESS_PATTERNS = {
        BlockchainNetwork.BITCOIN.value: {
            'p2pkh': r'^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$',
            'p2sh': r'^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$',
            'bech32': r'^(bc1)[a-z0-9]{39,87}$'
        },
        BlockchainNetwork.ETHEREUM.value: r'^0x[a-fA-F0-9]{40}$',
        BlockchainNetwork.LITECOIN.value: r'^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$',
        BlockchainNetwork.BITCOIN_CASH.value: r'^[13][a-km-zA-HJ-NP-Z1-9]{33}$|^((bitcoincash|bchreg|bchtest):)?(q|p)[a-z0-9]{41}$',
        BlockchainNetwork.TRON.value: r'^T[a-zA-Z0-9]{33}$',
        BlockchainNetwork.SOLANA.value: r'^[1-9A-HJ-NP-Za-km-z]{32,44}$',
        BlockchainNetwork.RIPPLE.value: r'^r[0-9a-zA-Z]{24,34}$',
    }
    
    # -------------------------------------------------------------------------
    # INITIALIZATION
    # -------------------------------------------------------------------------
    
    def __init__(
        self,
        node_id: str,
        workflow_id: str,
        configuration: Dict[str, Any]
    ):
        """
        Initialize the single address input node.
        
        Args:
            node_id: Unique identifier for this node instance
            workflow_id: ID of the workflow this node belongs to
            configuration: Node configuration containing:
                - address: The cryptocurrency address (required)
                - blockchain: The blockchain network (required)
        """
        self.node_id = node_id
        self.workflow_id = workflow_id
        self.configuration = configuration
        
        logger.debug(
            f"Initialized SingleAddressNode {node_id}",
            extra={'workflow_id': workflow_id}
        )
    
    # -------------------------------------------------------------------------
    # EXECUTION
    # -------------------------------------------------------------------------
    
    def execute(self, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Execute the node: validate and output the address.
        
        Args:
            context: Execution context (not used for input nodes)
        
        Returns:
            NodeResult dictionary with:
                - status: 'SUCCESS' or 'FAILED'
                - output_data: Dict with 'address' and 'blockchain'
                - message: Human-readable result message
                - error_message: Error details if failed
        
        Raises:
            No exceptions raised - all errors returned in result dict
        """
        try:
            # Extract configuration
            address = self.configuration.get('address', '').strip()
            blockchain = self.configuration.get('blockchain', '').lower()
            
            # Validate required fields
            if not address:
                return self._create_error_result("Address is required")
            
            if not blockchain:
                return self._create_error_result("Blockchain network is required")
            
            # Validate blockchain is supported
            valid_blockchains = [choice[0] for choice in BLOCKCHAIN_NETWORK_CHOICES]
            if blockchain not in valid_blockchains:
                return self._create_error_result(
                    f"Unsupported blockchain: {blockchain}. "
                    f"Valid options: {', '.join(valid_blockchains)}"
                )
            
            # Validate address format
            is_valid = self._validate_address(address, blockchain)
            
            if not is_valid:
                return self._create_error_result(
                    f"Invalid {blockchain} address format"
                )
            
            # Log successful validation
            logger.info(
                f"Address validated: {address[:10]}...{address[-6:]} on {blockchain}",
                extra={
                    'node_id': self.node_id,
                    'workflow_id': self.workflow_id,
                    'blockchain': blockchain
                }
            )
            
            # Return success result
            return {
                'status': 'SUCCESS',
                'output_data': {
                    'address': address,
                    'blockchain': blockchain
                },
                'message': f"Address validated: {address[:10]}...{address[-6:]}",
                'error_message': None
            }
            
        except KeyError as e:
            error_msg = f"Missing required configuration: {e}"
            logger.error(
                error_msg,
                extra={'node_id': self.node_id}
            )
            return self._create_error_result(error_msg)
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(
                error_msg,
                extra={'node_id': self.node_id},
                exc_info=True
            )
            return self._create_error_result(error_msg)
    
    # -------------------------------------------------------------------------
    # VALIDATION METHODS
    # -------------------------------------------------------------------------
    
    def _validate_address(self, address: str, blockchain: str) -> bool:
        """
        Validate address format for the specified blockchain.
        
        Args:
            address: The address to validate
            blockchain: The blockchain identifier
        
        Returns:
            True if valid, False otherwise
        """
        patterns = self.ADDRESS_PATTERNS.get(blockchain)
        
        if not patterns:
            # Blockchain not explicitly validated - log warning and allow
            logger.warning(
                f"No validation pattern for {blockchain}, allowing address",
                extra={'node_id': self.node_id}
            )
            return True
        
        # Handle multi-pattern blockchains (like Bitcoin with P2PKH, P2SH, Bech32)
        if isinstance(patterns, dict):
            return any(
                re.match(pattern, address)
                for pattern in patterns.values()
            )
        else:
            # Single pattern blockchain
            return bool(re.match(patterns, address))
    
    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------
    
    def _create_error_result(self, error_message: str) -> Dict[str, Any]:
        """
        Create a standardized error result.
        
        Args:
            error_message: Description of the error
        
        Returns:
            NodeResult dictionary with FAILED status
        """
        return {
            'status': 'FAILED',
            'output_data': {},
            'message': None,
            'error_message': error_message
        }
    
    # -------------------------------------------------------------------------
    # NODE METADATA
    # -------------------------------------------------------------------------
    
    @classmethod
    def get_node_definition(cls) -> Dict[str, Any]:
        """
        Get the node definition for UI rendering.
        
        Returns:
            Dictionary containing node metadata, inputs, outputs, and config
        """
        return {
            'type': cls.node_type,
            'category': cls.node_category,
            'name': cls.node_name,
            'description': cls.node_description,
            'icon': '📍',
            'color': '#1976d2',  # Blue
            
            'inputs': [],  # No inputs for input nodes
            
            'outputs': [
                {
                    'id': 'address',
                    'label': 'address',
                    'type': 'string',
                    'description': 'Validated blockchain address'
                },
                {
                    'id': 'blockchain',
                    'label': 'blockchain',
                    'type': 'string',
                    'description': 'Blockchain identifier (e.g., bitcoin, ethereum)'
                }
            ],
            
            'configuration': {
                'address': {
                    'type': 'string',
                    'label': 'Address',
                    'description': 'Cryptocurrency address to analyze',
                    'required': True,
                    'placeholder': 'Enter blockchain address',
                    'validation': 'validateBlockchainAddress'
                },
                'blockchain': {
                    'type': 'select',
                    'label': 'Blockchain',
                    'description': 'Blockchain network',
                    'required': True,
                    'default': 'bitcoin',
                    'options': [
                        {'value': 'bitcoin', 'label': 'Bitcoin'},
                        {'value': 'ethereum', 'label': 'Ethereum'},
                        {'value': 'litecoin', 'label': 'Litecoin'},
                        {'value': 'bitcoin_cash', 'label': 'Bitcoin Cash'},
                        {'value': 'tron', 'label': 'TRON'},
                        {'value': 'bsc', 'label': 'Binance Smart Chain'},
                        {'value': 'polygon', 'label': 'Polygon'},
                        {'value': 'solana', 'label': 'Solana'},
                        {'value': 'ripple', 'label': 'XRP Ledger'},
                    ]
                }
            }
        }