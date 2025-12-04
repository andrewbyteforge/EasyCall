# API Integration Specification (Revised)
## Blockchain Intelligence Workflow Builder - Real API Implementation Only

**Version:** 1.0  
**Date:** December 4, 2025  
**Purpose:** Complete specification for implementing all 21 node types with real API integrations

---

## Table of Contents
1. [Authentication Implementation](#1-authentication-implementation)
2. [Complete Node Summary](#2-complete-node-summary)
3. [Priority Nodes - Detailed Specifications](#3-priority-nodes---detailed-specifications)
4. [Error Handling Strategy](#4-error-handling-strategy)
5. [Rate Limiting Implementation](#5-rate-limiting-implementation)
6. [Development Strategy](#6-development-strategy)

---

## 1. Authentication Implementation

*(Keeping authentication as already specified - no changes needed)*

---

## 2. Complete Node Summary

### All 21 Nodes Overview

| # | Node Name | Provider | Category | API Endpoint | Key Outputs | Priority |
|---|-----------|----------|----------|--------------|-------------|----------|
| 1 | Chainalysis Credentials | Chainalysis | Config | N/A | credentials | Medium |
| 2 | TRM Labs Credentials | TRM | Config | N/A | credentials | Medium |
| 3 | Single Address Input | N/A | Input | N/A | address, blockchain | High |
| 4 | Batch Input | N/A | Input | N/A | addresses[], count | High |
| 5 | Transaction Hash Input | N/A | Input | N/A | tx_hash, blockchain | Low |
| 6 | Cluster Info | Chainalysis | Query | GET /clusters/{address} | cluster_name, category | Medium |
| 7 | **Cluster Balance** | **Chainalysis** | **Query** | **GET /clusters/{address}/{asset}/summary** | **balance, transfers** | **HIGH** |
| 8 | Cluster Counterparties | Chainalysis | Query | GET /clusters/{address}/{asset}/counterparties | counterparties[] | Medium |
| 9 | Transaction Details | Chainalysis | Query | GET /transactions/{hash}/{asset}/details | tx_details | Low |
| 10 | **Exposure by Category** | **Chainalysis** | **Query** | **GET /exposures/clusters/{address}/{asset}/directions/{direction}** | **exposure_data** | **HIGH** |
| 11 | Exposure by Service | Chainalysis | Query | GET /exposures/.../services | services_exposure | Medium |
| 12 | **Address Attribution** | **TRM** | **Query** | **GET /blockint/address-attribution** | **entities[]** | **HIGH** |
| 13 | **Total Exposure** | **TRM** | **Query** | **GET /blockint/total-exposure** | **exposure_entities** | **HIGH** |
| 14 | Address Summary | TRM | Query | POST /blockint/metrics/address/summary | metrics | Medium |
| 15 | **Address Transfers** | **TRM** | **Query** | **POST /blockint/transfers/by-address** | **transfers[]** | **HIGH** |
| 16 | Network Intelligence | TRM | Query | GET /blockint/net-intel/ip-addresses/... | ip_data | Low |
| 17 | TXT Export | N/A | Output | N/A | file_download | Medium |
| 18 | Excel Export | N/A | Output | N/A | file_download | High |
| 19 | JSON Export | N/A | Output | N/A | file_download | Medium |
| 20 | CSV Export | N/A | Output | N/A | file_download | High |
| 21 | Console Log | N/A | Output | N/A | console_output | High |

---

## 3. Priority Nodes - Detailed Specifications

### 3.1 Cluster Balance Node (Chainalysis) - HIGH PRIORITY

#### API Details
```python
# Endpoint
GET /clusters/{address}/{asset}/summary

# Query Parameters
- outputAsset: "NATIVE" or "USD"

# Response Schema
{
    "addressCount": int,        # Number of addresses in cluster
    "transferCount": int,       # Total number of transfers
    "depositCount": int,        # Number of deposits
    "withdrawalCount": int,     # Number of withdrawals
    "balance": float,          # Current balance
    "totalSent": float,        # Total amount sent
    "totalReceived": float,    # Total amount received
    "totalSentFees": float,    # Total fees spent
    "totalReceivedFees": float # Total fees received
}
```

#### Backend Implementation
```python
# backend/apps/nodes/query/chainalysis/balance.py

class ChainalysisClusterBalanceNode(BaseNode):
    """
    Chainalysis cluster balance node.
    Returns comprehensive balance and transfer statistics.
    """
    
    node_type = "chainalysis_cluster_balance"
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """Execute node: query Chainalysis for cluster balance."""
        try:
            # Get inputs
            address = self.get_input('address', context)
            credentials = self.get_input('credentials', context)
            
            # Get configuration
            asset = self.configuration['asset']
            output_asset = self.configuration.get('output_asset', 'NATIVE')
            timeout = self.configuration.get('timeout', 30)
            
            # Get API client
            client = self._get_client(credentials)
            
            # Make API call
            logger.info(
                f"Querying Chainalysis balance for {address[:10]}...",
                extra={'node_id': self.node_id}
            )
            
            response = client.get_cluster_balance(
                address=address,
                asset=asset,
                output_asset=output_asset
            )
            
            # Parse response - map API fields to output pins
            output_data = {
                'balance': response.get('balance', 0),
                'total_sent': response.get('totalSent', 0),
                'total_received': response.get('totalReceived', 0),
                'transfer_count': response.get('transferCount', 0),
                'deposit_count': response.get('depositCount', 0),
                'withdrawal_count': response.get('withdrawalCount', 0),
                'address_count': response.get('addressCount', 0),
                'total_sent_fees': response.get('totalSentFees', 0),
                'total_received_fees': response.get('totalReceivedFees', 0),
                'address': address  # Pass-through
            }
            
            # Format message
            currency = "USD" if output_asset == "USD" else asset.upper()
            message = (
                f"Balance: {output_data['balance']:,.2f} {currency}, "
                f"{output_data['transfer_count']} transfers"
            )
            
            logger.info(message, extra={'node_id': self.node_id})
            
            return NodeResult(
                status='SUCCESS',
                output_data=output_data,
                message=message
            )
            
        except ChainalysisAPIError as e:
            return self._handle_api_error(e)
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
```

#### Node Configuration
```typescript
interface ClusterBalanceNode {
  outputs: [
    { id: "balance", type: "number", description: "Current balance" },
    { id: "total_sent", type: "number", description: "Total sent" },
    { id: "total_received", type: "number", description: "Total received" },
    { id: "transfer_count", type: "number", description: "Transfer count" },
    { id: "deposit_count", type: "number", description: "Deposit count" },
    { id: "withdrawal_count", type: "number", description: "Withdrawal count" },
    { id: "address_count", type: "number", description: "Address count" },
    { id: "total_sent_fees", type: "number", description: "Total fees sent" },
    { id: "total_received_fees", type: "number", description: "Total fees received" },
    { id: "address", type: "string", description: "Original address" }
  ];
  
  configuration: {
    asset: {
      type: "select";
      options: ["bitcoin", "ethereum", "litecoin", "bitcoin_cash"];
      default: "bitcoin";
      required: true;
    };
    output_asset: {
      type: "select";
      options: ["NATIVE", "USD"];
      default: "NATIVE";
    };
    timeout: {
      type: "number";
      default: 30;
      min: 5;
      max: 300;
    };
  };
}
```

---

### 3.2 Exposure by Category Node (Chainalysis) - HIGH PRIORITY

#### API Details
```python
# Endpoint
GET /exposures/clusters/{address}/{asset}/directions/{direction}

# Path Parameters
- address: blockchain address
- asset: cryptocurrency (bitcoin, ethereum, etc.)
- direction: "sent" or "received"

# Query Parameters
- outputAsset: "NATIVE" or "USD"

# Response Schema
{
    "direct": [
        {
            "category": string,           # e.g., "exchange", "darknet", "gambling"
            "value": float,              # exposure value
            "percentage": float          # percentage of total
        }
    ],
    "indirect": [
        {
            "category": string,
            "value": float,
            "percentage": float
        }
    ]
}
```

#### Backend Implementation
```python
# backend/apps/nodes/query/chainalysis/exposure_category.py

class ChainalysisExposureCategoryNode(BaseNode):
    """
    Chainalysis exposure by category node.
    Returns risk exposure analysis.
    """
    
    node_type = "chainalysis_exposure_category"
    
    # High-risk categories that require flagging
    HIGH_RISK_CATEGORIES = [
        'darknet', 'ransomware', 'scam', 'stolen funds',
        'sanctions', 'child abuse', 'terrorism financing'
    ]
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """Execute node: query Chainalysis for exposure data."""
        try:
            # Get inputs
            address = self.get_input('address', context)
            credentials = self.get_input('credentials', context)
            
            # Get configuration
            asset = self.configuration['asset']
            direction = self.configuration['direction']
            output_asset = self.configuration.get('output_asset', 'USD')
            timeout = self.configuration.get('timeout', 30)
            
            # Get API client
            client = self._get_client(credentials)
            
            # Make API call
            logger.info(
                f"Querying Chainalysis exposure for {address[:10]}...",
                extra={'node_id': self.node_id}
            )
            
            response = client.get_exposure_by_category(
                address=address,
                asset=asset,
                direction=direction,
                output_asset=output_asset
            )
            
            # Parse exposure data
            direct_exposure = response.get('direct', [])
            indirect_exposure = response.get('indirect', [])
            
            # Calculate total risk
            total_direct = sum(e['value'] for e in direct_exposure)
            total_indirect = sum(e['value'] for e in indirect_exposure)
            total_risk = total_direct + total_indirect
            
            # Identify high-risk flags
            high_risk_flags = [
                {
                    'category': exp['category'],
                    'value': exp['value'],
                    'exposure_type': 'direct'
                }
                for exp in direct_exposure
                if exp['category'].lower() in self.HIGH_RISK_CATEGORIES
            ]
            
            high_risk_flags.extend([
                {
                    'category': exp['category'],
                    'value': exp['value'],
                    'exposure_type': 'indirect'
                }
                for exp in indirect_exposure
                if exp['category'].lower() in self.HIGH_RISK_CATEGORIES
            ])
            
            output_data = {
                'direct_exposure': direct_exposure,
                'indirect_exposure': indirect_exposure,
                'total_direct': total_direct,
                'total_indirect': total_indirect,
                'total_risk': total_risk,
                'high_risk_flags': high_risk_flags,
                'has_high_risk': len(high_risk_flags) > 0,
                'address': address
            }
            
            # Format message
            message = f"Total exposure: {total_risk:,.2f}"
            if high_risk_flags:
                categories = [f['category'] for f in high_risk_flags]
                message += f" ⚠️ HIGH RISK: {', '.join(categories)}"
            
            logger.info(message, extra={'node_id': self.node_id})
            
            return NodeResult(
                status='SUCCESS',
                output_data=output_data,
                message=message
            )
            
        except ChainalysisAPIError as e:
            return self._handle_api_error(e)
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
```

#### Node Configuration
```typescript
interface ExposureByCategoryNode {
  outputs: [
    { id: "direct_exposure", type: "array", description: "Direct exposure by category" },
    { id: "indirect_exposure", type: "array", description: "Indirect exposure by category" },
    { id: "total_direct", type: "number", description: "Total direct exposure value" },
    { id: "total_indirect", type: "number", description: "Total indirect exposure value" },
    { id: "total_risk", type: "number", description: "Combined total exposure" },
    { id: "high_risk_flags", type: "array", description: "High-risk category flags" },
    { id: "has_high_risk", type: "boolean", description: "True if high-risk detected" },
    { id: "address", type: "string", description: "Original address" }
  ];
  
  configuration: {
    asset: {
      type: "select";
      options: ["bitcoin", "ethereum", "litecoin"];
      required: true;
    };
    direction: {
      type: "select";
      label: "Direction";
      description: "Analyze funds sent or received";
      options: [
        { value: "sent", label: "Sent (Outgoing)" },
        { value: "received", label: "Received (Incoming)" }
      ];
      default: "sent";
      required: true;
    };
    output_asset: {
      type: "select";
      options: ["NATIVE", "USD"];
      default: "USD";
    };
  };
}
```

---

### 3.3 Address Attribution Node (TRM Labs) - HIGH PRIORITY

#### API Details
```python
# Endpoint
GET /public/v1/blockint/address-attribution

# Query Parameters
- blockchainAddress: address to query (required)
- chain: blockchain identifier (required)
- externalId: optional tracking ID

# Response Schema
{
    "data": [
        {
            "entity": string,              # Entity name
            "entityType": string,          # Entity type
            "category": string,            # Category
            "confidence": string,          # Confidence level
            "lastObservedAt": datetime     # Last observation
        }
    ],
    "meta": {
        "count": int
    }
}
```

#### Backend Implementation
```python
# backend/apps/nodes/query/trm/address_attribution.py

class TRMAddressAttributionNode(BaseNode):
    """
    TRM Labs address attribution node.
    Returns entities associated with an address.
    """
    
    node_type = "trm_address_attribution"
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """Execute node: query TRM for address attribution."""
        try:
            # Get inputs
            address = self.get_input('address', context)
            blockchain = self.get_input('blockchain', context)
            credentials = self.get_input('credentials', context)
            
            # Get configuration
            timeout = self.configuration.get('timeout', 30)
            
            # Get API client
            client = self._get_client(credentials)
            
            # Make API call
            logger.info(
                f"Querying TRM attribution for {address[:10]}...",
                extra={'node_id': self.node_id}
            )
            
            response = client.get_address_attribution(
                blockchain_address=address,
                chain=blockchain,
                external_id=self._generate_external_id()
            )
            
            # Parse response
            entities = response.get('data', [])
            entity_count = response.get('meta', {}).get('count', 0)
            
            # Extract entity details
            entity_names = [e.get('entity', 'Unknown') for e in entities]
            entity_types = list(set(e.get('entityType', 'Unknown') for e in entities))
            
            output_data = {
                'entities': entities,
                'entity_count': entity_count,
                'entity_names': entity_names,
                'entity_types': entity_types,
                'has_attribution': entity_count > 0,
                'address': address
            }
            
            # Format message
            if entity_count > 0:
                message = f"Found {entity_count} entities: {', '.join(entity_names[:3])}"
                if entity_count > 3:
                    message += f" +{entity_count - 3} more"
            else:
                message = "No entity attribution found"
            
            logger.info(message, extra={'node_id': self.node_id})
            
            return NodeResult(
                status='SUCCESS',
                output_data=output_data,
                message=message
            )
            
        except TRMLabsAPIError as e:
            return self._handle_api_error(e)
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
    
    def _generate_external_id(self) -> str:
        """Generate external ID for tracking"""
        import uuid
        return f"workflow-{self.workflow_id}-{uuid.uuid4()}"
```

#### TRM Client Method
```python
# backend/apps/integrations/trm_client.py

class TRMLabsClient:
    
    def get_address_attribution(
        self,
        blockchain_address: str,
        chain: str,
        external_id: str = None
    ) -> dict:
        """
        Get entities for a blockchain address.
        
        Args:
            blockchain_address: Address to query
            chain: Blockchain identifier (bitcoin, ethereum, etc.)
            external_id: Optional tracking ID
            
        Returns:
            API response with entity data
        """
        params = {
            'blockchainAddress': blockchain_address,
            'chain': chain
        }
        
        if external_id:
            params['externalId'] = external_id
        
        return self._make_request(
            method='GET',
            path='/public/v1/blockint/address-attribution',
            params=params
        )
```

---

### 3.4 Total Exposure Node (TRM Labs) - HIGH PRIORITY

#### API Details
```python
# Endpoint
GET /public/v1/blockint/total-exposure

# Query Parameters
- blockchainAddress: address to query (required)
- chain: blockchain identifier (required)
- externalId: optional tracking ID
- txDate[gte]: start date (optional, format: YYYY-MM-DD)
- txDate[lte]: end date (optional, format: YYYY-MM-DD)
- offset: pagination offset (optional)
- limit: results per page, 1-100 (optional, default: 10)

# Response Schema
{
    "data": [
        {
            "entity": string,              # Entity name
            "category": string,            # Risk category
            "totalVolume": float,         # Total exposure volume
            "direction": string,          # "sent" or "received"
            "transferCount": int          # Number of transfers
        }
    ],
    "meta": {
        "count": int                      # Total results
    }
}
```

#### Backend Implementation
```python
# backend/apps/nodes/query/trm/total_exposure.py

class TRMTotalExposureNode(BaseNode):
    """
    TRM Labs total exposure node.
    Returns exposure to different entities.
    """
    
    node_type = "trm_total_exposure"
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """Execute node: query TRM for total exposure."""
        try:
            # Get inputs
            address = self.get_input('address', context)
            blockchain = self.get_input('blockchain', context)
            credentials = self.get_input('credentials', context)
            
            # Get configuration
            date_range = self.configuration.get('date_range', {})
            timeout = self.configuration.get('timeout', 30)
            
            # Get API client
            client = self._get_client(credentials)
            
            # Make API call
            logger.info(
                f"Querying TRM exposure for {address[:10]}...",
                extra={'node_id': self.node_id}
            )
            
            response = client.get_total_exposure(
                blockchain_address=address,
                chain=blockchain,
                tx_date_gte=date_range.get('start'),
                tx_date_lte=date_range.get('end'),
                external_id=self._generate_external_id()
            )
            
            # Parse response
            exposures = response.get('data', [])
            total_count = response.get('meta', {}).get('count', 0)
            
            # Calculate totals
            total_volume = sum(e.get('totalVolume', 0) for e in exposures)
            
            # Categorize by risk level
            high_risk = [e for e in exposures if self._is_high_risk(e.get('category'))]
            medium_risk = [e for e in exposures if self._is_medium_risk(e.get('category'))]
            
            output_data = {
                'exposures': exposures,
                'exposure_count': total_count,
                'total_volume': total_volume,
                'high_risk_entities': high_risk,
                'medium_risk_entities': medium_risk,
                'has_high_risk': len(high_risk) > 0,
                'address': address
            }
            
            # Format message
            message = f"Exposure to {total_count} entities, Volume: {total_volume:,.2f}"
            if high_risk:
                message += f" ⚠️ {len(high_risk)} HIGH RISK"
            
            logger.info(message, extra={'node_id': self.node_id})
            
            return NodeResult(
                status='SUCCESS',
                output_data=output_data,
                message=message
            )
            
        except TRMLabsAPIError as e:
            return self._handle_api_error(e)
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
    
    def _is_high_risk(self, category: str) -> bool:
        """Check if category is high risk"""
        high_risk_categories = [
            'sanctions', 'darknet', 'ransomware', 'scam',
            'stolen funds', 'terrorism', 'child abuse'
        ]
        return category and category.lower() in high_risk_categories
    
    def _is_medium_risk(self, category: str) -> bool:
        """Check if category is medium risk"""
        medium_risk_categories = [
            'gambling', 'mixer', 'p2p exchange', 'atm'
        ]
        return category and category.lower() in medium_risk_categories
```

#### TRM Client Method
```python
# backend/apps/integrations/trm_client.py

def get_total_exposure(
    self,
    blockchain_address: str,
    chain: str,
    tx_date_gte: str = None,
    tx_date_lte: str = None,
    external_id: str = None,
    offset: int = 0,
    limit: int = 100
) -> dict:
    """
    Get total exposure for a blockchain address.
    
    Args:
        blockchain_address: Address to query
        chain: Blockchain identifier
        tx_date_gte: Start date (YYYY-MM-DD)
        tx_date_lte: End date (YYYY-MM-DD)
        external_id: Optional tracking ID
        offset: Pagination offset
        limit: Results per page (1-100)
        
    Returns:
        API response with exposure data
    """
    params = {
        'blockchainAddress': blockchain_address,
        'chain': chain,
        'offset': offset,
        'limit': min(limit, 100)
    }
    
    if tx_date_gte:
        params['txDate[gte]'] = tx_date_gte
    if tx_date_lte:
        params['txDate[lte]'] = tx_date_lte
    if external_id:
        params['externalId'] = external_id
    
    return self._make_request(
        method='GET',
        path='/public/v1/blockint/total-exposure',
        params=params
    )
```

---

### 3.5 Address Transfers Node (TRM Labs) - HIGH PRIORITY

#### API Details
```python
# Endpoint
POST /public/v1/blockint/transfers/by-address

# Request Body
{
    "blockchainAddress": string,    # Required
    "chain": string,                # Required
    "txTimestamp": {
        "gte": datetime,            # Optional start
        "lte": datetime             # Optional end
    },
    "direction": "IN" | "OUT" | "BOTH",  # Default: "BOTH"
    "includeAttribution": boolean,  # Default: false
    "includeAddressProperties": boolean,  # Default: false
    "includeTransactionProperties": boolean,  # Default: false
    "page": {
        "after": string,            # Pagination cursor
        "before": string,           # Pagination cursor
        "size": int                 # Page size (max 100)
    }
}

# Response Schema
{
    "data": [
        {
            "transactionHash": string,
            "transactionTimestamp": datetime,
            "sender": {
                "address": string,
                "chain": string
            },
            "receiver": {
                "address": string,
                "chain": string
            },
            "asset": {
                "address": string,
                "chain": string,
                "name": string,
                "symbol": string
            },
            "amount": string,
            "amountUsd": float,
            "direction": "IN" | "OUT"
        }
    ],
    "meta": {
        "nextCursor": string,
        "previousCursor": string,
        "approximateCount": int
    }
}
```

#### Backend Implementation
```python
# backend/apps/nodes/query/trm/address_transfers.py

class TRMAddressTransfersNode(BaseNode):
    """
    TRM Labs address transfers node.
    Returns list of transfers for an address.
    """
    
    node_type = "trm_address_transfers"
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """Execute node: query TRM for address transfers."""
        try:
            # Get inputs
            address = self.get_input('address', context)
            blockchain = self.get_input('blockchain', context)
            credentials = self.get_input('credentials', context)
            
            # Get configuration
            direction = self.configuration.get('direction', 'BOTH')
            date_range = self.configuration.get('date_range', {})
            include_attribution = self.configuration.get('include_attribution', False)
            page_size = self.configuration.get('page_size', 20)
            max_results = self.configuration.get('max_results', 1000)
            
            # Get API client
            client = self._get_client(credentials)
            
            # Prepare request body
            request_body = {
                'blockchainAddress': address,
                'chain': blockchain,
                'direction': direction,
                'includeAttribution': include_attribution,
                'includeAddressProperties': False,
                'includeTransactionProperties': True,
                'page': {
                    'size': min(page_size, 100)
                }
            }
            
            # Add date range if specified
            if date_range.get('start') or date_range.get('end'):
                request_body['txTimestamp'] = {}
                if date_range.get('start'):
                    request_body['txTimestamp']['gte'] = date_range['start']
                if date_range.get('end'):
                    request_body['txTimestamp']['lte'] = date_range['end']
            
            # Make API call with pagination
            all_transfers = []
            next_cursor = None
            pages_fetched = 0
            max_pages = (max_results // page_size) + 1
            
            logger.info(
                f"Querying TRM transfers for {address[:10]}...",
                extra={'node_id': self.node_id}
            )
            
            while pages_fetched < max_pages:
                # Update cursor for pagination
                if next_cursor:
                    request_body['page']['after'] = next_cursor
                
                response = client.get_address_transfers(request_body)
                
                transfers = response.get('data', [])
                all_transfers.extend(transfers)
                
                # Check for more pages
                meta = response.get('meta', {})
                next_cursor = meta.get('nextCursor')
                
                pages_fetched += 1
                
                # Log progress
                logger.info(
                    f"Fetched page {pages_fetched}, total transfers: {len(all_transfers)}",
                    extra={'node_id': self.node_id}
                )
                
                # Stop if no more pages or reached max results
                if not next_cursor or len(all_transfers) >= max_results:
                    break
            
            # Trim to max results
            all_transfers = all_transfers[:max_results]
            
            # Calculate statistics
            total_volume = sum(
                float(t.get('amountUsd', 0)) 
                for t in all_transfers
            )
            
            incoming = [t for t in all_transfers if t.get('direction') == 'IN']
            outgoing = [t for t in all_transfers if t.get('direction') == 'OUT']
            
            output_data = {
                'transfers': all_transfers,
                'transfer_count': len(all_transfers),
                'total_volume_usd': total_volume,
                'incoming_count': len(incoming),
                'outgoing_count': len(outgoing),
                'has_more': next_cursor is not None,
                'address': address
            }
            
            # Format message
            message = (
                f"Found {len(all_transfers)} transfers, "
                f"Volume: ${total_volume:,.2f} "
                f"({len(incoming)} in, {len(outgoing)} out)"
            )
            
            logger.info(message, extra={'node_id': self.node_id})
            
            return NodeResult(
                status='SUCCESS',
                output_data=output_data,
                message=message
            )
            
        except TRMLabsAPIError as e:
            return self._handle_api_error(e)
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
```

#### TRM Client Method
```python
# backend/apps/integrations/trm_client.py

def get_address_transfers(self, request_body: dict) -> dict:
    """
    Get transfers for a blockchain address.
    
    Args:
        request_body: Request body with address and filters
        
    Returns:
        API response with transfer data
    """
    return self._make_request(
        method='POST',
        path='/public/v1/blockint/transfers/by-address',
        json_data=request_body
    )
```

---

## 4. Error Handling Strategy

### 4.1 API Error Handling

```python
# backend/apps/integrations/exceptions.py

class APIError(Exception):
    """Base API error"""
    pass

class ChainalysisAPIError(APIError):
    """Chainalysis-specific error"""
    
    ERROR_CODES = {
        400: "Bad request - invalid parameters",
        401: "Unauthorized - invalid API key",
        404: "Not found - address not in database",
        429: "Rate limit exceeded",
        500: "Internal server error",
        503: "Service unavailable"
    }
    
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        self.user_message = self.ERROR_CODES.get(
            status_code, 
            f"API error {status_code}"
        )
        super().__init__(f"{status_code}: {message}")

class TRMLabsAPIError(APIError):
    """TRM Labs-specific error"""
    
    ERROR_CODES = {
        400: "Bad request - check parameters",
        401: "Unauthorized - invalid API key",
        404: "Not found",
        405: "Method not allowed",
        406: "Not acceptable",
        429: "Rate limit exceeded - retry after delay",
        500: "Internal server error",
        503: "Service unavailable"
    }
    
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        self.user_message = self.ERROR_CODES.get(
            status_code,
            f"API error {status_code}"
        )
        super().__init__(f"{status_code}: {message}")

class TRMLabsRateLimitError(TRMLabsAPIError):
    """TRM Labs rate limit error"""
    
    def __init__(self, retry_after: int, message: str):
        self.retry_after = retry_after
        super().__init__(status_code=429, message=message)
```

### 4.2 Node Error Handling

```python
# backend/apps/nodes/base.py

class BaseNode:
    """Base class for all nodes"""
    
    def _handle_api_error(self, error: APIError) -> NodeResult:
        """
        Handle API errors gracefully.
        
        Args:
            error: API error exception
            
        Returns:
            NodeResult with error details
        """
        # Log error
        logger.error(
            f"API error: {error}",
            extra={
                'node_id': self.node_id,
                'error_type': type(error).__name__,
                'status_code': getattr(error, 'status_code', None)
            }
        )
        
        # Handle rate limit specially
        if isinstance(error, (TRMLabsRateLimitError, ChainalysisAPIError)) and \
           getattr(error, 'status_code', None) == 429:
            retry_after = getattr(error, 'retry_after', 60)
            return NodeResult(
                status='FAILED',
                error_message=f"Rate limit exceeded. Retry after {retry_after}s",
                metadata={'retry_after': retry_after, 'retryable': True}
            )
        
        # Handle authentication errors
        if getattr(error, 'status_code', None) == 401:
            return NodeResult(
                status='FAILED',
                error_message="Authentication failed. Check API credentials.",
                metadata={'retryable': False}
            )
        
        # Handle not found
        if getattr(error, 'status_code', None) == 404:
            return NodeResult(
                status='SUCCESS',  # Not an error, just no data
                output_data=self._get_empty_output(),
                message="Address not found in database",
                metadata={'no_data': True}
            )
        
        # Generic error
        return NodeResult(
            status='FAILED',
            error_message=getattr(error, 'user_message', str(error)),
            metadata={'retryable': error.status_code >= 500}
        )
    
    def _get_empty_output(self) -> dict:
        """Return empty output structure for node"""
        # Override in subclasses
        return {}
```

---

## 5. Rate Limiting Implementation

### 5.1 Rate Limiter Class

```python
# backend/apps/execution/rate_limiter.py

import time
from threading import Lock

class RateLimiter:
    """
    Rate limiter for API calls.
    Implements token bucket algorithm.
    """
    
    def __init__(self, requests_per_minute: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            requests_per_minute: Maximum requests per minute
        """
        self.requests_per_minute = requests_per_minute
        self.interval = 60.0 / requests_per_minute  # Seconds between requests
        self.last_request_time = {}
        self.lock = Lock()
    
    def wait_if_needed(self, key: str = 'default'):
        """
        Wait if necessary to respect rate limit.
        
        Args:
            key: Rate limit key (e.g., 'chainalysis', 'trm')
        """
        with self.lock:
            now = time.time()
            last_time = self.last_request_time.get(key, 0)
            time_since_last = now - last_time
            
            if time_since_last < self.interval:
                wait_time = self.interval - time_since_last
                logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
                time.sleep(wait_time)
            
            self.last_request_time[key] = time.time()
    
    def reset(self, key: str = 'default'):
        """Reset rate limiter for key"""
        with self.lock:
            self.last_request_time.pop(key, None)
```

### 5.2 Integration with API Clients

```python
# backend/apps/integrations/base_client.py

class BaseAPIClient:
    """Base class for API clients with rate limiting"""
    
    def __init__(self, rate_limiter: RateLimiter = None):
        self.rate_limiter = rate_limiter or RateLimiter(requests_per_minute=60)
    
    def _make_rate_limited_request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> requests.Response:
        """
        Make rate-limited API request.
        
        Args:
            method: HTTP method
            url: Request URL
            **kwargs: Additional request parameters
            
        Returns:
            Response object
        """
        # Wait if needed
        self.rate_limiter.wait_if_needed(key=self.provider_name)
        
        # Make request
        return self.session.request(method, url, **kwargs)
```

### 5.3 TRM Labs Rate Limit Response Handling

```python
# backend/apps/integrations/trm_client.py

class TRMLabsClient(BaseAPIClient):
    
    def _make_request(self, method: str, path: str, **kwargs) -> dict:
        """Make request with rate limit header handling"""
        
        response = self._make_rate_limited_request(
            method=method,
            url=f"{self.base_url}{path}",
            **kwargs
        )
        
        # Extract rate limit info from headers
        rate_limit_info = {
            'limit': response.headers.get('X-RateLimit-Limit'),
            'remaining': response.headers.get('X-RateLimit-Remaining'),
            'reset': response.headers.get('X-RateLimit-Reset')
        }
        
        logger.debug(f"Rate limit info: {rate_limit_info}")
        
        # Adjust rate limiter if approaching limit
        remaining = int(rate_limit_info.get('remaining', 999))
        if remaining < 10:
            logger.warning(f"Approaching rate limit: {remaining} requests remaining")
            # Slow down requests
            self.rate_limiter.interval *= 1.5
        
        # Handle rate limit error
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            raise TRMLabsRateLimitError(
                retry_after=retry_after,
                message=f"Rate limited. Retry after {retry_after}s"
            )
        
        if response.status_code not in [200, 201]:
            raise TRMLabsAPIError(
                status_code=response.status_code,
                message=response.text
            )
        
        return response.json()
```

---

## 6. Development Strategy

### 6.1 Phase 1: Foundation (Week 1)
**Goal:** Set up infrastructure without API calls

**Tasks:**
1. ✅ Set up Django project structure
2. ✅ Create all data models
3. ✅ Implement authentication system (without API validation)
4. ✅ Create base node classes
5. ✅ Set up React project with React Flow
6. ✅ Create basic UI layout

**Deliverable:** Working application with visual node editor, no API calls yet

---

### 6.2 Phase 2: Input Nodes (Week 2)
**Goal:** Implement all input functionality

**Tasks:**
1. ✅ Implement Single Address Input Node
   - Address validation (regex patterns)
   - Blockchain selection
2. ✅ Implement Batch Input Node
   - File upload system
   - CSV/Excel/PDF/Word parsers
   - Address validation
3. ✅ Implement file storage system
4. ✅ Create workflow save/load functionality

**Deliverable:** Can create workflows, add input nodes, validate addresses

**No API calls required yet**

---

### 6.3 Phase 3: TRM Labs Integration (Week 3)
**Goal:** Implement TRM Labs nodes (you have API access)

**Priority Order:**
1. **Address Attribution Node** - Start here (simplest GET request)
2. **Total Exposure Node** - Add exposure analysis
3. **Address Transfers Node** - Most complex (pagination)

**Development Approach:**
1. Implement TRM client with authentication
2. Build one node at a time
3. Test with real API calls (carefully, limited access)
4. Implement rate limiting
5. Add comprehensive error handling

**Deliverable:** Working TRM Labs integration with 3 functional nodes

---

### 6.4 Phase 4: Chainalysis Placeholder (Week 4)
**Goal:** Create Chainalysis nodes that work without API

**Approach:**
1. Implement all Chainalysis node classes
2. Add configuration UI
3. Create proper input/output pin structures
4. **Return empty/null results with warning message**
5. Log that API call would be made here

**Example Implementation:**
```python
class ChainalysisClusterBalanceNode(BaseNode):
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """Execute with placeholder - no actual API call"""
        
        address = self.get_input('address', context)
        
        logger.warning(
            f"Chainalysis API not configured. "
            f"Would query balance for {address}",
            extra={'node_id': self.node_id}
        )
        
        # Return empty but valid structure
        return NodeResult(
            status='SUCCESS',
            output_data={
                'balance': 0,
                'total_sent': 0,
                'total_received': 0,
                'transfer_count': 0,
                'deposit_count': 0,
                'withdrawal_count': 0,
                'address_count': 0,
                'address': address
            },
            message="⚠️ Chainalysis API not configured - placeholder data returned"
        )
```

**Deliverable:** All nodes exist and work, Chainalysis nodes return placeholder data

---

### 6.5 Phase 5: Output Nodes (Week 5)
**Goal:** Implement all export functionality

**Tasks:**
1. Implement Excel export (openpyxl)
2. Implement CSV export
3. Implement JSON export
4. Implement TXT export
5. Implement Console Log
6. Create download system

**Deliverable:** Complete workflows that produce downloadable results

---

### 6.6 Phase 6: Polish & Testing (Week 6)
**Goal:** Production-ready application

**Tasks:**
1. Comprehensive testing with TRM API
2. Error handling refinement
3. UI/UX improvements
4. Documentation
5. Example workflows
6. Performance optimization

**Deliverable:** Production-ready v1.0

---

### 6.7 Future: Chainalysis Integration
**When you get Chainalysis API access:**

1. Replace placeholder nodes with real API calls
2. Test with small data sets first
3. Validate response parsing
4. Enable all Chainalysis features

**No code changes needed** - just swap out the placeholder logic!

---

## Summary

This specification provides:

✅ **Real API integration details** - No mock data  
✅ **Complete node specifications** - All 21 nodes defined  
✅ **Production-ready code** - With error handling and rate limiting  
✅ **Development strategy** - Build without exhausting TRM API quota  
✅ **Future-proof design** - Easy to add Chainalysis later  

**Key Takeaway:** Build the entire application structure now, test thoroughly with TRM Labs API (carefully), and leave Chainalysis integration as placeholders until you have API access. The architecture supports this perfectly.