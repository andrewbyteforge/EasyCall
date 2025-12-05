// =============================================================================
// FILE: frontend/src/hooks/useWorkflow.ts
// =============================================================================
// Custom hook for managing workflow state and operations.
// Handles nodes, edges, viewport, and workflow CRUD operations.
// =============================================================================

import { useState, useCallback, useMemo } from 'react';
import { Node, Edge, Viewport } from 'reactflow';
import { workflowApi, Workflow } from '../api/workflow_api';

// =============================================================================
// HOOK
// =============================================================================

export const useWorkflow = () => {
    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------

    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
    const [workflowName, setWorkflowName] = useState<string>('Untitled Workflow');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSavedState, setLastSavedState] = useState<string>('');

    // ---------------------------------------------------------------------------
    // COMPUTED PROPERTIES
    // ---------------------------------------------------------------------------

    // Check if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        const currentState = JSON.stringify({ nodes, edges, viewport, workflowName });
        return currentState !== lastSavedState;
    }, [nodes, edges, viewport, workflowName, lastSavedState]);

    // Check if workflow can be executed (has at least one node)
    const canExecute = useMemo(() => {
        return nodes.length > 0;
    }, [nodes]);

    // Workflow name (alias for compatibility)
    const name = workflowName;

    // ---------------------------------------------------------------------------
    // SAVE WORKFLOW
    // ---------------------------------------------------------------------------

    const saveWorkflow = useCallback(async (nameOverride?: string) => {
        setIsSaving(true);
        try {
            const workflowData = {
                name: nameOverride || workflowName,
                description: '',
                canvas_data: {
                    nodes,
                    edges,
                    viewport,
                },
            };

            let savedWorkflow: Workflow;

            if (currentWorkflowId) {
                // Update existing workflow
                savedWorkflow = await workflowApi.updateWorkflow(
                    currentWorkflowId,
                    workflowData
                );
            } else {
                // Create new workflow
                savedWorkflow = await workflowApi.createWorkflow(workflowData);
                setCurrentWorkflowId(savedWorkflow.uuid);
            }

            setWorkflowName(savedWorkflow.name);

            // Update last saved state
            const savedState = JSON.stringify({
                nodes,
                edges,
                viewport,
                workflowName: savedWorkflow.name,
            });
            setLastSavedState(savedState);

            console.log('✅ Workflow saved:', savedWorkflow.name);
            return savedWorkflow;
        } catch (error) {
            console.error('❌ Failed to save workflow:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [nodes, edges, viewport, currentWorkflowId, workflowName]);

    // ---------------------------------------------------------------------------
    // LOAD WORKFLOW
    // ---------------------------------------------------------------------------

    const loadWorkflow = useCallback(
        async (workflowId?: string) => {
            // If no ID provided, show load dialog (future enhancement)
            if (!workflowId) {
                console.log('TODO: Open workflow selection dialog');
                return;
            }

            setIsLoading(true);
            try {
                const workflow = await workflowApi.getWorkflow(workflowId);

                setNodes(workflow.canvas_data.nodes || []);
                setEdges(workflow.canvas_data.edges || []);
                setViewport(workflow.canvas_data.viewport || { x: 0, y: 0, zoom: 1 });
                setCurrentWorkflowId(workflow.uuid);
                setWorkflowName(workflow.name);

                // Update last saved state
                const savedState = JSON.stringify({
                    nodes: workflow.canvas_data.nodes || [],
                    edges: workflow.canvas_data.edges || [],
                    viewport: workflow.canvas_data.viewport || { x: 0, y: 0, zoom: 1 },
                    workflowName: workflow.name,
                });
                setLastSavedState(savedState);

                console.log('✅ Workflow loaded:', workflow.name);
                return workflow;
            } catch (error) {
                console.error('❌ Failed to load workflow:', error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // ---------------------------------------------------------------------------
    // CREATE NEW WORKFLOW
    // ---------------------------------------------------------------------------

    const createNewWorkflow = useCallback(() => {
        // Check for unsaved changes (in future, show confirmation dialog)
        if (hasUnsavedChanges) {
            console.log('⚠️ Warning: You have unsaved changes');
            // TODO: Show confirmation dialog in future phase
        }

        setNodes([]);
        setEdges([]);
        setViewport({ x: 0, y: 0, zoom: 1 });
        setCurrentWorkflowId(null);
        setWorkflowName('Untitled Workflow');

        // Reset saved state
        const newState = JSON.stringify({
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            workflowName: 'Untitled Workflow',
        });
        setLastSavedState(newState);

        console.log('✅ New workflow created');
    }, [hasUnsavedChanges]);

    // Alias for compatibility
    const newWorkflow = createNewWorkflow;

    // ---------------------------------------------------------------------------
    // EXECUTE WORKFLOW
    // ---------------------------------------------------------------------------

    const executeWorkflow = useCallback(async () => {
        if (!canExecute) {
            console.log('⚠️ Cannot execute: Workflow has no nodes');
            return;
        }

        console.log('▶️ Executing workflow:', workflowName);
        console.log('Nodes:', nodes.length);
        console.log('Edges:', edges.length);

        // TODO: Implement actual workflow execution in Phase 4
        // For now, just log the action
        try {
            // Future: Call execution API endpoint
            // const result = await executionApi.executeWorkflow(currentWorkflowId);

            console.log('✅ Workflow execution started (placeholder)');
        } catch (error) {
            console.error('❌ Failed to execute workflow:', error);
            throw error;
        }
    }, [canExecute, workflowName, nodes, edges, currentWorkflowId]);

    // ---------------------------------------------------------------------------
    // RETURN
    // ---------------------------------------------------------------------------

    return {
        // React Flow state
        nodes,
        edges,
        viewport,
        setNodes,
        setEdges,
        setViewport,

        // Workflow metadata
        currentWorkflowId,
        workflowName,
        name, // Alias
        setWorkflowName,

        // Computed properties
        hasUnsavedChanges,
        canExecute,

        // Operations
        saveWorkflow,
        loadWorkflow,
        createNewWorkflow,
        newWorkflow, // Alias
        executeWorkflow,

        // Loading states
        isSaving,
        isLoading,
    };
};