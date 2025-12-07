// =============================================================================
// FILE: frontend/src/hooks/useWorkflow.ts
// =============================================================================
// Custom hook for managing workflow state and operations.
// Handles nodes, edges, viewport, and workflow CRUD operations.
// =============================================================================

import { useState, useCallback, useMemo } from 'react';
import { Node, Edge, Viewport, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { workflowApi, Workflow } from '../api/workflow_api';
import { getAllNodeTypes } from '../types/node_types';

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
    // DELETE NODE ⭐ NEW
    // ---------------------------------------------------------------------------

    const deleteNode = useCallback((nodeId: string) => {
        console.log(`🗑️ Deleting node: ${nodeId}`);

        // Remove node
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));

        // Remove connected edges
        setEdges((eds) => eds.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
        ));
    }, []);

    // ---------------------------------------------------------------------------
    // ADD NODE AT POSITION (Drag-and-Drop)
    // ---------------------------------------------------------------------------

    const addNodeAtPosition = useCallback(
        (nodeType: string, position: { x: number; y: number }) => {
            // Get all node type definitions
            const allNodeTypes = getAllNodeTypes();
            const nodeDefinition = allNodeTypes.find((n) => n.type === nodeType);

            if (!nodeDefinition) {
                console.error('❌ Unknown node type:', nodeType);
                return;
            }

            // Generate unique ID
            const id = `${nodeType}_${Date.now()}`;

            // Snap to grid (10x10)
            const snappedPosition = {
                x: Math.round(position.x / 10) * 10,
                y: Math.round(position.y / 10) * 10,
            };

            // Create node data matching UE5Node component expectations
            const newNode: Node = {
                id,
                type: 'default',
                position: snappedPosition,
                data: {
                    label: nodeDefinition.name,
                    category: nodeDefinition.category,
                    icon: nodeDefinition.icon,
                    nodeType: nodeType,

                    // Map inputs from definition
                    inputs: nodeDefinition.inputs.map((input) => ({
                        id: input.id,
                        label: input.label,
                        type: input.type,
                        color: input.type, // Use type as color key
                    })),

                    // Map outputs from definition
                    outputs: nodeDefinition.outputs.map((output) => ({
                        id: output.id,
                        label: output.label,
                        type: output.type,
                        color: output.type, // Use type as color key
                    })),

                    // Initialize with default properties
                    properties: [],

                    // ⭐ ADD DELETE HANDLER
                    onDelete: () => deleteNode(id),
                },
            };

            setNodes((nds) => [...nds, newNode]);

            console.log('✅ Node added:', nodeDefinition.name, 'at', snappedPosition);
        },
        [deleteNode]
    );

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

                // ⭐ Restore nodes with delete handlers
                const nodesWithHandlers = (workflow.canvas_data.nodes || []).map((node: Node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        onDelete: () => deleteNode(node.id),
                    },
                }));

                setNodes(nodesWithHandlers);
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
        [deleteNode]
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
    // CREATE EXAMPLE NODES (UE5 Style - for testing)
    // ---------------------------------------------------------------------------

    const createExampleNodes = useCallback(() => {
        console.log('🎨 Creating UE5-style example nodes');

        const exampleNodes = [
            {
                id: '1',
                type: 'default',
                position: { x: 100, y: 100 },
                data: {
                    label: 'Single Address',
                    category: 'input',
                    icon: '📍',
                    outputs: [
                        { id: 'address', label: 'Address', type: 'address', color: 'address' },
                        { id: 'network', label: 'Network', type: 'string', color: 'data' },
                    ],
                    properties: [
                        { key: 'Address', value: '0x742d35Cc...' },
                        { key: 'Network', value: 'Ethereum' },
                    ],
                    onDelete: () => deleteNode('1'), // ⭐ ADD DELETE HANDLER
                },
            },
            {
                id: '2',
                type: 'default',
                position: { x: 400, y: 80 },
                data: {
                    label: 'Total Exposure',
                    category: 'query',
                    icon: '🔍',
                    inputs: [
                        { id: 'address', label: 'Address', type: 'address', color: 'address' },
                    ],
                    outputs: [
                        { id: 'exposure', label: 'Exposure Data', type: 'data', color: 'data' },
                        { id: 'risk', label: 'Risk Score', type: 'number', color: 'output' },
                    ],
                    properties: [
                        { key: 'Provider', value: 'TRM Labs' },
                        { key: 'Timeout', value: '30s' },
                    ],
                    onDelete: () => deleteNode('2'), // ⭐ ADD DELETE HANDLER
                },
            },
            {
                id: '3',
                type: 'default',
                position: { x: 750, y: 100 },
                data: {
                    label: 'Excel Export',
                    category: 'output',
                    icon: '📤',
                    inputs: [
                        { id: 'data', label: 'Data', type: 'data', color: 'data' },
                    ],
                    properties: [
                        { key: 'Format', value: 'XLSX' },
                        { key: 'Include Headers', value: 'Yes' },
                    ],
                    onDelete: () => deleteNode('3'), // ⭐ ADD DELETE HANDLER
                },
            },
        ];

        setNodes(exampleNodes);

        setEdges([
            {
                id: 'e1-2',
                source: '1',
                target: '2',
                sourceHandle: 'address',
                targetHandle: 'address',
                type: 'smoothstep',
                style: { stroke: '#22c55e', strokeWidth: 2 },
            },
            {
                id: 'e2-3',
                source: '2',
                target: '3',
                sourceHandle: 'exposure',
                targetHandle: 'data',
                type: 'smoothstep',
                style: { stroke: '#3b82f6', strokeWidth: 2 },
            },
        ]);

        console.log('✅ Example nodes created');
    }, [deleteNode]);

    // ---------------------------------------------------------------------------
    // REACT FLOW HANDLERS (for native ReactFlow integration)
    // ---------------------------------------------------------------------------

    const onNodesChange = useCallback((changes: any) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes: any) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const onConnect = useCallback((connection: any) => {
        setEdges((eds) => addEdge(connection, eds));
    }, []);

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

        // React Flow handlers
        onNodesChange,
        onEdgesChange,
        onConnect,

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
        createExampleNodes, // Create UE5-style test nodes
        addNodeAtPosition, // Drag-and-drop handler
        deleteNode, // ⭐ NEW: Delete node handler

        // Loading states
        isSaving,
        isLoading,
    };
};