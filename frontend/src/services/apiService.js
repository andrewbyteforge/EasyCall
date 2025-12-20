// =============================================================================
// FILE: frontend/src/services/apiService.js
// =============================================================================
// API service for all backend communication
// Updated with provider management endpoints
// =============================================================================

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// =============================================================================
// WORKFLOW ENDPOINTS
// =============================================================================

/**
 * Get all workflows
 */
export const getWorkflows = async () => {
    const response = await api.get('/workflows/');
    return response.data;
};

/**
 * Get single workflow by UUID
 */
export const getWorkflow = async (uuid) => {
    const response = await api.get(`/workflows/${uuid}/`);
    return response.data;
};

/**
 * Create new workflow
 */
export const createWorkflow = async (workflowData) => {
    const response = await api.post('/workflows/', workflowData);
    return response.data;
};

/**
 * Update existing workflow
 */
export const updateWorkflow = async (uuid, workflowData) => {
    const response = await api.put(`/workflows/${uuid}/`, workflowData);
    return response.data;
};

/**
 * Delete workflow (soft delete)
 */
export const deleteWorkflow = async (uuid) => {
    const response = await api.delete(`/workflows/${uuid}/`);
    return response.data;
};

/**
 * Execute workflow
 */
export const executeWorkflow = async (uuid) => {
    const response = await api.post(`/workflows/${uuid}/execute/`);
    return response.data;
};

/**
 * Execute workflow directly (without database save)
 */
export const executeWorkflowDirect = async (canvasData) => {
    const response = await api.post('/workflows/execute_direct/', {
        canvas_data: canvasData,
    });
    return response.data;
};

// =============================================================================
// PROVIDER MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * Get all API providers (OpenAPI specs)
 */
export const getProviders = async () => {
    const response = await api.get('/integrations/specs/');
    return response.data;
};

/**
 * Get single provider by ID
 */
export const getProvider = async (id) => {
    const response = await api.get(`/integrations/specs/${id}/`);
    return response.data;
};

/**
 * Upload new API provider (OpenAPI spec)
 * @param {FormData} formData - Must contain 'provider', 'spec_file', and 'is_active'
 */
export const uploadProvider = async (formData) => {
    const response = await api.post('/integrations/specs/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Parse an uploaded OpenAPI spec
 * @param {number|string} specId - The OpenAPI spec ID
 */
export const parseProvider = async (specId) => {
    const response = await api.post(`/integrations/specs/${specId}/parse/`);
    return response.data;
};

/**
 * Generate workflow nodes from parsed spec
 * @param {number|string} specId - The OpenAPI spec ID
 */
export const generateNodes = async (specId) => {
    const response = await api.post(`/integrations/specs/${specId}/generate_nodes/`);
    return response.data;
};

/**
 * Delete API provider
 * @param {number|string} specId - The OpenAPI spec ID
 */
export const deleteProvider = async (specId) => {
    const response = await api.delete(`/integrations/specs/${specId}/`);
    return response.data;
};

/**
 * Update provider activation status
 * @param {number|string} specId - The OpenAPI spec ID
 * @param {boolean} isActive - Activation status
 */
export const updateProviderStatus = async (specId, isActive) => {
    const response = await api.patch(`/integrations/specs/${specId}/`, {
        is_active: isActive,
    });
    return response.data;
};

// =============================================================================
// NODE PALETTE ENDPOINTS
// =============================================================================

/**
 * Get available workflow nodes for palette
 * Combines static nodes with database-generated nodes
 */
export const getAvailableNodes = async () => {
    try {
        // Get all active providers
        const providers = await getProviders();

        // Filter for active and parsed providers
        const activeProviders = providers.filter(
            (p) => p.is_active && p.is_parsed
        );

        // Collect all generated nodes
        const databaseNodes = [];
        for (const provider of activeProviders) {
            if (provider.parsed_data && provider.parsed_data.endpoints) {
                // Generate nodes from endpoints
                const endpoints = provider.parsed_data.endpoints;
                endpoints.forEach((endpoint) => {
                    const nodeType = `${provider.provider}_${endpoint.operationId}`;
                    databaseNodes.push({
                        type: nodeType,
                        name: endpoint.summary || endpoint.operationId,
                        provider: provider.provider,
                        category: 'API Query',
                        endpoint: {
                            path: endpoint.path,
                            method: endpoint.method,
                        },
                    });
                });
            }
        }

        return {
            static: getStaticNodes(),
            database: databaseNodes,
        };
    } catch (error) {
        console.error('Error fetching available nodes:', error);
        return {
            static: getStaticNodes(),
            database: [],
        };
    }
};

/**
 * Get static workflow nodes (built-in nodes)
 */
const getStaticNodes = () => {
    return [
        // Input Nodes
        {
            type: 'single_address',
            name: 'Single Address',
            category: 'Input',
            description: 'Input a single blockchain address',
        },
        {
            type: 'batch_input',
            name: 'Batch Input',
            category: 'Input',
            description: 'Upload a file with multiple addresses',
        },
        {
            type: 'transaction_hash',
            name: 'Transaction Hash',
            category: 'Input',
            description: 'Input a transaction hash',
        },

        // Credential Nodes
        {
            type: 'credential_chainalysis',
            name: 'Chainalysis Credentials',
            category: 'Credentials',
            description: 'Chainalysis API credentials',
        },
        {
            type: 'credential_trm',
            name: 'TRM Credentials',
            category: 'Credentials',
            description: 'TRM Labs API credentials',
        },

        // Output Nodes
        {
            type: 'csv_export',
            name: 'CSV Export',
            category: 'Output',
            description: 'Export data to CSV file',
        },
        {
            type: 'json_export',
            name: 'JSON Export',
            category: 'Output',
            description: 'Export data to JSON file',
        },
        {
            type: 'pdf_export',
            name: 'PDF Report',
            category: 'Output',
            description: 'Generate PDF report',
        },
        {
            type: 'console_log',
            name: 'Console Log',
            category: 'Output',
            description: 'Log data to console',
        },
    ];
};

// =============================================================================
// EXECUTION LOG ENDPOINTS
// =============================================================================

/**
 * Get execution logs for a workflow
 */
export const getExecutionLogs = async (workflowUuid) => {
    const response = await api.get(`/execution-logs/`, {
        params: { workflow: workflowUuid },
    });
    return response.data;
};

/**
 * Get single execution log
 */
export const getExecutionLog = async (logId) => {
    const response = await api.get(`/execution-logs/${logId}/`);
    return response.data;
};

// =============================================================================
// STATISTICS ENDPOINTS
// =============================================================================

/**
 * Get dashboard statistics
 */
export const getStatistics = async () => {
    try {
        const [workflows, providers, executions] = await Promise.all([
            getWorkflows(),
            getProviders(),
            api.get('/execution-logs/').catch(() => ({ data: [] })),
        ]);

        return {
            totalWorkflows: Array.isArray(workflows) ? workflows.length : 0,
            totalProviders: Array.isArray(providers) ? providers.length : 0,
            totalExecutions: Array.isArray(executions.data) ? executions.data.length : 0,
            activeProviders: Array.isArray(providers)
                ? providers.filter((p) => p.is_active).length
                : 0,
        };
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return {
            totalWorkflows: 0,
            totalProviders: 0,
            totalExecutions: 0,
            activeProviders: 0,
        };
    }
};

// Export all functions
export default {
    // Workflows
    getWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    executeWorkflowDirect,

    // Providers
    getProviders,
    getProvider,
    uploadProvider,
    parseProvider,
    generateNodes,
    deleteProvider,
    updateProviderStatus,

    // Nodes
    getAvailableNodes,

    // Execution Logs
    getExecutionLogs,
    getExecutionLog,

    // Statistics
    getStatistics,
};