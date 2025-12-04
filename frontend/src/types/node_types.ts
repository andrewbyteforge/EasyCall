// =============================================================================
// FILE: frontend/src/types/node_types.ts
// =============================================================================
// TypeScript definitions for all 21 node types in the workflow builder.
// Includes node metadata, configuration schema, and pin definitions.
// =============================================================================

import { NodeCategory } from './workflow_types';

// =============================================================================
// NODE TYPE DEFINITIONS
// =============================================================================

/**
 * Node type identifier enum.
 */
export enum NodeType {
    // Configuration Nodes
    CREDENTIALS_CHAINALYSIS = 'credential_chainalysis',
    CREDENTIALS_TRM = 'credential_trm',

    // Input Nodes
    SINGLE_ADDRESS = 'single_address',
    BATCH_INPUT = 'batch_input',
    TRANSACTION_HASH = 'transaction_hash',

    // Chainalysis Query Nodes
    CHAINALYSIS_CLUSTER_INFO = 'chainalysis_cluster_info',
    CHAINALYSIS_CLUSTER_BALANCE = 'chainalysis_cluster_balance',
    CHAINALYSIS_CLUSTER_COUNTERPARTIES = 'chainalysis_cluster_counterparties',
    CHAINALYSIS_TRANSACTION_DETAILS = 'chainalysis_transaction_details',
    CHAINALYSIS_EXPOSURE_CATEGORY = 'chainalysis_exposure_category',
    CHAINALYSIS_EXPOSURE_SERVICE = 'chainalysis_exposure_service',

    // TRM Query Nodes
    TRM_ADDRESS_ATTRIBUTION = 'trm_address_attribution',
    TRM_TOTAL_EXPOSURE = 'trm_total_exposure',
    TRM_ADDRESS_SUMMARY = 'trm_address_summary',
    TRM_ADDRESS_TRANSFERS = 'trm_address_transfers',
    TRM_NETWORK_INTELLIGENCE = 'trm_network_intelligence',

    // Output Nodes
    TXT_EXPORT = 'txt_export',
    EXCEL_EXPORT = 'excel_export',
    JSON_EXPORT = 'json_export',
    CSV_EXPORT = 'csv_export',
    CONSOLE_LOG = 'console_log',
}

/**
 * Pin (connection point) definition.
 */
export interface PinDefinition {
    id: string;
    label: string;
    type: 'input' | 'output';
    dataType: string;
    required?: boolean;
    description?: string;
}

/**
 * Node configuration field definition.
 */
export interface ConfigFieldDefinition {
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'file' | 'password';
    description: string;
    required?: boolean;
    default?: any;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    min?: number;
    max?: number;
    accept?: string; // For file inputs
}

/**
 * Complete node type definition with metadata.
 */
export interface NodeTypeDefinition {
    type: NodeType;
    category: NodeCategory;
    name: string;
    description: string;
    longDescription: string;
    icon: string;
    color: string;
    inputs: PinDefinition[];
    outputs: PinDefinition[];
    configuration: ConfigFieldDefinition[];
    provider?: 'chainalysis' | 'trm';
}

// =============================================================================
// NODE REGISTRY - All 21 Node Types
// =============================================================================

export const NODE_REGISTRY: Record<NodeType, NodeTypeDefinition> = {
    // ===========================================================================
    // CONFIGURATION NODES
    // ===========================================================================

    [NodeType.CREDENTIALS_CHAINALYSIS]: {
        type: NodeType.CREDENTIALS_CHAINALYSIS,
        category: 'configuration',
        name: 'Chainalysis Credentials',
        description: 'Override global Chainalysis API credentials',
        longDescription: 'Provide workflow-specific Chainalysis Reactor API credentials. If not connected, query nodes use global settings.',
        icon: '🔑',
        color: '#4a148c',
        inputs: [],
        outputs: [
            {
                id: 'credentials',
                label: 'credentials',
                type: 'output',
                dataType: 'credentials',
                description: 'Chainalysis API credentials object',
            },
        ],
        configuration: [
            {
                name: 'label',
                label: 'Label',
                type: 'string',
                description: 'Friendly name for this credential set',
                default: 'Production',
                placeholder: 'e.g., Sandbox, Testing, Production',
            },
            {
                name: 'api_key',
                label: 'API Key',
                type: 'password',
                description: 'Chainalysis Reactor API token',
                required: true,
            },
            {
                name: 'api_url',
                label: 'API URL',
                type: 'string',
                description: 'Base URL for Chainalysis API',
                default: 'https://iapi.chainalysis.com',
                placeholder: 'https://iapi.chainalysis.com',
            },
        ],
        provider: 'chainalysis',
    },

    [NodeType.CREDENTIALS_TRM]: {
        type: NodeType.CREDENTIALS_TRM,
        category: 'configuration',
        name: 'TRM Labs Credentials',
        description: 'Override global TRM Labs API credentials',
        longDescription: 'Provide workflow-specific TRM Labs API credentials. If not connected, query nodes use global settings.',
        icon: '🔑',
        color: '#4a148c',
        inputs: [],
        outputs: [
            {
                id: 'credentials',
                label: 'credentials',
                type: 'output',
                dataType: 'credentials',
                description: 'TRM Labs API credentials object',
            },
        ],
        configuration: [
            {
                name: 'label',
                label: 'Label',
                type: 'string',
                description: 'Friendly name for this credential set',
                default: 'Production',
                placeholder: 'e.g., Sandbox, Testing, Production',
            },
            {
                name: 'api_key',
                label: 'API Key',
                type: 'password',
                description: 'TRM Labs API key',
                required: true,
            },
            {
                name: 'api_url',
                label: 'API URL',
                type: 'string',
                description: 'Base URL for TRM Labs API',
                default: 'https://api.trmlabs.com',
                placeholder: 'https://api.trmlabs.com',
            },
        ],
        provider: 'trm',
    },

    // ===========================================================================
    // INPUT NODES
    // ===========================================================================

    [NodeType.SINGLE_ADDRESS]: {
        type: NodeType.SINGLE_ADDRESS,
        category: 'input',
        name: 'Single Address Input',
        description: 'Manually enter a single cryptocurrency address',
        longDescription: 'Input a single blockchain address for investigation. Validates format based on selected blockchain.',
        icon: '📍',
        color: '#1976d2',
        inputs: [],
        outputs: [
            {
                id: 'address',
                label: 'address',
                type: 'output',
                dataType: 'string',
                description: 'Validated blockchain address',
            },
            {
                id: 'blockchain',
                label: 'blockchain',
                type: 'output',
                dataType: 'string',
                description: 'Blockchain identifier',
            },
        ],
        configuration: [
            {
                name: 'address',
                label: 'Address',
                type: 'string',
                description: 'Cryptocurrency address to analyze',
                required: true,
                placeholder: 'Enter blockchain address',
            },
            {
                name: 'blockchain',
                label: 'Blockchain',
                type: 'select',
                description: 'Blockchain network',
                required: true,
                default: 'bitcoin',
                options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                    { value: 'litecoin', label: 'Litecoin' },
                    { value: 'bitcoin_cash', label: 'Bitcoin Cash' },
                ],
            },
        ],
    },

    [NodeType.BATCH_INPUT]: {
        type: NodeType.BATCH_INPUT,
        category: 'input',
        name: 'Batch Address Input',
        description: 'Upload file with multiple addresses',
        longDescription: 'Import multiple blockchain addresses from CSV, Excel, PDF, or Word documents. Supports up to 10,000 addresses.',
        icon: '📁',
        color: '#1976d2',
        inputs: [],
        outputs: [
            {
                id: 'addresses',
                label: 'addresses',
                type: 'output',
                dataType: 'array',
                description: 'Array of validated addresses',
            },
            {
                id: 'count',
                label: 'count',
                type: 'output',
                dataType: 'number',
                description: 'Number of addresses loaded',
            },
            {
                id: 'blockchain',
                label: 'blockchain',
                type: 'output',
                dataType: 'string',
                description: 'Blockchain identifier',
            },
        ],
        configuration: [
            {
                name: 'file_upload',
                label: 'File',
                type: 'file',
                description: 'Upload file containing addresses',
                required: true,
                accept: '.csv,.xlsx,.pdf,.docx',
            },
            {
                name: 'file_format',
                label: 'File Format',
                type: 'select',
                description: 'Format of uploaded file',
                required: true,
                options: [
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'Excel' },
                    { value: 'pdf', label: 'PDF' },
                    { value: 'word', label: 'Word Document' },
                ],
            },
            {
                name: 'blockchain',
                label: 'Blockchain',
                type: 'select',
                description: 'Blockchain network for all addresses',
                required: true,
                default: 'bitcoin',
                options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ],
            },
        ],
    },

    [NodeType.TRANSACTION_HASH]: {
        type: NodeType.TRANSACTION_HASH,
        category: 'input',
        name: 'Transaction Hash Input',
        description: 'Enter a blockchain transaction hash',
        longDescription: 'Input a transaction hash for detailed transaction analysis.',
        icon: '🔗',
        color: '#1976d2',
        inputs: [],
        outputs: [
            {
                id: 'tx_hash',
                label: 'tx_hash',
                type: 'output',
                dataType: 'string',
                description: 'Transaction hash',
            },
            {
                id: 'blockchain',
                label: 'blockchain',
                type: 'output',
                dataType: 'string',
                description: 'Blockchain identifier',
            },
        ],
        configuration: [
            {
                name: 'tx_hash',
                label: 'Transaction Hash',
                type: 'string',
                description: 'Transaction hash to analyze',
                required: true,
                placeholder: 'Enter transaction hash',
            },
            {
                name: 'blockchain',
                label: 'Blockchain',
                type: 'select',
                description: 'Blockchain network',
                required: true,
                default: 'bitcoin',
                options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ],
            },
        ],
    },

    // ===========================================================================
    // CHAINALYSIS QUERY NODES (Placeholder implementations)
    // ===========================================================================

    [NodeType.CHAINALYSIS_CLUSTER_INFO]: {
        type: NodeType.CHAINALYSIS_CLUSTER_INFO,
        category: 'query',
        name: 'Cluster Info',
        description: 'Get cluster name and category (Chainalysis)',
        longDescription: 'Identifies which entity cluster an address belongs to. Returns cluster name, category, and root address.',
        icon: '🏢',
        color: '#00897b',
        inputs: [
            {
                id: 'credentials',
                label: 'credentials',
                type: 'input',
                dataType: 'credentials',
                description: 'Optional credentials override',
            },
            {
                id: 'address',
                label: 'address',
                type: 'input',
                dataType: 'string',
                required: true,
                description: 'Blockchain address to query',
            },
        ],
        outputs: [
            {
                id: 'cluster_name',
                label: 'cluster_name',
                type: 'output',
                dataType: 'string',
                description: 'Name of the entity',
            },
            {
                id: 'category',
                label: 'category',
                type: 'output',
                dataType: 'string',
                description: 'Entity category',
            },
            {
                id: 'address',
                label: 'address',
                type: 'output',
                dataType: 'string',
                description: 'Original address (pass-through)',
            },
        ],
        configuration: [
            {
                name: 'asset',
                label: 'Asset',
                type: 'select',
                description: 'Cryptocurrency asset',
                required: true,
                default: 'bitcoin',
                options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ],
            },
        ],
        provider: 'chainalysis',
    },

    [NodeType.CHAINALYSIS_CLUSTER_BALANCE]: {
        type: NodeType.CHAINALYSIS_CLUSTER_BALANCE,
        category: 'query',
        name: 'Cluster Balance',
        description: 'Get balance and transfer statistics (Chainalysis)',
        longDescription: 'Returns comprehensive balance and transfer statistics for a cluster.',
        icon: '💰',
        color: '#00897b',
        inputs: [
            {
                id: 'credentials',
                label: 'credentials',
                type: 'input',
                dataType: 'credentials',
            },
            {
                id: 'address',
                label: 'address',
                type: 'input',
                dataType: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'balance',
                label: 'balance',
                type: 'output',
                dataType: 'number',
            },
            {
                id: 'total_sent',
                label: 'total_sent',
                type: 'output',
                dataType: 'number',
            },
            {
                id: 'address',
                label: 'address',
                type: 'output',
                dataType: 'string',
            },
        ],
        configuration: [
            {
                name: 'asset',
                label: 'Asset',
                type: 'select',
                required: true,
                default: 'bitcoin',
                options: [
                    { value: 'bitcoin', label: 'Bitcoin' },
                    { value: 'ethereum', label: 'Ethereum' },
                ],
                description: 'Cryptocurrency type',
            },
        ],
        provider: 'chainalysis',
    },

    // Placeholder stubs for remaining Chainalysis nodes
    [NodeType.CHAINALYSIS_CLUSTER_COUNTERPARTIES]: {
        type: NodeType.CHAINALYSIS_CLUSTER_COUNTERPARTIES,
        category: 'query',
        name: 'Cluster Counterparties',
        description: 'Get transaction counterparties (Chainalysis)',
        longDescription: 'Returns entities that transacted with this cluster.',
        icon: '🤝',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'counterparties', label: 'counterparties', type: 'output', dataType: 'array' },
        ],
        configuration: [
            {
                name: 'asset',
                label: 'Asset',
                type: 'select',
                required: true,
                default: 'bitcoin',
                options: [{ value: 'bitcoin', label: 'Bitcoin' }],
                description: 'Cryptocurrency type',
            },
        ],
        provider: 'chainalysis',
    },

    [NodeType.CHAINALYSIS_TRANSACTION_DETAILS]: {
        type: NodeType.CHAINALYSIS_TRANSACTION_DETAILS,
        category: 'query',
        name: 'Transaction Details',
        description: 'Get transaction details (Chainalysis)',
        longDescription: 'Returns detailed information about a specific transaction.',
        icon: '📋',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'tx_hash', label: 'tx_hash', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'details', label: 'details', type: 'output', dataType: 'object' },
        ],
        configuration: [
            {
                name: 'asset',
                label: 'Asset',
                type: 'select',
                required: true,
                default: 'bitcoin',
                options: [{ value: 'bitcoin', label: 'Bitcoin' }],
                description: 'Cryptocurrency type',
            },
        ],
        provider: 'chainalysis',
    },

    [NodeType.CHAINALYSIS_EXPOSURE_CATEGORY]: {
        type: NodeType.CHAINALYSIS_EXPOSURE_CATEGORY,
        category: 'query',
        name: 'Exposure by Category',
        description: 'Get risk exposure by category (Chainalysis)',
        longDescription: 'Returns risk exposure analysis by category.',
        icon: '⚠️',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'exposures', label: 'exposures', type: 'output', dataType: 'array' },
            { id: 'total_risk', label: 'total_risk', type: 'output', dataType: 'number' },
        ],
        configuration: [
            {
                name: 'asset',
                label: 'Asset',
                type: 'select',
                required: true,
                default: 'bitcoin',
                options: [{ value: 'bitcoin', label: 'Bitcoin' }],
                description: 'Cryptocurrency type',
            },
        ],
        provider: 'chainalysis',
    },

    [NodeType.CHAINALYSIS_EXPOSURE_SERVICE]: {
        type: NodeType.CHAINALYSIS_EXPOSURE_SERVICE,
        category: 'query',
        name: 'Exposure by Service',
        description: 'Get risk exposure by service (Chainalysis)',
        longDescription: 'Returns risk exposure analysis by service.',
        icon: '🔍',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'services', label: 'services', type: 'output', dataType: 'array' },
        ],
        configuration: [
            {
                name: 'asset',
                label: 'Asset',
                type: 'select',
                required: true,
                default: 'bitcoin',
                options: [{ value: 'bitcoin', label: 'Bitcoin' }],
                description: 'Cryptocurrency type',
            },
        ],
        provider: 'chainalysis',
    },

    // ===========================================================================
    // TRM LABS QUERY NODES
    // ===========================================================================

    [NodeType.TRM_ADDRESS_ATTRIBUTION]: {
        type: NodeType.TRM_ADDRESS_ATTRIBUTION,
        category: 'query',
        name: 'Address Attribution',
        description: 'Get entities for address (TRM Labs)',
        longDescription: 'Returns entities associated with a blockchain address.',
        icon: '👤',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
            { id: 'blockchain', label: 'blockchain', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'entities', label: 'entities', type: 'output', dataType: 'array' },
            { id: 'entity_count', label: 'entity_count', type: 'output', dataType: 'number' },
        ],
        configuration: [],
        provider: 'trm',
    },

    [NodeType.TRM_TOTAL_EXPOSURE]: {
        type: NodeType.TRM_TOTAL_EXPOSURE,
        category: 'query',
        name: 'Total Exposure',
        description: 'Get total exposure analysis (TRM Labs)',
        longDescription: 'Returns exposure to different entities.',
        icon: '📊',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
            { id: 'blockchain', label: 'blockchain', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'exposures', label: 'exposures', type: 'output', dataType: 'array' },
            { id: 'total_volume', label: 'total_volume', type: 'output', dataType: 'number' },
        ],
        configuration: [],
        provider: 'trm',
    },

    // Placeholder stubs for remaining TRM nodes
    [NodeType.TRM_ADDRESS_SUMMARY]: {
        type: NodeType.TRM_ADDRESS_SUMMARY,
        category: 'query',
        name: 'Address Summary',
        description: 'Get address metrics (TRM Labs)',
        longDescription: 'Returns summary metrics for address.',
        icon: '📈',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'metrics', label: 'metrics', type: 'output', dataType: 'object' },
        ],
        configuration: [],
        provider: 'trm',
    },

    [NodeType.TRM_ADDRESS_TRANSFERS]: {
        type: NodeType.TRM_ADDRESS_TRANSFERS,
        category: 'query',
        name: 'Address Transfers',
        description: 'Get transfer history (TRM Labs)',
        longDescription: 'Returns list of transfers for address.',
        icon: '💸',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'transfers', label: 'transfers', type: 'output', dataType: 'array' },
        ],
        configuration: [],
        provider: 'trm',
    },

    [NodeType.TRM_NETWORK_INTELLIGENCE]: {
        type: NodeType.TRM_NETWORK_INTELLIGENCE,
        category: 'query',
        name: 'Network Intelligence',
        description: 'Get network intelligence (TRM Labs)',
        longDescription: 'Returns network intelligence data.',
        icon: '🌐',
        color: '#00897b',
        inputs: [
            { id: 'credentials', label: 'credentials', type: 'input', dataType: 'credentials' },
            { id: 'address', label: 'address', type: 'input', dataType: 'string', required: true },
        ],
        outputs: [
            { id: 'data', label: 'data', type: 'output', dataType: 'object' },
        ],
        configuration: [],
        provider: 'trm',
    },

    // ===========================================================================
    // OUTPUT NODES
    // ===========================================================================

    [NodeType.TXT_EXPORT]: {
        type: NodeType.TXT_EXPORT,
        category: 'output',
        name: 'Export to TXT',
        description: 'Export results as text file',
        longDescription: 'Generates a downloadable text file with workflow results.',
        icon: '📄',
        color: '#f57c00',
        inputs: [
            { id: 'data', label: 'data', type: 'input', dataType: 'any', required: true },
        ],
        outputs: [
            { id: 'file_url', label: 'file_url', type: 'output', dataType: 'string' },
        ],
        configuration: [
            {
                name: 'filename',
                label: 'Filename',
                type: 'string',
                description: 'Name of output file',
                default: 'results.txt',
                placeholder: 'results.txt',
            },
        ],
    },

    [NodeType.EXCEL_EXPORT]: {
        type: NodeType.EXCEL_EXPORT,
        category: 'output',
        name: 'Export to Excel',
        description: 'Export results as Excel spreadsheet',
        longDescription: 'Generates a formatted Excel file with workflow results.',
        icon: '📊',
        color: '#f57c00',
        inputs: [
            { id: 'data', label: 'data', type: 'input', dataType: 'any', required: true },
        ],
        outputs: [
            { id: 'file_url', label: 'file_url', type: 'output', dataType: 'string' },
        ],
        configuration: [
            {
                name: 'filename',
                label: 'Filename',
                type: 'string',
                description: 'Name of output file',
                default: 'results.xlsx',
                placeholder: 'results.xlsx',
            },
        ],
    },

    [NodeType.JSON_EXPORT]: {
        type: NodeType.JSON_EXPORT,
        category: 'output',
        name: 'Export to JSON',
        description: 'Export results as JSON file',
        longDescription: 'Generates a JSON file with workflow results.',
        icon: '📦',
        color: '#f57c00',
        inputs: [
            { id: 'data', label: 'data', type: 'input', dataType: 'any', required: true },
        ],
        outputs: [
            { id: 'file_url', label: 'file_url', type: 'output', dataType: 'string' },
        ],
        configuration: [
            {
                name: 'filename',
                label: 'Filename',
                type: 'string',
                description: 'Name of output file',
                default: 'results.json',
                placeholder: 'results.json',
            },
        ],
    },

    [NodeType.CSV_EXPORT]: {
        type: NodeType.CSV_EXPORT,
        category: 'output',
        name: 'Export to CSV',
        description: 'Export results as CSV file',
        longDescription: 'Generates a CSV file with workflow results.',
        icon: '📑',
        color: '#f57c00',
        inputs: [
            { id: 'data', label: 'data', type: 'input', dataType: 'any', required: true },
        ],
        outputs: [
            { id: 'file_url', label: 'file_url', type: 'output', dataType: 'string' },
        ],
        configuration: [
            {
                name: 'filename',
                label: 'Filename',
                type: 'string',
                description: 'Name of output file',
                default: 'results.csv',
                placeholder: 'results.csv',
            },
        ],
    },

    [NodeType.CONSOLE_LOG]: {
        type: NodeType.CONSOLE_LOG,
        category: 'output',
        name: 'Console Log',
        description: 'Display results in output panel',
        longDescription: 'Shows results in the workflow output panel for quick viewing.',
        icon: '🖥️',
        color: '#f57c00',
        inputs: [
            { id: 'data', label: 'data', type: 'input', dataType: 'any', required: true },
        ],
        outputs: [],
        configuration: [
            {
                name: 'label',
                label: 'Label',
                type: 'string',
                description: 'Label for output',
                default: 'Output',
                placeholder: 'Output',
            },
        ],
    },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get node definition by type.
 */
export function getNodeDefinition(type: NodeType): NodeTypeDefinition {
    return NODE_REGISTRY[type];
}

/**
 * Get all nodes of a specific category.
 */
export function getNodesByCategory(category: NodeCategory): NodeTypeDefinition[] {
    return Object.values(NODE_REGISTRY).filter(node => node.category === category);
}

/**
 * Get all node types as array.
 */
export function getAllNodeTypes(): NodeTypeDefinition[] {
    return Object.values(NODE_REGISTRY);
}