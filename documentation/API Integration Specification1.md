# API Integration Specification
## Blockchain Intelligence Workflow Builder

**Version:** 1.0  
**Date:** December 4, 2025  
**Purpose:** Complete specification for implementing all 21 node types with real API integrations

---

## Table of Contents
1. [Authentication Implementation](#1-authentication-implementation)
2. [Node Specifications - Configuration](#2-node-specifications---configuration)
3. [Node Specifications - Input](#3-node-specifications---input)
4. [Node Specifications - Chainalysis Query](#4-node-specifications---chainalysis-query)
5. [Node Specifications - TRM Labs Query](#5-node-specifications---trm-labs-query)
6. [Node Specifications - Output](#6-node-specifications---output)
7. [Mock Data for Development](#7-mock-data-for-development)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [Testing Without API Calls](#9-testing-without-api-calls)

---

## 1. Authentication Implementation

### 1.1 Chainalysis Reactor API

#### Authentication Method
```python
# backend/apps/integrations/chainalysis_client.py

class ChainalysisClient:
    """Client for Chainalysis Reactor IAPI"""
    
    def __init__(self, api_key: str, base_url: str = None):
        """
        Initialize Chainalysis client.
        
        Args:
            api_key: Chainalysis API token
            base_url: Override default base URL (for testing)
        """
        self.api_key = api_key
        self.base_url = base_url or "https://iapi.chainalysis.com"
        self.session = requests.Session()
        
    def _get_headers(self) -> dict:
        """Build request headers"""
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Token": self.api_key
        }
    
    def _make_request(
        self, 
        method: str, 
        path: str, 
        params: dict = None,
        timeout: int = 30
    ) -> dict:
        """
        Make API request with error handling.
        
        Args:
            method: HTTP method (GET, POST)
            path: API path (e.g., "/clusters/{address}")
            params: Query parameters
            timeout: Request timeout in seconds
            
        Returns:
            JSON response data
            
        Raises:
            ChainalysisAPIError: On API errors
        """
        url = f"{self.base_url}{path}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=self._get_headers(),
                params=params,
                timeout=timeout
            )
            
            if response.status_code != 200:
                raise ChainalysisAPIError(
                    status_code=response.status_code,
                    message=response.text
                )
            
            return response.json()
            
        except requests.Timeout:
            raise ChainalysisAPIError(
                status_code=408,
                message="Request timeout"
            )
        except requests.RequestException as e:
            raise ChainalysisAPIError(
                status_code=500,
                message=str(e)
            )
```

#### Custom Exception
```python
# backend/apps/integrations/exceptions.py

class ChainalysisAPIError(Exception):
    """Chainalysis API error"""
    
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Chainalysis API Error {status_code}: {message}")
```

---

### 1.2 TRM Labs API

#### Authentication Method
```python
# backend/apps/integrations/trm_client.py

class TRMLabsClient:
    """Client for TRM Labs API"""
    
    def __init__(self, api_key: str, base_url: str = None):
        """
        Initialize TRM Labs client.
        
        Args:
            api_key: TRM Labs API key
            base_url: Override default base URL (for testing)
        """
        self.api_key = api_key
        self.base_url = base_url or "https://api.trmlabs.com"
        self.session = requests.Session()
        # TRM uses Basic Auth with API key as username, empty password
        self.session.auth = (api_key, '')
        
    def _make_request(
        self,
        method: str,
        path: str,
        params: dict = None,
        json_data: dict = None,
        timeout: int = 30
    ) -> dict:
        """
        Make API request with error handling.
        
        Args:
            method: HTTP method (GET, POST)
            path: API path
            params: Query parameters
            json_data: JSON body for POST requests
            timeout: Request timeout in seconds
            
        Returns:
            JSON response data
            
        Raises:
            TRMLabsAPIError: On API errors
        """
        url = f"{self.base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                timeout=timeout
            )
            
            # Check for rate limit
            if response.status_code == 429:
                retry_after = response.headers.get('Retry-After', 60)
                raise TRMLabsRateLimitError(
                    retry_after=int(retry_after),
                    message=f"Rate limited. Retry after {retry_after}s"
                )
            
            if response.status_code not in [200, 201]:
                raise TRMLabsAPIError(
                    status_code=response.status_code,
                    message=response.text
                )
            
            return response.json()
            
        except requests.Timeout:
            raise TRMLabsAPIError(
                status_code=408,
                message="Request timeout"
            )
        except requests.RequestException as e:
            raise TRMLabsAPIError(
                status_code=500,
                message=str(e)
            )
    
    def _handle_rate_limit(self, response: requests.Response) -> dict:
        """
        Extract rate limit info from headers.
        
        Returns:
            Dict with rate limit information
        """
        return {
            'limit': response.headers.get('X-RateLimit-Limit'),
            'remaining': response.headers.get('X-RateLimit-Remaining'),
            'reset': response.headers.get('X-RateLimit-Reset')
        }
```

#### Custom Exceptions
```python
# backend/apps/integrations/exceptions.py

class TRMLabsAPIError(Exception):
    """TRM Labs API error"""
    
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"TRM Labs API Error {status_code}: {message}")

class TRMLabsRateLimitError(TRMLabsAPIError):
    """TRM Labs rate limit error"""
    
    def __init__(self, retry_after: int, message: str):
        self.retry_after = retry_after
        super().__init__(status_code=429, message=message)
```

---

## 2. Node Specifications - Configuration

### 2.1 Chainalysis Credentials Node

#### Visual Design
```
┌─────────────────────────────────┐
│ 🔑 Chainalysis Credentials      │
│     (Production)                │
├─────────────────────────────────┤
│                                 │
│  API Key: ••••••••              │
│  [Edit] [Test Connection]      │
│                                 │
│                                 │
│                   credentials ○ │
└─────────────────────────────────┘
```

#### Node Specification
```typescript
interface ChainalysisCredentialsNode {
  type: "credential_chainalysis";
  category: "configuration";
  provider: "chainalysis";
  
  visual: {
    icon: "🔑";
    color: "#4a148c"; // Deep purple
  };
  
  documentation: {
    name: "Chainalysis Credentials";
    description: "Override global Chainalysis API credentials for this workflow";
    
    longDescription: 
      "Use this node to provide workflow-specific Chainalysis Reactor API " +
      "credentials. If not connected, query nodes will use global settings. " +
      "Useful for testing with sandbox credentials or using multiple API keys.";
    
    usage: 
      "1. Drag node onto canvas\n" +
      "2. Double-click to edit\n" +
      "3. Paste your Chainalysis API token\n" +
      "4. Optionally override API URL for testing\n" +
      "5. Click 'Test Connection' to verify\n" +
      "6. Connect 'credentials' output to Chainalysis query nodes";
    
    examples: [
      "Use sandbox credentials for testing workflows",
      "Different API keys for different investigation types",
      "Override credentials for specific branches of workflow"
    ];
  };
  
  inputs: [];
  
  outputs: [
    {
      id: "credentials";
      label: "credentials";
      type: "credentials";
      description: "Chainalysis API credentials object";
    }
  ];
  
  configuration: {
    label: {
      type: "string";
      label: "Label";
      description: "Friendly name for this credential set";
      default: "Production";
      placeholder: "e.g., Sandbox, Testing, Production";
    };
    
    api_key: {
      type: "password";
      label: "API Key";
      description: "Chainalysis Reactor API token";
      required: true;
      validation: {
        minLength: 10;
      };
    };
    
    api_url: {
      type: "string";
      label: "API URL";
      description: "Base URL for Chainalysis API";
      default: "https://iapi.chainalysis.com";
      placeholder: "https://iapi.chainalysis.com";
    };
  };
}
```

#### Backend Implementation
```python
# backend/apps/nodes/configuration/credentials.py

class ChainalysisCredentialsNode(BaseNode):
    """
    Chainalysis API credentials node.
    Provides encrypted credentials to downstream nodes.
    """
    
    node_type = "credential_chainalysis"
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """
        Execute node: validate and encrypt credentials.
        
        Args:
            context: Execution context
            
        Returns:
            NodeResult with encrypted credentials
        """
        try:
            config = self.configuration
            
            # Encrypt API key for secure storage
            encrypted_key = self._encrypt_api_key(config['api_key'])
            
            # Build credentials object
            credentials = {
                'provider': 'chainalysis',
                'api_key_encrypted': encrypted_key,
                'api_url': config.get('api_url', 'https://iapi.chainalysis.com'),
                'label': config.get('label', 'Default')
            }
            
            return NodeResult(
                status='SUCCESS',
                output_data={'credentials': credentials},
                message=f"Credentials ready: {credentials['label']}"
            )
            
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
    
    def test_connection(self, api_key: str, api_url: str) -> dict:
        """
        Test API connection without executing workflow.
        
        Args:
            api_key: API key to test
            api_url: API URL to test
            
        Returns:
            Dict with test results
        """
        try:
            client = ChainalysisClient(api_key, api_url)
            
            # Test with a known address (Satoshi's genesis address)
            test_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            
            start = time.time()
            result = client.get_cluster_name_and_category(
                address=test_address,
                asset="bitcoin"
            )
            elapsed = time.time() - start
            
            return {
                'success': True,
                'message': 'Connection successful',
                'response_time': round(elapsed, 2),
                'cluster_name': result.get('clusterName', 'N/A')
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': str(e),
                'response_time': None
            }
```

#### Hover Tooltip Content
```
┌────────────────────────────────────────────────────┐
│ 🔑 Chainalysis Credentials                         │
├────────────────────────────────────────────────────┤
│ DESCRIPTION:                                       │
│ Override global Chainalysis API credentials for    │
│ this workflow. Useful for testing with sandbox     │
│ keys or using multiple API accounts.               │
│                                                    │
│ INPUTS:                                            │
│ None (configuration node)                          │
│                                                    │
│ OUTPUTS:                                           │
│  ○ credentials (Credentials)                      │
│    → Encrypted credential object passed to        │
│      Chainalysis query nodes                      │
│                                                    │
│ CONFIGURATION:                                     │
│  • Label: Friendly name (e.g., "Production")     │
│  • API Key: Chainalysis Reactor token (required) │
│  • API URL: Base URL (default: IAPI endpoint)    │
│                                                    │
│ USAGE:                                             │
│ Connect to any Chainalysis query node's           │
│ 'credentials' input pin. If not connected, nodes  │
│ use global settings from Settings panel.          │
│                                                    │
│ SECURITY:                                          │
│ API keys are encrypted at rest using Fernet       │
│ encryption and never logged or exposed in API     │
│ responses.                                         │
└────────────────────────────────────────────────────┘
```

---

### 2.2 TRM Labs Credentials Node

*(Similar structure to Chainalysis, but with TRM-specific details)*

```typescript
interface TRMLabsCredentialsNode {
  type: "credential_trm";
  category: "configuration";
  provider: "trm";
  
  visual: {
    icon: "🔑";
    color: "#00897b"; // Teal
  };
  
  // ... similar structure ...
}
```

---

## 3. Node Specifications - Input

### 3.1 Single Address Input Node

#### Visual Design
```
┌─────────────────────────────────┐
│ 📍 Single Address               │
├─────────────────────────────────┤
│                                 │
│  Address:                       │
│  [1A1zP1eP5...          ]      │
│                                 │
│  Blockchain: [Bitcoin    ▼]    │
│                                 │
│                                 │
│                       address ○ │
│                    blockchain ○ │
└─────────────────────────────────┘
```

#### Node Specification
```typescript
interface SingleAddressInputNode {
  type: "single_address";
  category: "input";
  
  visual: {
    icon: "📍";
    color: "#1976d2"; // Blue
  };
  
  documentation: {
    name: "Single Address Input";
    description: "Manually enter a single cryptocurrency address";
    
    longDescription:
      "Input a single blockchain address for investigation. The node " +
      "validates the address format based on the selected blockchain. " +
      "Supports Bitcoin (P2PKH, P2SH, Bech32), Ethereum, and other chains.";
    
    usage:
      "1. Drag node onto canvas\n" +
      "2. Enter cryptocurrency address\n" +
      "3. Select blockchain type\n" +
      "4. Address is validated automatically\n" +
      "5. Connect to query nodes";
    
    examples: [
      "Bitcoin: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "Ethereum: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "Litecoin: LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9"
    ];
    
    supportedChains: [
      "bitcoin", "ethereum", "litecoin", "bitcoin_cash",
      "dogecoin", "dash", "zcash", "tron", "binance_smart_chain",
      "polygon", "arbitrum", "optimism", "avalanche_c_chain",
      "solana", "cardano", "ripple", "stellar", "near", "sui"
    ];
  };
  
  inputs: [];
  
  outputs: [
    {
      id: "address";
      label: "address";
      type: "string";
      description: "Validated blockchain address";
    },
    {
      id: "blockchain";
      label: "blockchain";
      type: "string";
      description: "Blockchain identifier (e.g., 'bitcoin', 'ethereum')";
    }
  ];
  
  configuration: {
    address: {
      type: "string";
      label: "Address";
      description: "Cryptocurrency address to analyze";
      required: true;
      validation: {
        custom: "validateBlockchainAddress";
      };
      placeholder: "Enter blockchain address";
    };
    
    blockchain: {
      type: "select";
      label: "Blockchain";
      description: "Blockchain network";
      required: true;
      default: "bitcoin";
      options: [
        { value: "bitcoin", label: "Bitcoin" },
        { value: "ethereum", label: "Ethereum" },
        { value: "litecoin", label: "Litecoin" },
        { value: "bitcoin_cash", label: "Bitcoin Cash" },
        { value: "dogecoin", label: "Dogecoin" },
        { value: "tron", label: "TRON" },
        { value: "binance_smart_chain", label: "BNB Smart Chain" },
        { value: "polygon", label: "Polygon" },
        { value: "arbitrum", label: "Arbitrum" },
        { value: "optimism", label: "Optimism" },
        { value: "avalanche_c_chain", label: "Avalanche C-Chain" },
        { value: "solana", label: "Solana" },
        { value: "cardano", label: "Cardano" },
        { value: "ripple", label: "XRP Ledger" },
        { value: "stellar", label: "Stellar" },
        { value: "near", label: "NEAR Protocol" },
        { value: "sui", label: "Sui" }
      ];
    };
  };
}
```

#### Backend Implementation
```python
# backend/apps/nodes/input/single_address.py

class SingleAddressNode(BaseNode):
    """
    Single address input node.
    Validates and outputs a single blockchain address.
    """
    
    node_type = "single_address"
    
    # Address validation patterns
    ADDRESS_PATTERNS = {
        'bitcoin': {
            'p2pkh': r'^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$',
            'p2sh': r'^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$',
            'bech32': r'^(bc1)[a-z0-9]{39,87}$'
        },
        'ethereum': r'^0x[a-fA-F0-9]{40}$',
        'litecoin': r'^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$',
        'bitcoin_cash': r'^[13][a-km-zA-HJ-NP-Z1-9]{33}$|^((bitcoincash|bchreg|bchtest):)?(q|p)[a-z0-9]{41}$',
        'dogecoin': r'^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$',
        'tron': r'^T[a-zA-Z0-9]{33}$',
        'solana': r'^[1-9A-HJ-NP-Za-km-z]{32,44}$',
        'cardano': r'^addr1[a-z0-9]{58}$',
        'ripple': r'^r[0-9a-zA-Z]{24,34}$',
        'stellar': r'^G[A-Z2-7]{55}$',
    }
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """
        Execute node: validate and output address.
        
        Args:
            context: Execution context
            
        Returns:
            NodeResult with validated address
        """
        try:
            address = self.configuration['address'].strip()
            blockchain = self.configuration['blockchain']
            
            # Validate address format
            if not self._validate_address(address, blockchain):
                return NodeResult(
                    status='FAILED',
                    error_message=f"Invalid {blockchain} address format"
                )
            
            # Log for audit
            logger.info(
                f"Address input: {address[:10]}... on {blockchain}",
                extra={'node_id': self.node_id}
            )
            
            return NodeResult(
                status='SUCCESS',
                output_data={
                    'address': address,
                    'blockchain': blockchain
                },
                message=f"Address validated: {address[:10]}...{address[-6:]}"
            )
            
        except KeyError as e:
            return NodeResult(
                status='FAILED',
                error_message=f"Missing configuration: {e}"
            )
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
    
    def _validate_address(self, address: str, blockchain: str) -> bool:
        """
        Validate address format for blockchain.
        
        Args:
            address: Address to validate
            blockchain: Blockchain identifier
            
        Returns:
            True if valid, False otherwise
        """
        patterns = self.ADDRESS_PATTERNS.get(blockchain)
        
        if not patterns:
            # Blockchain not explicitly validated, allow through
            logger.warning(
                f"No validation pattern for {blockchain}, allowing address"
            )
            return True
        
        # Handle multi-pattern blockchains (like Bitcoin)
        if isinstance(patterns, dict):
            return any(
                re.match(pattern, address) 
                for pattern in patterns.values()
            )
        else:
            return bool(re.match(patterns, address))
```

---

### 3.2 Batch Input Node

#### Visual Design
```
┌─────────────────────────────────┐
│ 📁 Batch Address Input          │
├─────────────────────────────────┤
│                                 │
│  File: [Choose File]            │
│  addresses.csv (150 addresses)  │
│                                 │
│  Format: [CSV              ▼]  │
│  Column: [Address          ▼]  │
│  Blockchain: [Bitcoin      ▼]  │
│                                 │
│  ✓ 150 addresses validated      │
│                                 │
│                     addresses ○ │
│                         count ○ │
│                    blockchain ○ │
└─────────────────────────────────┘
```

#### Node Specification
```typescript
interface BatchInputNode {
  type: "batch_input";
  category: "input";
  
  visual: {
    icon: "📁";
    color: "#1976d2"; // Blue
  };
  
  documentation: {
    name: "Batch Address Input";
    description: "Upload file with multiple addresses for batch processing";
    
    longDescription:
      "Import multiple blockchain addresses from CSV, Excel, PDF, or " +
      "Word documents. Supports up to 10,000 addresses per workflow " +
      "(configurable in settings). Automatically validates all addresses " +
      "before processing.";
    
    usage:
      "1. Drag node onto canvas\n" +
      "2. Click 'Choose File' and upload file\n" +
      "3. Select file format\n" +
      "4. Specify column name (for CSV/Excel)\n" +
      "5. Select blockchain type\n" +
      "6. Node validates all addresses\n" +
      "7. Connect to query nodes for batch processing";
    
    examples: [
      "CSV with 1,000 Bitcoin addresses in 'Address' column",
      "Excel spreadsheet with Ethereum addresses in column B",
      "PDF report containing wallet addresses for investigation"
    ];
    
    supportedFormats: ["CSV", "Excel (.xlsx)", "PDF", "Word (.docx)"];
  };
  
  inputs: [];
  
  outputs: [
    {
      id: "addresses";
      label: "addresses";
      type: "array";
      description: "Array of validated blockchain addresses";
    },
    {
      id: "count";
      label: "count";
      type: "number";
      description: "Number of addresses loaded";
    },
    {
      id: "blockchain";
      label: "blockchain";
      type: "string";
      description: "Blockchain identifier";
    }
  ];
  
  configuration: {
    file_upload: {
      type: "file";
      label: "File";
      description: "Upload file containing addresses";
      required: true;
      accept: ".csv,.xlsx,.pdf,.docx";
      maxSize: 10485760; // 10MB
    };
    
    file_format: {
      type: "select";
      label: "File Format";
      description: "Format of uploaded file";
      required: true;
      options: [
        { value: "csv", label: "CSV" },
        { value: "excel", label: "Excel" },
        { value: "pdf", label: "PDF" },
        { value: "word", label: "Word Document" }
      ];
    };
    
    column_name: {
      type: "string";
      label: "Column Name";
      description: "Column containing addresses (CSV/Excel only)";
      default: "Address";
      placeholder: "e.g., Address, Wallet, account_id";
      showIf: { file_format: ["csv", "excel"] };
    };
    
    blockchain: {
      type: "select";
      label: "Blockchain";
      description: "Blockchain network for all addresses";
      required: true;
      default: "bitcoin";
      options: [
        { value: "bitcoin", label: "Bitcoin" },
        { value: "ethereum", label: "Ethereum" },
        // ... same as single address
      ];
    };
    
    skip_invalid: {
      type: "boolean";
      label: "Skip Invalid Addresses";
      description: "Continue processing if some addresses are invalid";
      default: true;
    };
  };
}
```

#### Backend Implementation
```python
# backend/apps/nodes/input/batch_input.py

class BatchInputNode(BaseNode):
    """
    Batch address input node.
    Parses files and validates multiple addresses.
    """
    
    node_type = "batch_input"
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """
        Execute node: parse file and validate addresses.
        
        Args:
            context: Execution context
            
        Returns:
            NodeResult with array of addresses
        """
        try:
            file_id = self.configuration['file_upload']
            file_format = self.configuration['file_format']
            blockchain = self.configuration['blockchain']
            skip_invalid = self.configuration.get('skip_invalid', True)
            
            # Retrieve uploaded file
            uploaded_file = UploadedFile.objects.get(id=file_id)
            
            # Parse file based on format
            parser = self._get_parser(file_format)
            raw_addresses = parser.extract_addresses(
                file_path=uploaded_file.file.path,
                column_name=self.configuration.get('column_name', 'Address')
            )
            
            # Validate addresses
            valid_addresses = []
            invalid_addresses = []
            
            for addr in raw_addresses:
                addr = addr.strip()
                if self._validate_address(addr, blockchain):
                    valid_addresses.append(addr)
                else:
                    invalid_addresses.append(addr)
            
            # Check batch size limit
            max_batch_size = self._get_batch_size_limit()
            if len(valid_addresses) > max_batch_size:
                return NodeResult(
                    status='FAILED',
                    error_message=f"Batch size ({len(valid_addresses)}) exceeds "
                                f"limit ({max_batch_size}). Adjust in settings."
                )
            
            # Handle invalid addresses
            if invalid_addresses and not skip_invalid:
                return NodeResult(
                    status='FAILED',
                    error_message=f"Found {len(invalid_addresses)} invalid addresses. "
                                f"Enable 'Skip Invalid' to continue."
                )
            
            # Log summary
            logger.info(
                f"Batch loaded: {len(valid_addresses)} valid, "
                f"{len(invalid_addresses)} invalid",
                extra={'node_id': self.node_id}
            )
            
            return NodeResult(
                status='SUCCESS',
                output_data={
                    'addresses': valid_addresses,
                    'count': len(valid_addresses),
                    'blockchain': blockchain
                },
                message=f"Loaded {len(valid_addresses)} addresses "
                       f"({len(invalid_addresses)} skipped)"
            )
            
        except UploadedFile.DoesNotExist:
            return NodeResult(
                status='FAILED',
                error_message="Uploaded file not found"
            )
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
    
    def _get_parser(self, file_format: str):
        """Get appropriate file parser"""
        parsers = {
            'csv': CSVParser(),
            'excel': ExcelParser(),
            'pdf': PDFParser(),
            'word': WordParser()
        }
        return parsers[file_format]
    
    def _get_batch_size_limit(self) -> int:
        """Get batch size limit from settings"""
        settings = GlobalSettings.load()
        return settings.batch_size_limit
```

#### File Parsers
```python
# backend/apps/files/parsers.py

class CSVParser:
    """Parse addresses from CSV files"""
    
    def extract_addresses(self, file_path: str, column_name: str) -> list:
        """
        Extract addresses from CSV column.
        
        Args:
            file_path: Path to CSV file
            column_name: Column containing addresses
            
        Returns:
            List of addresses
        """
        import csv
        
        addresses = []
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            if column_name not in reader.fieldnames:
                raise ValueError(f"Column '{column_name}' not found in CSV")
            
            for row in reader:
                address = row.get(column_name, '').strip()
                if address:
                    addresses.append(address)
        
        return addresses


class ExcelParser:
    """Parse addresses from Excel files"""
    
    def extract_addresses(self, file_path: str, column_name: str) -> list:
        """
        Extract addresses from Excel column.
        
        Args:
            file_path: Path to Excel file
            column_name: Column containing addresses
            
        Returns:
            List of addresses
        """
        import openpyxl
        
        wb = openpyxl.load_workbook(file_path, read_only=True)
        ws = wb.active
        
        # Find column index
        headers = [cell.value for cell in ws[1]]
        
        try:
            col_idx = headers.index(column_name)
        except ValueError:
            raise ValueError(f"Column '{column_name}' not found in Excel")
        
        # Extract addresses
        addresses = []
        for row in ws.iter_rows(min_row=2, values_only=True):
            address = str(row[col_idx]).strip() if row[col_idx] else ''
            if address:
                addresses.append(address)
        
        return addresses


class PDFParser:
    """Parse addresses from PDF files"""
    
    def extract_addresses(self, file_path: str, **kwargs) -> list:
        """
        Extract addresses from PDF text.
        Uses regex to find address-like patterns.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of potential addresses
        """
        import PyPDF2
        
        addresses = []
        
        with open(file_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            
            # Extract text from all pages
            text = ''
            for page in pdf_reader.pages:
                text += page.extract_text()
        
        # Find Bitcoin addresses (example pattern)
        btc_pattern = r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b'
        addresses.extend(re.findall(btc_pattern, text))
        
        # Find Ethereum addresses
        eth_pattern = r'\b0x[a-fA-F0-9]{40}\b'
        addresses.extend(re.findall(eth_pattern, text))
        
        return list(set(addresses))  # Remove duplicates


class WordParser:
    """Parse addresses from Word documents"""
    
    def extract_addresses(self, file_path: str, **kwargs) -> list:
        """
        Extract addresses from Word document text.
        
        Args:
            file_path: Path to Word file
            
        Returns:
            List of potential addresses
        """
        import docx
        
        doc = docx.Document(file_path)
        
        # Extract all text
        text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
        
        # Use same pattern matching as PDF
        addresses = []
        
        btc_pattern = r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b'
        addresses.extend(re.findall(btc_pattern, text))
        
        eth_pattern = r'\b0x[a-fA-F0-9]{40}\b'
        addresses.extend(re.findall(eth_pattern, text))
        
        return list(set(addresses))
```

---

## 4. Node Specifications - Chainalysis Query

### 4.1 Cluster Info Node

#### Visual Design
```
┌─────────────────────────────────┐
│ 🏢 Cluster Info                 │
│     (Chainalysis)               │
├─────────────────────────────────┤
│ ○ credentials                   │
│ ○ address                       │
│                                 │
│  Asset: [Bitcoin           ▼]  │
│                                 │
│                                 │
│                   cluster_name ○│
│                      category ○ │
│               cluster_address ○ │
│                       address ○ │
└─────────────────────────────────┘
```

#### Node Specification
```typescript
interface ClusterInfoNode {
  type: "chainalysis_cluster_info";
  category: "query";
  provider: "chainalysis";
  
  visual: {
    icon: "🏢";
    color: "#00897b"; // Teal
  };
  
  documentation: {
    name: "Cluster Info (Chainalysis)";
    description: "Get cluster name, category, and root address for a blockchain address";
    
    longDescription:
      "Queries Chainalysis to identify which entity cluster an address " +
      "belongs to. Returns the cluster name (e.g., 'Binance'), category " +
      "(e.g., 'exchange'), and cluster root address. Useful for identifying " +
      "known entities and service providers.";
    
    usage:
      "1. Connect address from input node\n" +
      "2. Optionally connect credentials node\n" +
      "3. Select cryptocurrency asset\n" +
      "4. Execute workflow\n" +
      "5. View cluster identification in output";
    
    examples: [
      "Identify if address belongs to an exchange",
      "Find the entity behind a wallet address",
      "Check if address is associated with known service"
    ];
    
    apiEndpoint: "GET /clusters/{address}";
    rateLimit: "Not specified in docs";
  };
  
  inputs: [
    {
      id: "credentials";
      label: "credentials";
      type: "credentials";
      required: false;
      description: "Optional Chainalysis credentials override";
    },
    {
      id: "address";
      label: "address";
      type: "string";
      required: true;
      description: "Blockchain address to query";
    }
  ];
  
  outputs: [
    {
      id: "cluster_name";
      label: "cluster_name";
      type: "string";
      description: "Name of the cluster entity";
      example: "Binance";
    },
    {
      id: "category";
      label: "category";
      type: "string";
      description: "Category of the cluster";
      example: "exchange";
    },
    {
      id: "cluster_address";
      label: "cluster_address";
      type: "string";
      description: "Root address of the cluster";
    },
    {
      id: "address";
      label: "address";
      type: "string";
      description: "Original address (pass-through)";
    }
  ];
  
  configuration: {
    asset: {
      type: "select";
      label: "Asset";
      description: "Cryptocurrency asset";
      required: true;
      default: "bitcoin";
      options: [
        { value: "bitcoin", label: "Bitcoin (BTC)" },
        { value: "ethereum", label: "Ethereum (ETH)" },
        { value: "litecoin", label: "Litecoin (LTC)" },
        { value: "bitcoin_cash", label: "Bitcoin Cash (BCH)" },
        // Add more as needed
      ];
    };
    
    timeout: {
      type: "number";
      label: "Timeout";
      description: "Request timeout in seconds";
      default: 30;
      min: 5;
      max: 300;
    };
  };
}
```

#### Backend Implementation
```python
# backend/apps/nodes/query/chainalysis/cluster_info.py

class ChainalysisClusterInfoNode(BaseNode):
    """
    Chainalysis cluster information node.
    Returns cluster name, category, and root address.
    """
    
    node_type = "chainalysis_cluster_info"
    
    def execute(self, context: ExecutionContext) -> NodeResult:
        """
        Execute node: query Chainalysis for cluster info.
        
        Args:
            context: Execution context containing input data
            
        Returns:
            NodeResult with cluster information
        """
        try:
            # Get inputs
            address = self.get_input('address', context)
            credentials = self.get_input('credentials', context)
            
            # Get configuration
            asset = self.configuration['asset']
            timeout = self.configuration.get('timeout', 30)
            
            # Get API client
            client = self._get_client(credentials)
            
            # Make API call
            logger.info(
                f"Querying Chainalysis cluster info for {address[:10]}...",
                extra={'node_id': self.node_id}
            )
            
            response = client.get_cluster_name_and_category(
                address=address,
                asset=asset
            )
            
            # Extract data from response
            cluster_name = response.get('clusterName', 'Unknown')
            category = response.get('category', 'Unknown')
            cluster_address = response.get('rootAddress', address)
            
            logger.info(
                f"Cluster identified: {cluster_name} ({category})",
                extra={'node_id': self.node_id}
            )
            
            return NodeResult(
                status='SUCCESS',
                output_data={
                    'cluster_name': cluster_name,
                    'category': category,
                    'cluster_address': cluster_address,
                    'address': address
                },
                message=f"Cluster: {cluster_name} ({category})"
            )
            
        except ChainalysisAPIError as e:
            return self._handle_api_error(e)
        except Exception as e:
            return NodeResult(
                status='FAILED',
                error_message=str(e)
            )
    
    def _get_client(self, credentials: dict = None) -> ChainalysisClient:
        """
        Get Chainalysis client with credentials.
        
        Args:
            credentials: Optional credentials from node
            
        Returns:
            Configured ChainalysisClient
        """
        if credentials:
            # Use credentials from node
            api_key = self._decrypt_api_key(
                credentials['api_key_encrypted']
            )
            api_url = credentials.get('api_url')
            return ChainalysisClient(api_key, api_url)
        else:
            # Use global settings
            settings = GlobalSettings.load()
            api_key = self._decrypt_api_key(
                settings.chainalysis_api_key
            )
            api_url = settings.chainalysis_api_url
            return ChainalysisClient(api_key, api_url)
```

#### API Request/Response Example
```python
# REQUEST
GET https://iapi.chainalysis.com/clusters/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?filterAsset=bitcoin

Headers:
{
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Token": "your-api-key-here"
}

# RESPONSE (200 OK)
{
    "clusterName": "Satoshi Nakamoto",
    "category": "person",
    "rootAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}

# RESPONSE (404 Not Found) - Address not in database
{
    "error": "Address not found"
}
```

#### Mock Data for Development
```python
# backend/apps/nodes/query/chainalysis/mocks.py

MOCK_CLUSTER_INFO_RESPONSES = {
    # Known exchange
    "1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s": {
        "clusterName": "Binance",
        "category": "exchange",
        "rootAddress": "1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s"
    },
    
    # Satoshi's address
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa": {
        "clusterName": "Satoshi Nakamoto",
        "category": "person",
        "rootAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    },
    
    # Unknown address
    "default": {
        "clusterName": "Unknown",
        "category": "unknown",
        "rootAddress": None
    }
}
```

#### Hover Tooltip
```
┌────────────────────────────────────────────────────┐
│ 🏢 Cluster Info (Chainalysis)                     │
├────────────────────────────────────────────────────┤
│ DESCRIPTION:                                       │
│ Identifies which entity cluster a blockchain       │
│ address belongs to. Returns the cluster name,      │
│ category, and root address.                        │
│                                                    │
│ INPUTS:                                            │
│  ○ credentials (Credentials, Optional)            │
│    → Override global Chainalysis credentials      │
│                                                    │
│  ○ address (String, Required)                     │
│    → Blockchain address to query                  │
│                                                    │
│ OUTPUTS:                                           │
│  ○ cluster_name (String)                          │
│    → Name of entity (e.g., "Binance")            │
│                                                    │
│  ○ category (String)                              │
│    → Entity category (e.g., "exchange")          │
│                                                    │
│  ○ cluster_address (String)                       │
│    → Root address of cluster                      │
│                                                    │
│  ○ address (String)                               │
│    → Original address (pass-through)              │
│                                                    │
│ CONFIGURATION:                                     │
│  • Asset: Cryptocurrency type (Bitcoin, etc.)     │
│  • Timeout: Request timeout (5-300 seconds)      │
│                                                    │
│ USAGE EXAMPLE:                                     │
│ Connect Single Address Input → Cluster Info →     │
│ Excel Export to identify entities for a list of   │
│ addresses.                                         │
│                                                    │
│ API: GET /clusters/{address}                      │
└────────────────────────────────────────────────────┘
```

---

### 4.2 Cluster Balance Node

*(Continuing with next node...)*

Due to length constraints, I'll provide a condensed version of the remaining nodes. Would you like me to:

**A)** Continue with all remaining Chainalysis nodes in detail (5 more)?
**B)** Skip to TRM Labs nodes (which you have access to and can test)?
**C)** Provide a summary table of all nodes with key details, then focus on the most critical 2-3 from each provider?

