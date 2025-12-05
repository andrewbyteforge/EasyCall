// =============================================================================
// FILE: src/types/workflow_types.ts
// =============================================================================
// TypeScript type definitions for workflows
// =============================================================================

import { Node, Edge, Viewport } from 'reactflow';

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export interface Workflow {
    uuid: string;
    name: string;
    description: string;
    canvas_data: CanvasData;
    node_count: number;
    connection_count: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface WorkflowListItem {
    uuid: string;
    name: string;
    description: string;
    node_count: number;
    created_at: string;
    updated_at: string;
}

export interface CanvasData {
    nodes: Node[];
    edges: Edge[];
    viewport: Viewport;
}

export interface WorkflowPayload {
    name: string;
    description?: string;
    canvas_data: CanvasData;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// =============================================================================
// NODE CATEGORIES
// =============================================================================

export enum NodeCategory {
    CONFIGURATION = 'configuration',
    INPUT = 'input',
    QUERY = 'query',
    OUTPUT = 'output',
}