// =============================================================================
// FILE: frontend/src/hooks/useProviders.ts
// =============================================================================
// React hooks for Provider Management System.
// Provides state management and data fetching for OpenAPISpec operations.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
    OpenAPISpec,
    OpenAPISpecListItem,
    OpenAPISpecPayload,
    ParseResponse,
    GenerateResponse,
    GeneratedNodeDefinition,
} from '../types/provider';
import {
    listProviderSpecs,
    getProviderSpec,
    createProviderSpec,
    updateProviderSpec,
    patchProviderSpec,
    deleteProviderSpec,
    parseProviderSpec,
    generateNodesFromSpec,
    getAllGeneratedNodes,
    getProviderCount,
    getProvidersByStatus,
    isProviderNameUnique,
} from '../api/providers';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface UseProvidersResult {
    providers: OpenAPISpecListItem[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface UseProviderResult {
    provider: OpenAPISpec | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface UseGeneratedNodesResult {
    nodes: GeneratedNodeDefinition[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface ProviderMutationResult {
    execute: (payload: OpenAPISpecPayload) => Promise<OpenAPISpec>;
    loading: boolean;
    error: Error | null;
}

interface ProviderDeleteResult {
    execute: (uuid: string) => Promise<void>;
    loading: boolean;
    error: Error | null;
}

interface ProviderParseResult {
    execute: (uuid: string) => Promise<ParseResponse>;
    loading: boolean;
    error: Error | null;
}

interface ProviderGenerateResult {
    execute: (uuid: string) => Promise<GenerateResponse>;
    loading: boolean;
    error: Error | null;
}

// =============================================================================
// HOOKS - DATA FETCHING
// =============================================================================

/**
 * Hook to fetch all provider specifications.
 * Automatically fetches on mount and provides refetch function.
 * 
 * @param providerFilter - Optional provider name filter
 * @returns Provider list, loading state, error, and refetch function
 */
export function useProviders(providerFilter?: string): UseProvidersResult {
    const [providers, setProviders] = useState<OpenAPISpecListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProviders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listProviderSpecs(providerFilter);
            setProviders(data);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching providers:', err);
        } finally {
            setLoading(false);
        }
    }, [providerFilter]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    return {
        providers,
        loading,
        error,
        refetch: fetchProviders,
    };
}

/**
 * Hook to fetch a single provider specification by UUID.
 * 
 * @param uuid - OpenAPISpec UUID
 * @returns Provider, loading state, error, and refetch function
 */
export function useProvider(uuid: string | null): UseProviderResult {
    const [provider, setProvider] = useState<OpenAPISpec | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProvider = useCallback(async () => {
        if (!uuid) {
            setProvider(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await getProviderSpec(uuid);
            setProvider(data);
        } catch (err) {
            setError(err as Error);
            console.error(`Error fetching provider ${uuid}:`, err);
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        fetchProvider();
    }, [fetchProvider]);

    return {
        provider,
        loading,
        error,
        refetch: fetchProvider,
    };
}

/**
 * Hook to fetch all generated nodes from all active providers.
 * Used for populating the node palette with dynamic nodes.
 * 
 * @returns Generated nodes, loading state, error, and refetch function
 */
export function useGeneratedNodes(): UseGeneratedNodesResult {
    const [nodes, setNodes] = useState<GeneratedNodeDefinition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchNodes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllGeneratedNodes();
            setNodes(data);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching generated nodes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNodes();
    }, [fetchNodes]);

    return {
        nodes,
        loading,
        error,
        refetch: fetchNodes,
    };
}

// =============================================================================
// HOOKS - MUTATIONS
// =============================================================================

/**
 * Hook to create a new provider specification.
 * 
 * @returns Execute function, loading state, and error
 */
export function useCreateProvider(): ProviderMutationResult {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async (payload: OpenAPISpecPayload) => {
        try {
            setLoading(true);
            setError(null);
            const result = await createProviderSpec(payload);
            return result;
        } catch (err) {
            setError(err as Error);
            console.error('Error creating provider:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { execute, loading, error };
}

/**
 * Hook to update an existing provider specification.
 * 
 * @returns Execute function, loading state, and error
 */
export function useUpdateProvider(): {
    execute: (uuid: string, payload: OpenAPISpecPayload) => Promise<OpenAPISpec>;
    loading: boolean;
    error: Error | null;
} {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(
        async (uuid: string, payload: OpenAPISpecPayload) => {
            try {
                setLoading(true);
                setError(null);
                const result = await updateProviderSpec(uuid, payload);
                return result;
            } catch (err) {
                setError(err as Error);
                console.error(`Error updating provider ${uuid}:`, err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { execute, loading, error };
}

/**
 * Hook to partially update a provider specification.
 * 
 * @returns Execute function, loading state, and error
 */
export function usePatchProvider(): {
    execute: (uuid: string, payload: Partial<OpenAPISpecPayload>) => Promise<OpenAPISpec>;
    loading: boolean;
    error: Error | null;
} {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(
        async (uuid: string, payload: Partial<OpenAPISpecPayload>) => {
            try {
                setLoading(true);
                setError(null);
                const result = await patchProviderSpec(uuid, payload);
                return result;
            } catch (err) {
                setError(err as Error);
                console.error(`Error patching provider ${uuid}:`, err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { execute, loading, error };
}

/**
 * Hook to delete a provider specification (soft delete).
 * 
 * @returns Execute function, loading state, and error
 */
export function useDeleteProvider(): ProviderDeleteResult {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async (uuid: string) => {
        try {
            setLoading(true);
            setError(null);
            await deleteProviderSpec(uuid);
        } catch (err) {
            setError(err as Error);
            console.error(`Error deleting provider ${uuid}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { execute, loading, error };
}

/**
 * Hook to parse an OpenAPI specification.
 * 
 * @returns Execute function, loading state, and error
 */
export function useParseProvider(): ProviderParseResult {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async (uuid: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await parseProviderSpec(uuid);
            return result;
        } catch (err) {
            setError(err as Error);
            console.error(`Error parsing provider ${uuid}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { execute, loading, error };
}

/**
 * Hook to generate nodes from a parsed provider specification.
 * 
 * @returns Execute function, loading state, and error
 */
export function useGenerateNodes(): ProviderGenerateResult {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async (uuid: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await generateNodesFromSpec(uuid);
            return result;
        } catch (err) {
            setError(err as Error);
            console.error(`Error generating nodes from ${uuid}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { execute, loading, error };
}

// =============================================================================
// HOOKS - UTILITY
// =============================================================================

/**
 * Hook to get provider count.
 * 
 * @returns Provider count, loading state, error
 */
export function useProviderCount(): {
    count: number;
    loading: boolean;
    error: Error | null;
} {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchCount() {
            try {
                setLoading(true);
                setError(null);
                const data = await getProviderCount();
                setCount(data);
            } catch (err) {
                setError(err as Error);
                console.error('Error fetching provider count:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchCount();
    }, []);

    return { count, loading, error };
}

/**
 * Hook to get providers by status.
 * 
 * @param status - Status to filter by
 * @returns Filtered providers, loading state, error
 */
export function useProvidersByStatus(
    status: 'active' | 'parsing' | 'error' | 'inactive'
): UseProvidersResult {
    const [providers, setProviders] = useState<OpenAPISpecListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProviders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getProvidersByStatus(status);
            setProviders(data);
        } catch (err) {
            setError(err as Error);
            console.error(`Error fetching providers by status ${status}:`, err);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    return {
        providers,
        loading,
        error,
        refetch: fetchProviders,
    };
}

/**
 * Hook to check if provider name is unique.
 * 
 * @param name - Provider name to check
 * @param excludeUuid - UUID to exclude from check
 * @returns Unique status, loading state, error
 */
export function useProviderNameUnique(
    name: string,
    excludeUuid?: string
): {
    isUnique: boolean;
    loading: boolean;
    error: Error | null;
} {
    const [isUnique, setIsUnique] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!name) {
            setIsUnique(true);
            return;
        }

        async function checkUnique() {
            try {
                setLoading(true);
                setError(null);
                const unique = await isProviderNameUnique(name, excludeUuid);
                setIsUnique(unique);
            } catch (err) {
                setError(err as Error);
                console.error('Error checking name uniqueness:', err);
            } finally {
                setLoading(false);
            }
        }

        // Debounce check by 500ms
        const timeoutId = setTimeout(checkUnique, 500);
        return () => clearTimeout(timeoutId);
    }, [name, excludeUuid]);

    return { isUnique, loading, error };
}

// =============================================================================
// DEFAULT EXPORT (for convenience)
// =============================================================================

export default {
    useProviders,
    useProvider,
    useGeneratedNodes,
    useCreateProvider,
    useUpdateProvider,
    usePatchProvider,
    useDeleteProvider,
    useParseProvider,
    useGenerateNodes,
    useProviderCount,
    useProvidersByStatus,
    useProviderNameUnique,
};