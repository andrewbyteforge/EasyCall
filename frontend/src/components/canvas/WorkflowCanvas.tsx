// =============================================================================
// FILE: frontend/src/components/canvas/WorkflowCanvas.tsx
// =============================================================================
// Main workflow canvas component using React Flow with custom UE5-style nodes.
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
    NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowApi, Workflow } from '../../api/workflow_api';
import {
    getAllNodeTypes,
    NodeTypeDefinition,
    getNodeType,
    getCategoryColor,
} from '../../types/node_types';

// Import your custom BaseNode component
import BaseNode from '../nodes/BaseNode';

// =============================================================================
// CUSTOM NODE TYPES REGISTRATION
// =============================================================================

/**
 * Register all 21 node types to use the BaseNode component.
 * This tells React Flow to render our custom component instead of defaults.
 */
const customNodeTypes: NodeTypes = {
    // Configuration Nodes
    credential_chainalysis: BaseNode,
    credential_trm: BaseNode,

    // Input Nodes
    single_address: BaseNode,
    batch_input: BaseNode,
    transaction_hash: BaseNode,

    // Chainalysis Query Nodes
    chainalysis_cluster_info: BaseNode,
    chainalysis_cluster_balance: BaseNode,
    chainalysis_cluster_counterparties: BaseNode,
    chainalysis_transaction_details: BaseNode,
    chainalysis_exposure_category: BaseNode,
    chainalysis_exposure_service: BaseNode,

    // TRM Labs Query Nodes
    trm_address_attribution: BaseNode,
    trm_total_exposure: BaseNode,
    trm_address_summary: BaseNode,
    trm_address_transfers: BaseNode,
    trm_network_intelligence: BaseNode,

    // Output Nodes
    txt_export: BaseNode,
    excel_export: BaseNode,
    json_export: BaseNode,
    csv_export: BaseNode,
    console_log: BaseNode,
};

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
            // Get node definition
            const nodeDefinition = getNodeType(nodeType);

            if (!nodeDefinition) {
                console.error('[ERROR] Unknown node type:', nodeType);
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
            const newNode: Node = {
                id,
                type: nodeType, // ← Use actual node type, NOT 'default'
                position: snappedPosition,
                data: {
                    label: nodeDefinition.name,
                    category: nodeDefinition.category,
                    icon: nodeDefinition.icon,
                    description: nodeDefinition.description,

                    // Map inputs to format BaseNode expects
                    inputs: nodeDefinition.inputs.map((input) => ({
                        id: input.id,
                        label: input.label,
                    })),

                    // Map outputs to format BaseNode expects
                    outputs: nodeDefinition.outputs.map((output) => ({
                        id: output.id,
                        label: output.label,
                    })),
                },
            };

            setNodes((nds: Node[]) => [...nds, newNode]);

            console.log('[ADD NODE] Created:', nodeDefinition.name, 'at', snappedPosition);
        },
        []
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

                console.log('[LOAD] SUCCESS - Workflow loaded:', workflow.name);
                return workflow;
            } catch (error) {
                console.error('[LOAD] ERROR - Failed to load workflow:', error);
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
            console.log('[EXECUTE] SUCCESS - Workflow execution completed (placeholder)');
        } catch (error) {
            console.error('[EXECUTE] ERROR - Failed to execute workflow:', error);
            throw error;
        }
    }, [canExecute, workflowName, nodes, edges]);

    // ---------------------------------------------------------------------------
    // CREATE EXAMPLE NODES (for testing)
    // ---------------------------------------------------------------------------

    const createExampleNodes = useCallback(() => {
        console.log('[TEST] Creating example workflow with styled nodes');

        const exampleNodes: Node[] = [
            // Configuration node
            {
                id: 'cred_1',
                type: 'credential_chainalysis', // ← Using real node type
                position: { x: 100, y: 100 },
                data: {
                    label: 'Chainalysis Credentials',
                    category: 'configuration',
                    icon: '🔑',
                    description: 'API credentials for Chainalysis',
                    inputs: [],
                    outputs: [{ id: 'credentials', label: 'credentials' }],
                },
            },

            // Input node
            {
                id: 'input_1',
                type: 'single_address', // ← Using real node type
                position: { x: 100, y: 280 },
                data: {
                    label: 'Single Address Input',
                    category: 'input',
                    icon: '📍',
                    description: 'Enter a single blockchain address',
                    inputs: [],
                    outputs: [
                        { id: 'address', label: 'address' },
                        { id: 'blockchain', label: 'blockchain' },
                    ],
                },
            },

            // Query node
            {
                id: 'query_1',
                type: 'chainalysis_cluster_info', // ← Using real node type
                position: { x: 450, y: 180 },
                data: {
                    label: 'Cluster Info (Chainalysis)',
                    category: 'query',
                    icon: '🏢',
                    description: 'Get cluster information',
                    inputs: [
                        { id: 'credentials', label: 'credentials' },
                        { id: 'address', label: 'address' },
                    ],
                    outputs: [
                        { id: 'cluster_name', label: 'cluster_name' },
                        { id: 'category', label: 'category' },
                        { id: 'cluster_address', label: 'cluster_address' },
                    ],
                },
            },

            // Output node
            {
                id: 'output_1',
                type: 'excel_export', // ← Using real node type
                position: { x: 820, y: 200 },
                data: {
                    label: 'Excel Export',
                    category: 'output',
                    icon: '📊',
                    description: 'Export to Excel file',
                    inputs: [{ id: 'data', label: 'data' }],
                    outputs: [{ id: 'file_path', label: 'file_path' }],
                },
            },
        ];

        setNodes(exampleNodes);

        // Create connections
        setEdges([
            {
                id: 'e-cred-query',
                source: 'cred_1',
                target: 'query_1',
                sourceHandle: 'credentials',
                targetHandle: 'credentials',
                type: 'smoothstep',
                animated: true,
            },
            {
                id: 'e-input-query',
                source: 'input_1',
                target: 'query_1',
                sourceHandle: 'address',
                targetHandle: 'address',
                type: 'smoothstep',
                animated: true,
            },
            {
                id: 'e-query-output',
                source: 'query_1',
                target: 'output_1',
                sourceHandle: 'cluster_name',
                targetHandle: 'data',
                type: 'smoothstep',
                animated: true,
            },
        ]);

        console.log('[TEST] SUCCESS - Example workflow created with 4 styled nodes');
    }, []);

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
            {/* Test button - temporary for Phase 2 */}
            <button
                onClick={createExampleNodes}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 10,
                    padding: '10px 20px',
                    backgroundColor: '#00897b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                }}
            >
                🎨 Create Example Nodes
            </button>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={customNodeTypes} // ← CRITICAL: Use custom node types
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                attributionPosition="bottom-left"
                style={{ backgroundColor: '#1a1a1a' }}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#00897b', strokeWidth: 2 },
                }}
            >
                {/* Grid background (Unreal Engine style) */}
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#404040"
                />

                {/* Zoom/Pan controls */}
                <Controls
                    style={{
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #404040',
                    }}
                />

                {/* Minimap with category colors */}
                <MiniMap
                    nodeColor={(node) => {
                        const nodeDef = getNodeType(node.type || 'default');
                        if (nodeDef) {
                            return getCategoryColor(nodeDef.category);
                        }
                        return '#666666';
                    }}
                    style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                    }}
                    maskColor="rgba(26, 26, 26, 0.6)"
                />
            </ReactFlow>
        </div>
    );
};

// =============================================================================
// EXPORT
// =============================================================================

export default WorkflowCanvas;