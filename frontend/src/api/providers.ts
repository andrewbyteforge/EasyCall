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
 * Get all generated nodes from all active parsed specifications.
 * Useful for loading all available nodes into the node palette.
 * 
 * @returns Promise resolving to array of all generated node definitions
 */
export async function getAllGeneratedNodes(): Promise<GeneratedNodeDefinition[]> {
    try {
        // Get all active, parsed specs
        const specs = await listProviderSpecs();
        const parsedSpecs = specs.filter((spec) => spec.is_parsed && spec.is_active);

        // Generate nodes for each spec
        const nodePromises = parsedSpecs.map((spec) =>
            generateNodesFromSpec(spec.uuid)
        );

        const results = await Promise.all(nodePromises);

        // Flatten all nodes into single array
        const allNodes = results.flatMap((result) => result.nodes);

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