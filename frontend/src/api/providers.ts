// =============================================================================
// FILE: frontend/src/api/providers.ts
// =============================================================================
// API client functions for Provider Management System.
// Communicates with Django REST API for OpenAPISpec model.
// Corresponds to backend/apps/integrations/views.py endpoints.
// =============================================================================

import apiClient from './api_client';
import {
    OpenAPISpec,
    OpenAPISpecListItem,
    OpenAPISpecPayload,
    ParseResponse,
    GenerateResponse,
    GeneratedNodeDefinition,
    PaginatedResponse,
} from '../types/provider';

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * List all OpenAPI specifications.
 * 
 * @param provider - Optional filter by provider name
 * @returns Promise resolving to array of OpenAPI spec list items
 */
export async function listProviderSpecs(
    provider?: string
): Promise<OpenAPISpecListItem[]> {
    try {
        const params = provider ? { provider } : {};
        const response = await apiClient.get<OpenAPISpecListItem[]>(
            '/integrations/specs/',
            { params }
        );
        return response.data;
    } catch (error) {
        console.error('Error listing provider specs:', error);
        throw error;
    }
}

/**
 * Get a single OpenAPI specification by UUID.
 * 
 * @param uuid - OpenAPISpec UUID
 * @returns Promise resolving to full OpenAPISpec object
 */
export async function getProviderSpec(uuid: string): Promise<OpenAPISpec> {
    try {
        const response = await apiClient.get<OpenAPISpec>(
            `/integrations/specs/${uuid}/`
        );
        return response.data;
    } catch (error) {
        console.error(`Error getting provider spec ${uuid}:`, error);
        throw error;
    }
}

/**
 * Create a new OpenAPI specification.
 * 
 * @param payload - OpenAPISpec data with optional file upload
 * @returns Promise resolving to created OpenAPISpec
 */
export async function createProviderSpec(
    payload: OpenAPISpecPayload
): Promise<OpenAPISpec> {
    try {
        const formData = new FormData();
        formData.append('provider', payload.provider);
        formData.append('name', payload.name);
        formData.append('version', payload.version);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        if (payload.spec_file) {
            formData.append('spec_file', payload.spec_file);
        }

        const response = await apiClient.post<OpenAPISpec>(
            '/integrations/specs/',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating provider spec:', error);
        throw error;
    }
}

/**
 * Update an existing OpenAPI specification (full update).
 * 
 * @param uuid - OpenAPISpec UUID
 * @param payload - Updated OpenAPISpec data
 * @returns Promise resolving to updated OpenAPISpec
 */
export async function updateProviderSpec(
    uuid: string,
    payload: OpenAPISpecPayload
): Promise<OpenAPISpec> {
    try {
        const formData = new FormData();
        formData.append('provider', payload.provider);
        formData.append('name', payload.name);
        formData.append('version', payload.version);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        if (payload.spec_file) {
            formData.append('spec_file', payload.spec_file);
        }

        const response = await apiClient.put<OpenAPISpec>(
            `/integrations/specs/${uuid}/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating provider spec ${uuid}:`, error);
        throw error;
    }
}

/**
 * Partially update an OpenAPI specification.
 * 
 * @param uuid - OpenAPISpec UUID
 * @param payload - Partial OpenAPISpec data
 * @returns Promise resolving to updated OpenAPISpec
 */
export async function patchProviderSpec(
    uuid: string,
    payload: Partial<OpenAPISpecPayload>
): Promise<OpenAPISpec> {
    try {
        const formData = new FormData();

        if (payload.provider) formData.append('provider', payload.provider);
        if (payload.name) formData.append('name', payload.name);
        if (payload.version) formData.append('version', payload.version);
        if (payload.description) formData.append('description', payload.description);
        if (payload.spec_file) formData.append('spec_file', payload.spec_file);

        const response = await apiClient.patch<OpenAPISpec>(
            `/integrations/specs/${uuid}/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error patching provider spec ${uuid}:`, error);
        throw error;
    }
}

/**
 * Delete an OpenAPI specification (soft delete - sets is_active=False).
 * 
 * @param uuid - OpenAPISpec UUID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteProviderSpec(uuid: string): Promise<void> {
    try {
        await apiClient.delete(`/integrations/specs/${uuid}/`);
    } catch (error) {
        console.error(`Error deleting provider spec ${uuid}:`, error);
        throw error;
    }
}

/**
 * Parse an OpenAPI specification.
 * Triggers backend parsing of uploaded spec file.
 * 
 * @param uuid - OpenAPISpec UUID
 * @returns Promise resolving to parse results
 */
export async function parseProviderSpec(uuid: string): Promise<ParseResponse> {
    try {
        const response = await apiClient.post<ParseResponse>(
            `/integrations/specs/${uuid}/parse/`
        );
        return response.data;
    } catch (error) {
        console.error(`Error parsing provider spec ${uuid}:`, error);
        throw error;
    }
}

/**
 * Generate node definitions from parsed OpenAPI specification.
 * 
 * @param uuid - OpenAPISpec UUID
 * @returns Promise resolving to generated node definitions
 */
export async function generateNodesFromSpec(
    uuid: string
): Promise<GenerateResponse> {
    try {
        const response = await apiClient.post<GenerateResponse>(
            `/integrations/specs/${uuid}/generate/`
        );
        return response.data;
    } catch (error) {
        console.error(`Error generating nodes from spec ${uuid}:`, error);
        throw error;
    }
}

/**
 * Get all generated nodes from all active providers.
 * Fetches from the grouped_by_provider endpoint with full pin data.
 * 
 * UPDATED: Now parses input_pins and output_pins from backend.
 * 
 * @returns Promise resolving to array of all generated node definitions
 */
/**
 * Get all generated nodes from all active providers.
 * Fetches from the grouped_by_provider endpoint with full pin data.
 */
export async function getAllGeneratedNodes(): Promise<GeneratedNodeDefinition[]> {
    console.log('[API] Fetching nodes from:', 'http://localhost:8000/api/v1/integrations/nodes/grouped_by_provider/');

    try {
        const response = await fetch('http://localhost:8000/api/v1/integrations/nodes/grouped_by_provider/');

        if (!response.ok) {
            throw new Error(`Failed to fetch nodes: ${response.status} ${response.statusText}`);
        }

        const providersData = await response.json();
        console.log('[API] Received providers:', providersData);

        const allNodes: GeneratedNodeDefinition[] = [];

        providersData.forEach((providerGroup: any) => {
            providerGroup.nodes.forEach((node: any) => {
                // ⭐ FIX: Backend returns "inputs" not "input_pins" (thanks to serializer mapping)
                const inputs = (node.inputs || []).map((pin: any) => ({
                    id: pin.id,
                    label: pin.label,
                    type: pin.type || 'ANY',
                    required: pin.required !== undefined ? pin.required : false,
                    description: pin.description || '',
                }));

                // ⭐ FIX: Backend returns "outputs" not "output_pins" (thanks to serializer mapping)
                const outputs = (node.outputs || []).map((pin: any) => ({
                    id: pin.id,
                    label: pin.label,
                    type: pin.type || 'ANY',
                    required: false,
                    description: pin.description || '',
                }));

                // ⭐ FIX: Backend returns "configuration" not "configuration_fields"
                const configuration = node.configuration || [];

                allNodes.push({
                    type: node.node_type,
                    name: node.display_name,
                    category: 'query' as const,
                    provider: providerGroup.provider,
                    description: node.description,
                    inputs,  // ← Now includes real pins!
                    outputs, // ← Now includes real pins!
                    configuration,
                    visual: node.visual || {
                        icon: node.icon || '🔌',
                        color: node.color || '#00897b',
                        width: 220,
                        height: 'auto',
                    },
                });
            });
        });

        console.log('[API] Converted to', allNodes.length, 'node definitions with pins');
        if (allNodes.length > 0) {
            console.log('[API] Sample node:', allNodes[0]);
            console.log('[API] Sample inputs:', allNodes[0].inputs);
            console.log('[API] Sample outputs:', allNodes[0].outputs);
        }

        return allNodes;
    } catch (error) {
        console.error('Error getting all generated nodes:', error);
        throw error;
    }
}

/**
 * Get provider count.
 * 
 * @returns Promise resolving to number of active providers
 */
export async function getProviderCount(): Promise<number> {
    try {
        const specs = await listProviderSpecs();
        return specs.filter((spec) => spec.is_active).length;
    } catch (error) {
        console.error('Error getting provider count:', error);
        return 0;
    }
}

/**
 * Get providers by status.
 * 
 * @param status - Status to filter by
 * @returns Promise resolving to filtered providers
 */
export async function getProvidersByStatus(
    status: 'active' | 'parsing' | 'error' | 'inactive'
): Promise<OpenAPISpecListItem[]> {
    try {
        const specs = await listProviderSpecs();
        return specs.filter((spec) => spec.status === status);
    } catch (error) {
        console.error(`Error getting providers by status ${status}:`, error);
        return [];
    }
}

/**
 * Check if provider name is unique.
 * 
 * @param name - Provider name to check
 * @param excludeUuid - UUID to exclude from check (for updates)
 * @returns Promise resolving to true if name is available
 */
export async function isProviderNameUnique(
    name: string,
    excludeUuid?: string
): Promise<boolean> {
    try {
        const specs = await listProviderSpecs();
        return !specs.some(
            (spec) => spec.name === name && spec.uuid !== excludeUuid
        );
    } catch (error) {
        console.error('Error checking provider name uniqueness:', error);
        return false;
    }
}

// =============================================================================
// EXPORT API OBJECT (for convenience)
// =============================================================================

export const providerApi = {
    list: listProviderSpecs,
    get: getProviderSpec,
    create: createProviderSpec,
    update: updateProviderSpec,
    patch: patchProviderSpec,
    delete: deleteProviderSpec,
    parse: parseProviderSpec,
    generate: generateNodesFromSpec,
    getAllNodes: getAllGeneratedNodes,
    getCount: getProviderCount,
    getByStatus: getProvidersByStatus,
    isNameUnique: isProviderNameUnique,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default providerApi;