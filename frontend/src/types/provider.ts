// =============================================================================
// FILE: frontend/src/types/provider.ts
// =============================================================================
// TypeScript interfaces for Provider Management System (OpenAPISpec)
// Corresponds to backend/apps/integrations/models.py OpenAPISpec model
// =============================================================================

/**
 * OpenAPI specification model from backend database.
 * Represents a parsed API provider specification.
 */
export interface OpenAPISpec {
    uuid: string;
    provider: string;
    name: string;
    description: string;
    version: string;
    spec_file: string | null;
    parsed_data: ParsedOpenAPIData | null;
    is_active: boolean;
    is_parsed: boolean;
    parse_error: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Lightweight version for list views (no parsed_data).
 */
export interface OpenAPISpecListItem {
    uuid: string;
    provider: string;
    name: string;
    description: string;
    version: string;
    is_active: boolean;
    is_parsed: boolean;
    endpoint_count: number;
    status: 'active' | 'parsing' | 'error' | 'inactive';
    created_at: string;
}

/**
 * Structure of parsed OpenAPI data (stored in parsed_data JSON field).
 */
export interface ParsedOpenAPIData {
    info: OpenAPIInfo;
    servers: OpenAPIServer[];
    security: SecurityScheme[];
    endpoints: ParsedEndpoint[];
}

/**
 * OpenAPI info object.
 */
export interface OpenAPIInfo {
    title: string;
    version: string;
    description?: string;
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
}

/**
 * OpenAPI server configuration.
 */
export interface OpenAPIServer {
    url: string;
    description?: string;
}

/**
 * Security scheme for authentication.
 */
export interface SecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    name?: string;
    in?: 'header' | 'query' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
}

/**
 * Parsed API endpoint from OpenAPI spec.
 */
export interface ParsedEndpoint {
    path: string;
    method: string;
    operation_id: string;
    summary: string;
    description?: string;
    parameters: EndpointParameter[];
    request_body?: RequestBody;
    responses: Record<string, ResponseSchema>;
    tags?: string[];
}

/**
 * Endpoint parameter (path, query, header).
 */
export interface EndpointParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    schema: ParameterSchema;
    description?: string;
}

/**
 * Parameter schema definition.
 */
export interface ParameterSchema {
    type: string;
    format?: string;
    enum?: string[];
    default?: any;
    minimum?: number;
    maximum?: number;
    pattern?: string;
}

/**
 * Request body definition.
 */
export interface RequestBody {
    required: boolean;
    content: Record<string, MediaTypeObject>;
}

/**
 * Media type object (e.g., application/json).
 */
export interface MediaTypeObject {
    schema: ResponseSchema;
}

/**
 * Response schema definition.
 */
export interface ResponseSchema {
    type: string;
    properties?: Record<string, PropertySchema>;
    items?: ResponseSchema;
    required?: string[];
    description?: string;
}

/**
 * Property schema in response object.
 */
export interface PropertySchema {
    type: string;
    format?: string;
    description?: string;
    enum?: string[];
    items?: PropertySchema;
    properties?: Record<string, PropertySchema>;
}

/**
 * Generated node definition from OpenAPI endpoint.
 */
export interface GeneratedNodeDefinition {
    type: string;
    name: string;
    category: 'query';
    provider: string;
    description: string;
    inputs: GeneratedNodePin[];
    outputs: GeneratedNodePin[];
    configuration: any[];
    visual: {
        icon: string;
        color: string;
        width: number;
        height: number;
    };
}

/**
 * Generated input/output pin for node.
 */
export interface GeneratedNodePin {
    id: string;
    label: string;
    type: string;
    required: boolean;
    description: string;
}

/**
 * Payload for creating/updating OpenAPISpec.
 */
export interface OpenAPISpecPayload {
    provider: string;
    name: string;
    description?: string;
    version: string;
    spec_file?: File;
}

/**
 * Response from parse action.
 */
export interface ParseResponse {
    success: boolean;
    message: string;
    endpoint_count?: number;
    errors?: string[];
}

/**
 * Response from generate action.
 */
export interface GenerateResponse {
    success: boolean;
    nodes: GeneratedNodeDefinition[];
    message: string;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}