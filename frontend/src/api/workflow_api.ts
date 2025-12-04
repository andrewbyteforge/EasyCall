// =============================================================================
// FILE: frontend/src/api/workflow_api.ts
// =============================================================================
// API functions for workflow CRUD operations.
// Communicates with Django REST API endpoints.
// =============================================================================

import apiClient from './api_client';
import {
    Workflow,
    WorkflowListItem,
    WorkflowPayload,
    PaginatedResponse,
} from '../types/workflow_types';

// =============================================================================
// WORKFLOW API FUNCTIONS
// =============================================================================

/**
 * Get list of all workflows.
 * 
 * @returns Promise resolving to array of workflow list items
 */
export async function listWorkflows(): Promise<WorkflowListItem[]> {
    try {
        const response = await apiClient.get<WorkflowListItem[]>('/workflows/');
        return response.data;
    } catch (error) {
        console.error('Error listing workflows:', error);
        throw error;
    }
}

/**
 * Get a single workflow by UUID.
 * 
 * @param uuid - Workflow UUID
 * @returns Promise resolving to full workflow object
 */
export async function getWorkflow(uuid: string): Promise<Workflow> {
    try {
        const response = await apiClient.get<Workflow>(`/workflows/${uuid}/`);
        return response.data;
    } catch (error) {
        console.error(`Error getting workflow ${uuid}:`, error);
        throw error;
    }
}

/**
 * Create a new workflow.
 * 
 * @param payload - Workflow data (name, description, canvas_data)
 * @returns Promise resolving to created workflow
 */
export async function createWorkflow(payload: WorkflowPayload): Promise<Workflow> {
    try {
        const response = await apiClient.post<Workflow>('/workflows/', payload);
        return response.data;
    } catch (error) {
        console.error('Error creating workflow:', error);
        throw error;
    }
}

/**
 * Update an existing workflow (full update).
 * 
 * @param uuid - Workflow UUID
 * @param payload - Updated workflow data
 * @returns Promise resolving to updated workflow
 */
export async function updateWorkflow(
    uuid: string,
    payload: WorkflowPayload
): Promise<Workflow> {
    try {
        const response = await apiClient.put<Workflow>(`/workflows/${uuid}/`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating workflow ${uuid}:`, error);
        throw error;
    }
}

/**
 * Partially update a workflow.
 * 
 * @param uuid - Workflow UUID
 * @param payload - Partial workflow data
 * @returns Promise resolving to updated workflow
 */
export async function patchWorkflow(
    uuid: string,
    payload: Partial<WorkflowPayload>
): Promise<Workflow> {
    try {
        const response = await apiClient.patch<Workflow>(`/workflows/${uuid}/`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error patching workflow ${uuid}:`, error);
        throw error;
    }
}

/**
 * Delete a workflow (soft delete).
 * 
 * @param uuid - Workflow UUID
 * @returns Promise resolving when delete is complete
 */
export async function deleteWorkflow(uuid: string): Promise<void> {
    try {
        await apiClient.delete(`/workflows/${uuid}/`);
    } catch (error) {
        console.error(`Error deleting workflow ${uuid}:`, error);
        throw error;
    }
}

/**
 * Save workflow canvas state.
 * Convenience function that patches only canvas_data.
 * 
 * @param uuid - Workflow UUID
 * @param canvasData - Canvas data to save
 * @returns Promise resolving to updated workflow
 */
export async function saveWorkflowCanvas(
    uuid: string,
    canvasData: any
): Promise<Workflow> {
    try {
        return await patchWorkflow(uuid, { canvas_data: canvasData });
    } catch (error) {
        console.error(`Error saving canvas for workflow ${uuid}:`, error);
        throw error;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if workflow name is unique.
 * 
 * @param name - Workflow name to check
 * @param excludeUuid - UUID to exclude from check (for updates)
 * @returns Promise resolving to true if name is available
 */
export async function isWorkflowNameUnique(
    name: string,
    excludeUuid?: string
): Promise<boolean> {
    try {
        const workflows = await listWorkflows();
        return !workflows.some(
            (w) => w.name === name && w.uuid !== excludeUuid
        );
    } catch (error) {
        console.error('Error checking workflow name:', error);
        return false;
    }
}

/**
 * Get workflow count.
 * 
 * @returns Promise resolving to number of workflows
 */
export async function getWorkflowCount(): Promise<number> {
    try {
        const workflows = await listWorkflows();
        return workflows.length;
    } catch (error) {
        console.error('Error getting workflow count:', error);
        return 0;
    }
}