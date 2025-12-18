// =============================================================================
// FILE: frontend/src/types/node_types.ts
// =============================================================================
// Type definitions for all 21 node types in the workflow builder.
// Includes visual configuration, inputs, outputs, and documentation.
// =============================================================================

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Categories of nodes in the workflow builder.
 */
export enum NodeCategory {
    CONFIGURATION = 'configuration',
    INPUT = 'input',
    QUERY = 'query',
    OUTPUT = 'output',
}

/**
 * API providers for query nodes.
 */
export enum APIProvider {
    CHAINALYSIS = 'chainalysis',
    TRM = 'trm',
    NONE = 'none',
}

/**
 * Data types that can flow through node connections.
 */
export enum DataType {
    ADDRESS = 'address',
    ADDRESS_LIST = 'address_list',
    TRANSACTION = 'transaction',
    TRANSACTION_LIST = 'transaction_list',
    CREDENTIALS = 'credentials',
    JSON_DATA = 'json_data',
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    ANY = 'any',
}

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Input pin definition for a node.
 */
export interface NodeInput {
    id: string;
    label: string;
    type: DataType;
    required: boolean;
    description: string;
}

/**
 * Output pin definition for a node.
 */
export interface NodeOutput {
    id: string;
    label: string;
    type: DataType;
    description: string;
}

/**
 * Configuration field for a node.
 */
export interface NodeConfigField {
    id: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'password' | 'file' | 'filepath';
    required: boolean;
    default?: any;
    placeholder?: string;
    options?: { value: string; label: string }[];
    description: string;
}

/**
 * Visual styling for a node.
 */
export interface NodeVisual {
    icon: string;
    color: string;
    width: number;
    height: number;
}

/**
 * Documentation for a node type.
 */
export interface NodeDocumentation {
    name: string;
    description: string;
    longDescription: string;
    usage: string;
    examples: string[];
}

/**
 * Complete node type definition.
 * 
 * Note: Includes convenience properties (name, icon, description, etc.) 
 * for direct access alongside nested objects for organization.
 */
export interface NodeTypeDefinition {
    type: string;
    category: NodeCategory;
    provider: APIProvider;

    // =========================================================================
    // CONVENIENCE PROPERTIES (direct access for common properties)
    // =========================================================================
    name: string;               // Duplicates documentation.name
    icon: string;               // Duplicates visual.icon
    color: string;              // Duplicates visual.color
    description: string;        // Duplicates documentation.description
    longDescription?: string;   // Duplicates documentation.longDescription

    // =========================================================================
    // NESTED OBJECTS (organized structure)
    // =========================================================================
    visual: NodeVisual;
    documentation: NodeDocumentation;
    inputs: NodeInput[];
    outputs: NodeOutput[];
    configuration: NodeConfigField[];
}

// =============================================================================
// CATEGORY COLORS
// =============================================================================

/**
 * Color scheme for each node category (Unreal Engine Blueprint style).
 */
export const CATEGORY_COLORS: Record<NodeCategory, string> = {
    [NodeCategory.CONFIGURATION]: '#4a148c', // Deep purple
    [NodeCategory.INPUT]: '#1976d2',         // Blue
    [NodeCategory.QUERY]: '#00897b',         // Teal
    [NodeCategory.OUTPUT]: '#f57c00',        // Orange
};

// =============================================================================
// NODE TYPE DEFINITIONS
// =============================================================================

/**
 * All 21 node type definitions.
 */
export const NODE_TYPES: NodeTypeDefinition[] = [
    // =========================================================================
    // CONFIGURATION NODES (2)
    // =========================================================================
    {
        type: 'credential_chainalysis',
        category: NodeCategory.CONFIGURATION,
        provider: APIProvider.CHAINALYSIS,

        // Convenience properties
        name: 'Chainalysis Credentials',
        icon: '🔑',
        color: '#4a148c',
        description: 'Configure Chainalysis API credentials for this workflow',
        longDescription: 'Override global Chainalysis Reactor API credentials for this workflow. Useful for testing with sandbox credentials or using multiple API keys.',

        // Nested objects
        visual: {
            icon: '🔑',
            color: '#4a148c',
            width: 280,
            height: 150,
        },
        documentation: {
            name: 'Chainalysis Credentials',
            description: 'Configure Chainalysis API credentials for this workflow',
            longDescription: 'Override global Chainalysis Reactor API credentials for this workflow. Useful for testing with sandbox credentials or using multiple API keys.',
            usage: '1. Drag node onto canvas\n2. Double-click to edit\n3. Enter API token\n4. Connect to query nodes',
            examples: ['Use sandbox credentials for testing', 'Different API keys for different investigations'],
        },
        inputs: [],
        outputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, description: 'Chainalysis API credentials object' },
        ],
        configuration: [
            { id: 'label', label: 'Label', type: 'string', required: false, default: 'Production', placeholder: 'e.g., Sandbox, Production', description: 'Friendly name for this credential set' },
            { id: 'api_key', label: 'API Key', type: 'password', required: true, description: 'Chainalysis Reactor API token' },
            { id: 'api_url', label: 'API URL', type: 'string', required: false, default: 'https://iapi.chainalysis.com', description: 'Base URL for Chainalysis API' },
        ],
    },
    {
        type: 'credential_trm',
        category: NodeCategory.CONFIGURATION,
        provider: APIProvider.TRM,

        // Convenience properties
        name: 'TRM Labs Credentials',
        icon: '🔑',
        color: '#4a148c',
        description: 'Configure TRM Labs API credentials for this workflow',
        longDescription: 'Override global TRM Labs API credentials for this workflow.',

        // Nested objects
        visual: {
            icon: '🔑',
            color: '#4a148c',
            width: 280,
            height: 150,
        },
        documentation: {
            name: 'TRM Labs Credentials',
            description: 'Configure TRM Labs API credentials for this workflow',
            longDescription: 'Override global TRM Labs API credentials for this workflow.',
            usage: '1. Drag node onto canvas\n2. Double-click to edit\n3. Enter API key\n4. Connect to query nodes',
            examples: ['Use sandbox credentials', 'Multiple accounts'],
        },
        inputs: [],
        outputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, description: 'TRM Labs API credentials object' },
        ],
        configuration: [
            { id: 'label', label: 'Label', type: 'string', required: false, default: 'Production', description: 'Friendly name' },
            { id: 'api_key', label: 'API Key', type: 'password', required: true, description: 'TRM Labs API key' },
            { id: 'api_url', label: 'API URL', type: 'string', required: false, default: 'https://api.trmlabs.com', description: 'Base URL' },
        ],
    },

    // =========================================================================
    // INPUT NODES (3)
    // =========================================================================
    {
        type: 'single_address',
        category: NodeCategory.INPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'Single Address Input',
        icon: '📍',
        color: '#1976d2',
        description: 'Manually enter a single cryptocurrency address',
        longDescription: 'Input a single blockchain address for investigation. Validates address format based on selected blockchain.',

        // Nested objects
        visual: { icon: '📍', color: '#1976d2', width: 280, height: 180 },
        documentation: {
            name: 'Single Address Input',
            description: 'Manually enter a single cryptocurrency address',
            longDescription: 'Input a single blockchain address for investigation. Validates address format based on selected blockchain.',
            usage: '1. Drag onto canvas\n2. Enter address\n3. Select blockchain\n4. Connect to query nodes',
            examples: ['Bitcoin: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'Ethereum: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'],
        },
        inputs: [],
        outputs: [
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Validated blockchain address' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, description: 'Blockchain identifier' },
        ],
        configuration: [
            { id: 'address', label: 'Address', type: 'string', required: true, placeholder: 'Enter blockchain address', description: 'Cryptocurrency address to analyze' },
            {
                id: 'blockchain', label: 'Blockchain', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                    { value: 'solana', label: 'Solana' },
                    { value: 'bnb', label: 'BNB Chain' },
                    { value: 'xrp', label: 'XRP' },
                    { value: 'cardano', label: 'Cardano' },
                    { value: 'dogecoin', label: 'Dogecoin' },
                    { value: 'tron', label: 'Tron' },
                    { value: 'avalanche', label: 'Avalanche' },
                    { value: 'polygon', label: 'Polygon' },
                ], description: 'Blockchain network'
            },
        ],
    },
    {
        type: 'batch_input',
        category: NodeCategory.INPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'Batch Address Input',
        icon: '📁',
        color: '#1976d2',
        description: 'Upload file with multiple addresses for batch processing',
        longDescription: 'Import multiple blockchain addresses from CSV, Excel, PDF, or Word documents. Supports up to 10,000 addresses per workflow.',

        // Nested objects
        visual: { icon: '📁', color: '#1976d2', width: 300, height: 220 },
        documentation: {
            name: 'Batch Address Input',
            description: 'Upload file with multiple addresses for batch processing',
            longDescription: 'Import multiple blockchain addresses from CSV, Excel, PDF, or Word documents. Supports up to 10,000 addresses per workflow.',
            usage: '1. Drag onto canvas\n2. Upload file\n3. Select format\n4. Specify column\n5. Connect to query nodes',
            examples: ['CSV with 1,000 Bitcoin addresses', 'Excel spreadsheet with Ethereum addresses'],
        },
        inputs: [],
        outputs: [
            { id: 'addresses', label: 'addresses', type: DataType.ADDRESS_LIST, description: 'Array of validated addresses' },
            { id: 'count', label: 'count', type: DataType.NUMBER, description: 'Number of addresses' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, description: 'Blockchain identifier' },
        ],
        configuration: [
            { id: 'file', label: 'File', type: 'file', required: true, description: 'Upload file containing addresses' },
            {
                id: 'format', label: 'Format', type: 'select', required: true, options: [
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'Excel' },
                    { value: 'pdf', label: 'PDF' },
                    { value: 'word', label: 'Word' },
                ], description: 'File format'
            },
            {
                id: 'blockchain', label: 'Blockchain', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                    { value: 'solana', label: 'Solana' },
                    { value: 'bnb', label: 'BNB Chain' },
                    { value: 'xrp', label: 'XRP' },
                    { value: 'cardano', label: 'Cardano' },
                    { value: 'dogecoin', label: 'Dogecoin' },
                    { value: 'tron', label: 'Tron' },
                    { value: 'avalanche', label: 'Avalanche' },
                    { value: 'polygon', label: 'Polygon' },
                ], description: 'Blockchain network'
            },
        ],
    },
    {
        type: 'transaction_hash',
        category: NodeCategory.INPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'Transaction Hash Input',
        icon: '🔖',
        color: '#1976d2',
        description: 'Input a transaction hash for analysis',
        longDescription: 'Enter a blockchain transaction hash to analyze transaction details.',

        // Nested objects
        visual: { icon: '🔖', color: '#1976d2', width: 280, height: 180 },
        documentation: {
            name: 'Transaction Hash Input',
            description: 'Input a transaction hash for analysis',
            longDescription: 'Enter a blockchain transaction hash to analyze transaction details.',
            usage: '1. Enter transaction hash\n2. Select blockchain\n3. Connect to query nodes',
            examples: ['Bitcoin transaction hash'],
        },
        inputs: [],
        outputs: [
            { id: 'tx_hash', label: 'tx_hash', type: DataType.TRANSACTION, description: 'Transaction hash' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, description: 'Blockchain identifier' },
        ],
        configuration: [
            { id: 'tx_hash', label: 'Transaction Hash', type: 'string', required: true, placeholder: 'Enter transaction hash', description: 'Transaction hash to analyze' },
            {
                id: 'blockchain', label: 'Blockchain', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Blockchain network'
            },
        ],
    },
    {
        type: 'batch_transaction',
        category: NodeCategory.INPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'Batch Transaction Input',
        icon: '📋',
        color: '#1976d2',
        description: 'Upload file with multiple transaction hashes for batch processing',
        longDescription: 'Import multiple transaction hashes from CSV, Excel, PDF, or Word documents. Supports batch analysis of transactions.',

        // Nested objects
        visual: { icon: '📋', color: '#1976d2', width: 300, height: 220 },
        documentation: {
            name: 'Batch Transaction Input',
            description: 'Upload file with multiple transaction hashes for batch processing',
            longDescription: 'Import multiple transaction hashes from CSV, Excel, PDF, or Word documents. Supports batch analysis of transactions.',
            usage: '1. Drag onto canvas\n2. Upload file\n3. Select format\n4. Specify column\n5. Connect to query nodes',
            examples: ['CSV with Bitcoin transaction hashes', 'Excel spreadsheet with Ethereum tx hashes'],
        },
        inputs: [],
        outputs: [
            { id: 'tx_hashes', label: 'tx_hashes', type: DataType.TRANSACTION_LIST, description: 'Array of transaction hashes' },
            { id: 'count', label: 'count', type: DataType.NUMBER, description: 'Number of transactions' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, description: 'Blockchain identifier' },
        ],
        configuration: [
            { id: 'file', label: 'File', type: 'file', required: true, description: 'Upload file containing transaction hashes' },
            {
                id: 'format', label: 'Format', type: 'select', required: true, options: [
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'Excel' },
                    { value: 'pdf', label: 'PDF' },
                    { value: 'word', label: 'Word' },
                ], description: 'File format'
            },
            {
                id: 'blockchain', label: 'Blockchain', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Blockchain network'
            },
            { id: 'column', label: 'Column Name/Index', type: 'string', required: false, default: '0', placeholder: 'Column name or index (0-based)', description: 'Column containing transaction hashes' },
        ],
    },

    // =========================================================================
    // QUERY NODES - CHAINALYSIS (6)
    // =========================================================================
    {
        type: 'chainalysis_cluster_info',
        category: NodeCategory.QUERY,
        provider: APIProvider.CHAINALYSIS,

        // Convenience properties
        name: 'Cluster Info (Chainalysis)',
        icon: '🏢',
        color: '#00897b',
        description: 'Get cluster name, category, and root address',
        longDescription: 'Queries Chainalysis to identify which entity cluster an address belongs to.',

        // Nested objects
        visual: { icon: '🏢', color: '#00897b', width: 300, height: 200 },
        documentation: {
            name: 'Cluster Info (Chainalysis)',
            description: 'Get cluster name, category, and root address',
            longDescription: 'Queries Chainalysis to identify which entity cluster an address belongs to.',
            usage: 'Connect address → Execute → View cluster info',
            examples: ['Identify if address belongs to an exchange'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials override' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
        ],
        outputs: [
            { id: 'cluster_name', label: 'cluster_name', type: DataType.STRING, description: 'Cluster entity name' },
            { id: 'category', label: 'category', type: DataType.STRING, description: 'Cluster category' },
            { id: 'cluster_address', label: 'cluster_address', type: DataType.ADDRESS, description: 'Root address' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [
            {
                id: 'asset', label: 'Asset', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Cryptocurrency asset'
            },
        ],
    },
    {
        type: 'chainalysis_cluster_balance',
        category: NodeCategory.QUERY,
        provider: APIProvider.CHAINALYSIS,

        // Convenience properties
        name: 'Cluster Balance (Chainalysis)',
        icon: '💰',
        color: '#00897b',
        description: 'Get cluster balance and transfer statistics',
        longDescription: 'Returns comprehensive balance and transfer statistics for a cluster.',

        // Nested objects
        visual: { icon: '💰', color: '#00897b', width: 320, height: 240 },
        documentation: {
            name: 'Cluster Balance (Chainalysis)',
            description: 'Get cluster balance and transfer statistics',
            longDescription: 'Returns comprehensive balance and transfer statistics for a cluster.',
            usage: 'Connect address → Execute → View balance data',
            examples: ['Get exchange wallet balance'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
        ],
        outputs: [
            { id: 'balance', label: 'balance', type: DataType.NUMBER, description: 'Current balance' },
            { id: 'total_sent', label: 'total_sent', type: DataType.NUMBER, description: 'Total sent' },
            { id: 'total_received', label: 'total_received', type: DataType.NUMBER, description: 'Total received' },
            { id: 'transfer_count', label: 'transfer_count', type: DataType.NUMBER, description: 'Transfer count' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [
            {
                id: 'asset', label: 'Asset', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Cryptocurrency asset'
            },
            {
                id: 'output_asset', label: 'Output Asset', type: 'select', required: false, default: 'NATIVE', options: [
                    { value: 'NATIVE', label: 'Native Currency' },
                    { value: 'USD', label: 'USD' },
                ], description: 'Output currency'
            },
        ],
    },
    {
        type: 'chainalysis_cluster_counterparties',
        category: NodeCategory.QUERY,
        provider: APIProvider.CHAINALYSIS,

        // Convenience properties
        name: 'Cluster Counterparties (Chainalysis)',
        icon: '🔄',
        color: '#00897b',
        description: 'Get addresses that transacted with this cluster',
        longDescription: 'Returns list of counterparties that have transacted with the cluster.',

        // Nested objects
        visual: { icon: '🔄', color: '#00897b', width: 340, height: 220 },
        documentation: {
            name: 'Cluster Counterparties (Chainalysis)',
            description: 'Get addresses that transacted with this cluster',
            longDescription: 'Returns list of counterparties that have transacted with the cluster.',
            usage: 'Connect address → Execute → View counterparties',
            examples: ['Find who transacted with an exchange'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
        ],
        outputs: [
            { id: 'counterparties', label: 'counterparties', type: DataType.JSON_DATA, description: 'List of counterparties' },
            { id: 'count', label: 'count', type: DataType.NUMBER, description: 'Number of counterparties' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [
            {
                id: 'asset', label: 'Asset', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Cryptocurrency asset'
            },
            {
                id: 'direction', label: 'Direction', type: 'select', required: true, default: 'sent', options: [
                    { value: 'sent', label: 'Sent (Outgoing)' },
                    { value: 'received', label: 'Received (Incoming)' },
                ], description: 'Transaction direction to analyze'
            },
            {
                id: 'output_asset', label: 'Output Asset', type: 'select', required: false, default: 'NATIVE', options: [
                    { value: 'NATIVE', label: 'Native Currency' },
                    { value: 'USD', label: 'USD' },
                ], description: 'Output currency for values'
            },
        ],
    },
    {
        type: 'chainalysis_transaction_details',
        category: NodeCategory.QUERY,
        provider: APIProvider.CHAINALYSIS,

        // Convenience properties
        name: 'Transaction Details (Chainalysis)',
        icon: '📝',
        color: '#00897b',
        description: 'Get detailed information about a transaction',
        longDescription: 'Returns comprehensive details about a blockchain transaction.',

        // Nested objects
        visual: { icon: '📝', color: '#00897b', width: 320, height: 200 },
        documentation: {
            name: 'Transaction Details (Chainalysis)',
            description: 'Get detailed information about a transaction',
            longDescription: 'Returns comprehensive details about a blockchain transaction.',
            usage: 'Connect transaction hash → Execute → View details',
            examples: ['Analyze suspicious transaction'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'tx_hash', label: 'tx_hash', type: DataType.TRANSACTION, required: true, description: 'Transaction hash' },
        ],
        outputs: [
            { id: 'transaction_details', label: 'transaction_details', type: DataType.JSON_DATA, description: 'Transaction details' },
            { id: 'tx_hash', label: 'tx_hash', type: DataType.TRANSACTION, description: 'Original hash' },
            { id: 'inputs', label: 'inputs', type: DataType.JSON_DATA, description: 'Transaction inputs' },
            { id: 'outputs', label: 'outputs', type: DataType.JSON_DATA, description: 'Transaction outputs' },
            { id: 'fee', label: 'fee', type: DataType.NUMBER, description: 'Transaction fee' },
            { id: 'block_height', label: 'block_height', type: DataType.NUMBER, description: 'Block height' },
        ],
        configuration: [
            {
                id: 'asset', label: 'Asset', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Cryptocurrency asset'
            },
            {
                id: 'output_asset', label: 'Output Asset', type: 'select', required: false, default: 'NATIVE', options: [
                    { value: 'NATIVE', label: 'Native Currency' },
                    { value: 'USD', label: 'USD' },
                ], description: 'Output currency for values'
            },
        ],
    },
    {
        type: 'chainalysis_exposure_category',
        category: NodeCategory.QUERY,
        provider: APIProvider.CHAINALYSIS,

        // Convenience properties
        name: 'Exposure by Category (Chainalysis)',
        icon: '⚠️',
        color: '#00897b',
        description: 'Get exposure to risk categories',
        longDescription: 'Returns exposure analysis to different risk categories like darknet, ransomware, etc.',

        // Nested objects
        visual: { icon: '⚠️', color: '#00897b', width: 340, height: 260 },
        documentation: {
            name: 'Exposure by Category (Chainalysis)',
            description: 'Get exposure to risk categories',
            longDescription: 'Returns exposure analysis to different risk categories like darknet, ransomware, etc.',
            usage: 'Connect address → Execute → View risk exposure',
            examples: ['Check for darknet exposure'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
        ],
        outputs: [
            { id: 'direct_exposure', label: 'direct_exposure', type: DataType.JSON_DATA, description: 'Direct exposure data' },
            { id: 'indirect_exposure', label: 'indirect_exposure', type: DataType.JSON_DATA, description: 'Indirect exposure data' },
            { id: 'total_risk', label: 'total_risk', type: DataType.NUMBER, description: 'Combined exposure value' },
            { id: 'high_risk_flags', label: 'high_risk_flags', type: DataType.JSON_DATA, description: 'High-risk category flags' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [
            {
                id: 'asset', label: 'Asset', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Cryptocurrency asset'
            },
            {
                id: 'direction', label: 'Direction', type: 'select', required: true, default: 'sent', options: [
                    { value: 'sent', label: 'Sent (Outgoing)' },
                    { value: 'received', label: 'Received (Incoming)' },
                ], description: 'Direction to analyze'
            },
            {
                id: 'output_asset', label: 'Output Asset', type: 'select', required: false, default: 'USD', options: [
                    { value: 'NATIVE', label: 'Native Currency' },
                    { value: 'USD', label: 'USD' },
                ], description: 'Output currency for exposure values'
            },
        ],
    },
    {
        type: 'chainalysis_exposure_service',
        category: NodeCategory.QUERY,
        provider: APIProvider.CHAINALYSIS,

        // Convenience properties
        name: 'Exposure by Service (Chainalysis)',
        icon: '🏪',
        color: '#00897b',
        description: 'Get exposure to specific services',
        longDescription: 'Returns exposure to specific known services and entities.',

        // Nested objects
        visual: { icon: '🏪', color: '#00897b', width: 320, height: 220 },
        documentation: {
            name: 'Exposure by Service (Chainalysis)',
            description: 'Get exposure to specific services',
            longDescription: 'Returns exposure to specific known services and entities.',
            usage: 'Connect address → Execute → View service exposure',
            examples: ['Check exchange exposure'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
        ],
        outputs: [
            { id: 'direct_exposure', label: 'direct_exposure', type: DataType.JSON_DATA, description: 'Direct service exposure' },
            { id: 'indirect_exposure', label: 'indirect_exposure', type: DataType.JSON_DATA, description: 'Indirect service exposure' },
            { id: 'service_count', label: 'service_count', type: DataType.NUMBER, description: 'Total service count' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [
            {
                id: 'asset', label: 'Asset', type: 'select', required: true, default: 'bitcoin', options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ], description: 'Cryptocurrency asset'
            },
            {
                id: 'direction', label: 'Direction', type: 'select', required: true, default: 'sent', options: [
                    { value: 'sent', label: 'Sent (Outgoing)' },
                    { value: 'received', label: 'Received (Incoming)' },
                ], description: 'Direction to analyze'
            },
            {
                id: 'output_asset', label: 'Output Asset', type: 'select', required: false, default: 'USD', options: [
                    { value: 'NATIVE', label: 'Native Currency' },
                    { value: 'USD', label: 'USD' },
                ], description: 'Output currency for exposure values'
            },
        ],
    },

    // =========================================================================
    // QUERY NODES - TRM LABS (5)
    // =========================================================================
    {
        type: 'trm_address_attribution',
        category: NodeCategory.QUERY,
        provider: APIProvider.TRM,

        // Convenience properties
        name: 'Address Attribution (TRM)',
        icon: '🎯',
        color: '#00897b',
        description: 'Get entities associated with an address',
        longDescription: 'Returns entities and attribution data for a blockchain address.',

        // Nested objects
        visual: { icon: '🎯', color: '#00897b', width: 300, height: 200 },
        documentation: {
            name: 'Address Attribution (TRM)',
            description: 'Get entities associated with an address',
            longDescription: 'Returns entities and attribution data for a blockchain address.',
            usage: 'Connect address → Execute → View attribution',
            examples: ['Identify address owner'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, required: true, description: 'Blockchain identifier' },
        ],
        outputs: [
            { id: 'entities', label: 'entities', type: DataType.JSON_DATA, description: 'Associated entities' },
            { id: 'entity_count', label: 'entity_count', type: DataType.NUMBER, description: 'Number of entities' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [],
    },
    {
        type: 'trm_total_exposure',
        category: NodeCategory.QUERY,
        provider: APIProvider.TRM,

        // Convenience properties
        name: 'Total Exposure (TRM)',
        icon: '📊',
        color: '#00897b',
        description: 'Get total exposure to entities',
        longDescription: 'Returns comprehensive exposure analysis to different entities and categories.',

        // Nested objects
        visual: { icon: '📊', color: '#00897b', width: 320, height: 240 },
        documentation: {
            name: 'Total Exposure (TRM)',
            description: 'Get total exposure to entities',
            longDescription: 'Returns comprehensive exposure analysis to different entities and categories.',
            usage: 'Connect address → Execute → View exposure',
            examples: ['Analyze risk exposure'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, required: true, description: 'Blockchain identifier' },
        ],
        outputs: [
            { id: 'exposures', label: 'exposures', type: DataType.JSON_DATA, description: 'Exposure data' },
            { id: 'total_volume', label: 'total_volume', type: DataType.NUMBER, description: 'Total exposure volume' },
            { id: 'high_risk_entities', label: 'high_risk_entities', type: DataType.JSON_DATA, description: 'High-risk entities' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [],
    },
    {
        type: 'trm_address_summary',
        category: NodeCategory.QUERY,
        provider: APIProvider.TRM,

        // Convenience properties
        name: 'Address Summary (TRM)',
        icon: '📋',
        color: '#00897b',
        description: 'Get comprehensive address metrics',
        longDescription: 'Returns summary metrics and analysis for an address.',

        // Nested objects
        visual: { icon: '📋', color: '#00897b', width: 300, height: 200 },
        documentation: {
            name: 'Address Summary (TRM)',
            description: 'Get comprehensive address metrics',
            longDescription: 'Returns summary metrics and analysis for an address.',
            usage: 'Connect address → Execute → View summary',
            examples: ['Get address overview'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, required: true, description: 'Blockchain identifier' },
        ],
        outputs: [
            { id: 'metrics', label: 'metrics', type: DataType.JSON_DATA, description: 'Address metrics' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [],
    },
    {
        type: 'trm_address_transfers',
        category: NodeCategory.QUERY,
        provider: APIProvider.TRM,

        // Convenience properties
        name: 'Address Transfers (TRM)',
        icon: '💸',
        color: '#00897b',
        description: 'Get list of transfers for an address',
        longDescription: 'Returns paginated list of all transfers associated with an address.',

        // Nested objects
        visual: { icon: '💸', color: '#00897b', width: 320, height: 220 },
        documentation: {
            name: 'Address Transfers (TRM)',
            description: 'Get list of transfers for an address',
            longDescription: 'Returns paginated list of all transfers associated with an address.',
            usage: 'Connect address → Execute → View transfers',
            examples: ['List all transactions'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
            { id: 'blockchain', label: 'blockchain', type: DataType.STRING, required: true, description: 'Blockchain identifier' },
        ],
        outputs: [
            { id: 'transfers', label: 'transfers', type: DataType.JSON_DATA, description: 'List of transfers' },
            { id: 'transfer_count', label: 'transfer_count', type: DataType.NUMBER, description: 'Number of transfers' },
            { id: 'total_volume_usd', label: 'total_volume_usd', type: DataType.NUMBER, description: 'Total volume in USD' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [
            {
                id: 'direction', label: 'Direction', type: 'select', required: false, default: 'BOTH', options: [
                    { value: 'BOTH', label: 'Both' },
                    { value: 'IN', label: 'Incoming' },
                    { value: 'OUT', label: 'Outgoing' },
                ], description: 'Transfer direction'
            },
            { id: 'max_results', label: 'Max Results', type: 'number', required: false, default: 100, description: 'Maximum transfers to return' },
        ],
    },
    {
        type: 'trm_network_intelligence',
        category: NodeCategory.QUERY,
        provider: APIProvider.TRM,

        // Convenience properties
        name: 'Network Intelligence (TRM)',
        icon: '🌐',
        color: '#00897b',
        description: 'Get network intelligence data',
        longDescription: 'Returns network-level intelligence including IP associations.',

        // Nested objects
        visual: { icon: '🌐', color: '#00897b', width: 300, height: 200 },
        documentation: {
            name: 'Network Intelligence (TRM)',
            description: 'Get network intelligence data',
            longDescription: 'Returns network-level intelligence including IP associations.',
            usage: 'Connect address → Execute → View network data',
            examples: ['Find IP associations'],
        },
        inputs: [
            { id: 'credentials', label: 'credentials', type: DataType.CREDENTIALS, required: false, description: 'Optional credentials' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, required: true, description: 'Address to query' },
        ],
        outputs: [
            { id: 'ip_data', label: 'ip_data', type: DataType.JSON_DATA, description: 'IP intelligence data' },
            { id: 'address', label: 'address', type: DataType.ADDRESS, description: 'Original address' },
        ],
        configuration: [],
    },

    // =========================================================================
    // OUTPUT NODES (5)
    // =========================================================================
    {
        type: 'output_path',
        category: NodeCategory.OUTPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'Output Path',
        icon: '📂',
        color: '#f57c00',
        description: 'Select output file location for exports',
        longDescription: 'Select the destination folder and filename. Connect export nodes file_path output here.',

        // Nested objects
        visual: { icon: '📂', color: '#f57c00', width: 280, height: 180 },
        documentation: {
            name: 'Output Path',
            description: 'Select output file location for exports',
            longDescription: 'Select the destination folder and filename. Connect export nodes file_path output here.',
            usage: '1. Drag onto canvas\n2. Click to select save location\n3. Connect export node file_path output here',
            examples: ['Save CSV to Desktop', 'Export to Documents folder'],
        },
        inputs: [
            { id: 'file_path_input', label: 'file_path_input', type: DataType.STRING, required: true, description: 'File path from export node' },
        ],
        outputs: [],
        configuration: [
            { id: 'output_path', label: 'Output Path', type: 'filepath', required: true, default: 'output.csv', description: 'Click to select output file location' },
        ],
    },
    {
        type: 'txt_export',
        category: NodeCategory.OUTPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'TXT Export',
        icon: '📄',
        color: '#f57c00',
        description: 'Export results to text file',
        longDescription: 'Exports connected data to a plain text file. Connect file_path output to Output Path node.',

        // Nested objects
        visual: { icon: '📄', color: '#f57c00', width: 260, height: 140 },
        documentation: {
            name: 'TXT Export',
            description: 'Export results to text file',
            longDescription: 'Exports connected data to a plain text file. Connect file_path output to Output Path node.',
            usage: 'Connect data input → Connect file_path output to Output Path node',
            examples: ['Export address list to text'],
        },
        inputs: [
            { id: 'data', label: 'data', type: DataType.ANY, required: true, description: 'Data to export' },
        ],
        outputs: [
            { id: 'file_path', label: 'file_path', type: DataType.STRING, description: 'Connect to Output Path node' },
        ],
        configuration: [],
    },
    {
        type: 'excel_export',
        category: NodeCategory.OUTPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'Excel Export',
        icon: '📊',
        color: '#f57c00',
        description: 'Export results to Excel spreadsheet',
        longDescription: 'Exports connected data to formatted Excel file. Connect file_path output to Output Path node.',

        // Nested objects
        visual: { icon: '📊', color: '#f57c00', width: 280, height: 160 },
        documentation: {
            name: 'Excel Export',
            description: 'Export results to Excel spreadsheet',
            longDescription: 'Exports connected data to formatted Excel file. Connect file_path output to Output Path node.',
            usage: 'Connect data input → Connect file_path output to Output Path node',
            examples: ['Export investigation results to Excel'],
        },
        inputs: [
            { id: 'data', label: 'data', type: DataType.ANY, required: true, description: 'Data to export' },
        ],
        outputs: [
            { id: 'file_path', label: 'file_path', type: DataType.STRING, description: 'Connect to Output Path node' },
        ],
        configuration: [
            { id: 'sheet_name', label: 'Sheet Name', type: 'string', required: false, default: 'Results', description: 'Excel sheet name' },
        ],
    },
    {
        type: 'json_export',
        category: NodeCategory.OUTPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'JSON Export',
        icon: '{ }',
        color: '#f57c00',
        description: 'Export results to JSON file',
        longDescription: 'Exports connected data to JSON format. Connect file_path output to Output Path node.',

        // Nested objects
        visual: { icon: '{ }', color: '#f57c00', width: 260, height: 160 },
        documentation: {
            name: 'JSON Export',
            description: 'Export results to JSON file',
            longDescription: 'Exports connected data to JSON format. Connect file_path output to Output Path node.',
            usage: 'Connect data input → Connect file_path output to Output Path node',
            examples: ['Export structured data to JSON'],
        },
        inputs: [
            { id: 'data', label: 'data', type: DataType.ANY, required: true, description: 'Data to export' },
        ],
        outputs: [
            { id: 'file_path', label: 'file_path', type: DataType.STRING, description: 'Connect to Output Path node' },
        ],
        configuration: [
            { id: 'pretty_print', label: 'Pretty Print', type: 'boolean', required: false, default: true, description: 'Format with indentation' },
        ],
    },
    {
        type: 'csv_export',
        category: NodeCategory.OUTPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'CSV Export',
        icon: '📋',
        color: '#f57c00',
        description: 'Export results to CSV file',
        longDescription: 'Exports connected data to CSV format. Connect file_path output to Output Path node.',

        // Nested objects
        visual: { icon: '📋', color: '#f57c00', width: 260, height: 140 },
        documentation: {
            name: 'CSV Export',
            description: 'Export results to CSV file',
            longDescription: 'Exports connected data to CSV format. Connect file_path output to Output Path node.',
            usage: 'Connect data input → Connect file_path output to Output Path node',
            examples: ['Export address data to CSV'],
        },
        inputs: [
            { id: 'data', label: 'data', type: DataType.ANY, required: true, description: 'Data to export' },
        ],
        outputs: [
            { id: 'file_path', label: 'file_path', type: DataType.STRING, description: 'Connect to Output Path node' },
        ],
        configuration: [],
    },
    {
        type: 'pdf_export',
        category: NodeCategory.OUTPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'PDF Report',
        icon: '📑',
        color: '#f57c00',
        description: 'Generate professional PDF report with graphs',
        longDescription: 'Creates a professional PDF report with EasyCall branding, data visualization graphs, and formatted tables. Connect file_path output to Output Path node.',

        // Nested objects
        visual: { icon: '📑', color: '#f57c00', width: 280, height: 180 },
        documentation: {
            name: 'PDF Report',
            description: 'Generate professional PDF report with graphs',
            longDescription: 'Creates a professional PDF report with EasyCall branding, data visualization graphs, and formatted tables. Includes executive summary and risk analysis.',
            usage: 'Connect data input → Configure report options → Connect file_path output to Output Path node',
            examples: ['Generate investigation report', 'Create compliance audit PDF'],
        },
        inputs: [
            { id: 'data', label: 'data', type: DataType.ANY, required: true, description: 'Data to include in report' },
        ],
        outputs: [
            { id: 'file_path', label: 'file_path', type: DataType.STRING, description: 'Connect to Output Path node' },
        ],
        configuration: [
            { id: 'report_title', label: 'Report Title', type: 'string', required: false, default: 'Blockchain Intelligence Report', placeholder: 'Enter report title', description: 'Title displayed on report cover' },
            {
                id: 'render_engine', label: 'Render Engine', type: 'select', required: false, default: 'template', options: [
                    { value: 'template', label: 'HTML/CSS Template (Recommended)' },
                    { value: 'reportlab', label: 'ReportLab (Classic)' },
                ], description: 'PDF generation method - Template offers more styling control'
            },
            { id: 'include_graphs', label: 'Include Graphs', type: 'boolean', required: false, default: true, description: 'Generate data visualization charts (ReportLab only)' },
            {
                id: 'graph_type', label: 'Graph Type', type: 'select', required: false, default: 'auto', options: [
                    { value: 'auto', label: 'Auto-detect' },
                    { value: 'bar', label: 'Bar Chart' },
                    { value: 'pie', label: 'Pie Chart' },
                    { value: 'line', label: 'Line Chart' },
                ], description: 'Type of chart to generate (ReportLab only)'
            },
        ],
    },
    {
        type: 'console_log',
        category: NodeCategory.OUTPUT,
        provider: APIProvider.NONE,

        // Convenience properties
        name: 'Console Log',
        icon: '🖥️',
        color: '#f57c00',
        description: 'Output data to execution log',
        longDescription: 'Outputs connected data to the execution log panel for debugging.',

        // Nested objects
        visual: { icon: '🖥️', color: '#f57c00', width: 260, height: 150 },
        documentation: {
            name: 'Console Log',
            description: 'Output data to execution log',
            longDescription: 'Outputs connected data to the execution log panel for debugging.',
            usage: 'Connect any data → Execute → View in output panel',
            examples: ['Debug workflow data flow'],
        },
        inputs: [
            { id: 'data', label: 'data', type: DataType.ANY, required: true, description: 'Data to log' },
        ],
        outputs: [],
        configuration: [
            { id: 'label', label: 'Label', type: 'string', required: false, default: 'Output', description: 'Label for log entry' },
            {
                id: 'format', label: 'Format', type: 'select', required: false, default: 'json', options: [
                    { value: 'json', label: 'JSON' },
                    { value: 'text', label: 'Text' },
                ], description: 'Output format'
            },
        ],
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all node types.
 * 
 * @returns Array of all node type definitions.
 */
export function getAllNodeTypes(): NodeTypeDefinition[] {
    return NODE_TYPES;
}

/**
 * Get node type by type string.
 * 
 * @param type - Node type identifier.
 * @returns Node type definition or undefined.
 */
export function getNodeType(type: string): NodeTypeDefinition | undefined {
    return NODE_TYPES.find((n) => n.type === type);
}

/**
 * Get node types by category.
 * 
 * @param category - Node category to filter by.
 * @returns Array of node type definitions in that category.
 */
export function getNodeTypesByCategory(category: NodeCategory): NodeTypeDefinition[] {
    return NODE_TYPES.filter((n) => n.category === category);
}

/**
 * Get node types by provider.
 * 
 * @param provider - API provider to filter by.
 * @returns Array of node type definitions for that provider.
 */
export function getNodeTypesByProvider(provider: APIProvider): NodeTypeDefinition[] {
    return NODE_TYPES.filter((n) => n.provider === provider);
}

/**
 * Get color for a node category.
 * 
 * @param category - Node category.
 * @returns Hex color string.
 */
export function getCategoryColor(category: NodeCategory): string {
    return CATEGORY_COLORS[category] || '#666666';
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default NODE_TYPES;
