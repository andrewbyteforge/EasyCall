// =============================================================================
// FILE: frontend/src/components/canvas/WorkflowCanvas.tsx
// =============================================================================
// Main workflow canvas component using React Flow.
// =============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Connection,
    BackgroundVariant,
    Viewport,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowApi, Workflow } from '../../api/workflow_api';
import {
    getAllNodeTypes,
    NodeTypeDefinition,
    NodeInput,
    NodeOutput
} from '../../types/node_types';

// =============================================================================
// COMPONENT
// =============================================================================

const WorkflowCanvas: React.FC = () => {
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

    // ---------------------------------------------------------------------------
    // DELETE NODE
    // ---------------------------------------------------------------------------

    const deleteNode = useCallback((nodeId: string) => {
        console.log('[DELETE] Removing node:', nodeId);

        // Remove node
        setNodes((nds: Node[]) => nds.filter((node) => node.id !== nodeId));

        // Remove connected edges
        setEdges((eds: Edge[]) => eds.filter(
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
            const nodeDefinition = allNodeTypes.find((n: NodeTypeDefinition) => n.type === nodeType);

            if (!nodeDefinition) {
                console.error('[ERROR] Unknown node type:', nodeType);
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

                    // Map inputs from definition with proper typing
                    inputs: nodeDefinition.inputs.map((input: NodeInput) => ({
                        id: input.id,
                        label: input.label,
                        type: input.type,
                        color: input.type, // Use type as color key
                    })),

                    // Map outputs from definition with proper typing
                    outputs: nodeDefinition.outputs.map((output: NodeOutput) => ({
                        id: output.id,
                        label: output.label,
                        type: output.type,
                        color: output.type, // Use type as color key
                    })),

                    // Initialize with default properties
                    properties: [],

                    // Delete handler (using closure with captured ID)
                    onDelete: () => deleteNode(id),
                },
            };

            setNodes((nds: Node[]) => [...nds, newNode]);

            console.log('[ADD NODE] Created:', nodeDefinition.name, 'at', snappedPosition);
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
                console.log('[SAVE] Updating workflow:', currentWorkflowId);
                savedWorkflow = await workflowApi.updateWorkflow(
                    currentWorkflowId,
                    workflowData
                );
            } else {
                // Create new workflow
                console.log('[SAVE] Creating new workflow');
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

            console.log('[SAVE] SUCCESS - Workflow saved:', savedWorkflow.name);
            return savedWorkflow;
        } catch (error) {
            console.error('[SAVE] ERROR - Failed to save workflow:', error);
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
                console.log('[LOAD] TODO: Open workflow selection dialog');
                return;
            }

            setIsLoading(true);
            try {
                console.log('[LOAD] Loading workflow:', workflowId);
                const workflow = await workflowApi.getWorkflow(workflowId);

                // Restore nodes with delete handlers
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

                console.log('[LOAD] SUCCESS - Workflow loaded:', workflow.name);
                return workflow;
            } catch (error) {
                console.error('[LOAD] ERROR - Failed to load workflow:', error);
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
            console.log('[NEW] WARNING: You have unsaved changes');
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

        console.log('[NEW] SUCCESS - New workflow created');
    }, [hasUnsavedChanges]);

    // ---------------------------------------------------------------------------
    // EXECUTE WORKFLOW
    // ---------------------------------------------------------------------------

    const executeWorkflow = useCallback(async () => {
        if (!canExecute) {
            console.log('[EXECUTE] WARNING: Cannot execute - Workflow has no nodes');
            return;
        }

        console.log('[EXECUTE] Starting workflow:', workflowName);
        console.log('[EXECUTE] Nodes:', nodes.length, '| Edges:', edges.length);

        // TODO: Implement actual workflow execution in Phase 4
        try {
            // Future: Call execution API endpoint
            // if (currentWorkflowId) {
            //     const result = await executionApi.executeWorkflow(currentWorkflowId);
            //     return result;
            // }

            console.log('[EXECUTE] SUCCESS - Workflow execution completed (placeholder)');
        } catch (error) {
            console.error('[EXECUTE] ERROR - Failed to execute workflow:', error);
            throw error;
        }
    }, [canExecute, workflowName, nodes, edges, currentWorkflowId]);

    // ---------------------------------------------------------------------------
    // CREATE EXAMPLE NODES (UE5 Style - for testing)
    // ---------------------------------------------------------------------------

    const createExampleNodes = useCallback(() => {
        console.log('[TEST] Creating UE5-style example nodes');

        const exampleNodes: Node[] = [
            {
                id: 'example_1',
                type: 'default',
                position: { x: 100, y: 100 },
                data: {
                    label: 'Single Address',
                    category: 'input' as const,
                    icon: '📍',
                    nodeType: 'single_address',
                    inputs: [],
                    outputs: [
                        { id: 'address', label: 'Address', type: 'address', color: 'address' },
                        { id: 'network', label: 'Network', type: 'string', color: 'string' },
                    ],
                    properties: [
                        { key: 'Address', value: '0x742d35Cc...' },
                        { key: 'Network', value: 'Ethereum' },
                    ],
                    onDelete: () => deleteNode('example_1'),
                },
            },
            {
                id: 'example_2',
                type: 'default',
                position: { x: 400, y: 80 },
                data: {
                    label: 'Total Exposure',
                    category: 'query' as const,
                    icon: '🔍',
                    nodeType: 'trm_total_exposure',
                    inputs: [
                        { id: 'address', label: 'Address', type: 'address', color: 'address' },
                    ],
                    outputs: [
                        { id: 'exposure', label: 'Exposure Data', type: 'data', color: 'data' },
                        { id: 'risk', label: 'Risk Score', type: 'number', color: 'number' },
                    ],
                    properties: [
                        { key: 'Provider', value: 'TRM Labs' },
                        { key: 'Timeout', value: '30s' },
                    ],
                    onDelete: () => deleteNode('example_2'),
                },
            },
            {
                id: 'example_3',
                type: 'default',
                position: { x: 750, y: 100 },
                data: {
                    label: 'Excel Export',
                    category: 'output' as const,
                    icon: '📤',
                    nodeType: 'excel_export',
                    inputs: [
                        { id: 'data', label: 'Data', type: 'data', color: 'data' },
                    ],
                    outputs: [],
                    properties: [
                        { key: 'Format', value: 'XLSX' },
                        { key: 'Include Headers', value: 'Yes' },
                    ],
                    onDelete: () => deleteNode('example_3'),
                },
            },
        ];

        setNodes(exampleNodes);

        setEdges([
            {
                id: 'e1-2',
                source: 'example_1',
                target: 'example_2',
                sourceHandle: 'address',
                targetHandle: 'address',
                type: 'smoothstep',
                style: { stroke: '#22c55e', strokeWidth: 2 },
            },
            {
                id: 'e2-3',
                source: 'example_2',
                target: 'example_3',
                sourceHandle: 'exposure',
                targetHandle: 'data',
                type: 'smoothstep',
                style: { stroke: '#3b82f6', strokeWidth: 2 },
            },
        ]);

        console.log('[TEST] SUCCESS - 3 example nodes created with connections');
    }, [deleteNode]);

    // ---------------------------------------------------------------------------
    // REACT FLOW HANDLERS
    // ---------------------------------------------------------------------------

    const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds: Node[]) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
        setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds));
    }, []);

    const onConnect: OnConnect = useCallback((connection: Connection) => {
        setEdges((eds: Edge[]) => addEdge(connection, eds));
        console.log('[CONNECT] Nodes connected:', connection.source, '->', connection.target);
    }, []);

    // ---------------------------------------------------------------------------
    // DRAG AND DROP HANDLERS
    // ---------------------------------------------------------------------------

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        const nodeType = event.dataTransfer.getData('application/reactflow');

        if (!nodeType) {
            return;
        }

        // Get canvas position from drop event
        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        };

        addNodeAtPosition(nodeType, position);
    }, [addNodeAtPosition]);

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView
                attributionPosition="bottom-left"
                style={{ backgroundColor: '#1a1a1a' }}
            >
                {/* Grid background (Unreal Engine style) */}
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#2a2a2a"
                />

                {/* Zoom/Pan controls */}
                <Controls
                    style={{
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #3a3a3a',
                    }}
                />

                {/* Minimap */}
                <MiniMap
                    nodeColor={(node) => {
                        // Color nodes by category in minimap
                        const category = node.data?.category;
                        const colors: Record<string, string> = {
                            configuration: '#4a148c',
                            input: '#1976d2',
                            query: '#00897b',
                            output: '#f57c00',
                        };
                        return colors[category] || '#666666';
                    }}
                    style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                    }}
                    maskColor="rgba(0, 0, 0, 0.5)"
                />
            </ReactFlow>
        </div>
    );
};

// =============================================================================
// EXPORT
// =============================================================================

export default WorkflowCanvas;