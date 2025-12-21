// =============================================================================
// FILE: frontend/src/hooks/useWorkflow.ts
// =============================================================================
// Custom hook for managing workflow state and operations.
// Handles nodes, edges, viewport, and workflow CRUD operations.
// Supports both static nodes AND dynamic database-generated nodes.
// =============================================================================

import { useState, useCallback, useMemo } from 'react';
import { Node, Edge, Viewport, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { workflowApi, Workflow } from '../api/workflow_api';
import { getAllNodeTypes, getNodeType } from '../types/node_types';
import { useGeneratedNodes } from './useProviders';

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
    // FETCH DATABASE NODES - For dynamic node support
    // ---------------------------------------------------------------------------

    const { nodes: generatedNodes } = useGeneratedNodes();

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
    // DELETE NODE
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
    // ADD NODE AT POSITION (Drag-and-Drop) - Supports static + database nodes
    // ---------------------------------------------------------------------------

    // =============================================================================
    // FILE: frontend/src/hooks/useWorkflow.ts
    // =============================================================================

    // ... (keep all imports and earlier code the same) ...

    const addNodeAtPosition = useCallback(
        (nodeType: string, position: { x: number; y: number }) => {
            // Try to find node definition in static nodes first
            let nodeDefinition = getNodeType(nodeType);

            // If not found in static nodes, check database-generated nodes
            if (!nodeDefinition) {
                const generatedNode = generatedNodes.find((n) => n.type === nodeType);
                if (generatedNode) {
                    // Convert GeneratedNodeDefinition to NodeTypeDefinition format
                    nodeDefinition = {
                        type: generatedNode.type,
                        category: generatedNode.category as any,
                        provider: generatedNode.provider as any,
                        name: generatedNode.name,
                        icon: generatedNode.visual.icon,
                        color: generatedNode.visual.color,
                        description: generatedNode.description,
                        visual: generatedNode.visual,
                        documentation: {
                            name: generatedNode.name,
                            description: generatedNode.description,
                            longDescription: generatedNode.description,
                            usage: `Connect inputs → Execute → Use outputs`,
                            examples: [`Query ${generatedNode.provider} API`],
                        },
                        inputs: generatedNode.inputs.map((pin) => ({
                            id: pin.id,
                            label: pin.label,
                            type: pin.type as any,
                            required: pin.required,
                            description: pin.description,
                        })),
                        outputs: generatedNode.outputs.map((pin) => ({
                            id: pin.id,
                            label: pin.label,
                            type: pin.type as any,
                            description: pin.description,
                        })),
                        configuration: generatedNode.configuration || [],
                    };
                }
            }

            if (!nodeDefinition) {
                console.error('[ERROR] Unknown node type:', nodeType);
                console.log('Available static nodes:', getAllNodeTypes().map(n => n.type));
                console.log('Available database nodes:', generatedNodes.map(n => n.type));
                return;
            }

            // Generate unique ID
            const id = `${nodeType}_${Date.now()}`;

            // Snap to grid (15x15 to match React Flow snap settings)
            const snappedPosition = {
                x: Math.round(position.x / 15) * 15,
                y: Math.round(position.y / 15) * 15,
            };

            // ✅ CRITICAL: Create node with proper structure for BaseNode
            // THIS IS THE FIX - Include type and color for each pin
            const newNode: Node = {
                id,
                type: nodeType, // ← Use actual node type so React Flow uses correct component
                position: snappedPosition,
                data: {
                    label: nodeDefinition.name,
                    category: nodeDefinition.category,
                    icon: nodeDefinition.icon,
                    description: nodeDefinition.description,
                    nodeType: nodeType, // Add nodeType field

                    // ⭐ FIX: Map inputs with type and color fields
                    inputs: nodeDefinition.inputs.map((input) => ({
                        id: input.id,
                        label: input.label,
                        type: input.type,        // ← ADD THIS
                        color: input.type,       // ← ADD THIS
                    })),

                    // ⭐ FIX: Map outputs with type and color fields
                    outputs: nodeDefinition.outputs.map((output) => ({
                        id: output.id,
                        label: output.label,
                        type: output.type,       // ← ADD THIS
                        color: output.type,      // ← ADD THIS
                    })),

                    // Include configuration fields for editable nodes
                    configuration: nodeDefinition.configuration || [],
                    configValues: {},

                    // Initialize with default properties
                    properties: [],

                    // Add delete handler
                    onDelete: () => deleteNode(id),
                },
            };

            setNodes((nds: Node[]) => [...nds, newNode]);

            console.log('[ADD NODE] Created:', nodeDefinition.name, 'at', snappedPosition);
            console.log('[ADD NODE] Inputs:', nodeDefinition.inputs.length, 'Outputs:', nodeDefinition.outputs.length);
        },
        [deleteNode, generatedNodes]
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
                type: 'single_address', // ← Use actual node type
                position: { x: 100, y: 100 },
                data: {
                    label: 'Single Address',
                    category: 'input',
                    icon: '📍',
                    inputs: [],
                    outputs: [
                        { id: 'address', label: 'Address', type: 'address', color: 'address' },
                        { id: 'network', label: 'Network', type: 'string', color: 'data' },
                    ],
                    properties: [
                        { key: 'Address', value: '0x742d35Cc...' },
                        { key: 'Network', value: 'Ethereum' },
                    ],
                    onDelete: () => deleteNode('1'),
                },
            },
            {
                id: '2',
                type: 'trm_total_exposure', // ← Use actual node type
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
                    onDelete: () => deleteNode('2'),
                },
            },
            {
                id: '3',
                type: 'excel_export', // ← Use actual node type
                position: { x: 750, y: 100 },
                data: {
                    label: 'Excel Export',
                    category: 'output',
                    icon: '📤',
                    inputs: [
                        { id: 'data', label: 'Data', type: 'data', color: 'data' },
                    ],
                    outputs: [],
                    properties: [
                        { key: 'Format', value: 'XLSX' },
                        { key: 'Include Headers', value: 'Yes' },
                    ],
                    onDelete: () => deleteNode('3'),
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
        addNodeAtPosition, // Drag-and-drop handler (supports static + database nodes)
        deleteNode, // Delete node handler

        // Loading states
        isSaving,
        isLoading,
    };
};