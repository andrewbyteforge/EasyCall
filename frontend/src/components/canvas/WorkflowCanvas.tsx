// =============================================================================
// FILE: frontend/src/components/canvas/WorkflowCanvas.tsx
// =============================================================================
// Main workflow canvas component using React Flow with custom UE5-style nodes.
// Supports both static nodes AND dynamic database-generated nodes.
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
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowApi } from '../../api/workflow_api';
import {
    getAllNodeTypes,
    NodeTypeDefinition,
    getNodeType,
    getCategoryColor,
    DataType,
    NodeCategory,
} from '../../types/node_types';
import { useGeneratedNodes } from '../../hooks/useProviders';

// Import your custom BaseNode component
import BaseNode from '../nodes/BaseNode';

// =============================================================================
// STATIC NODE TYPES REGISTRATION
// =============================================================================

/**
 * Register all 24 static node types to use the BaseNode component.
 * This is the base configuration before adding database nodes.
 */
const STATIC_NODE_TYPES: NodeTypes = {
    // Configuration Nodes
    credential_chainalysis: BaseNode,
    credential_trm: BaseNode,

    // Input Nodes
    single_address: BaseNode,
    batch_input: BaseNode,
    transaction_hash: BaseNode,
    batch_transaction: BaseNode,

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
    output_path: BaseNode,
    txt_export: BaseNode,
    excel_export: BaseNode,
    json_export: BaseNode,
    csv_export: BaseNode,
    pdf_export: BaseNode,
    console_log: BaseNode,
};

// =============================================================================
// DATA TYPE COMPATIBILITY MATRIX
// =============================================================================

/**
 * Defines which data types can connect to each other.
 * ANY type can connect to anything.
 */
const DATA_TYPE_COMPATIBILITY: Record<DataType, DataType[]> = {
    [DataType.ADDRESS]: [DataType.ADDRESS, DataType.STRING, DataType.ANY],
    [DataType.ADDRESS_LIST]: [DataType.ADDRESS_LIST, DataType.ADDRESS, DataType.ANY],
    [DataType.TRANSACTION]: [DataType.TRANSACTION, DataType.STRING, DataType.ANY],
    [DataType.TRANSACTION_LIST]: [DataType.TRANSACTION_LIST, DataType.TRANSACTION, DataType.ANY],
    [DataType.CREDENTIALS]: [DataType.CREDENTIALS, DataType.ANY],
    [DataType.JSON_DATA]: [DataType.JSON_DATA, DataType.ANY],
    [DataType.STRING]: [DataType.STRING, DataType.ADDRESS, DataType.TRANSACTION, DataType.ANY],
    [DataType.NUMBER]: [DataType.NUMBER, DataType.ANY],
    [DataType.BOOLEAN]: [DataType.BOOLEAN, DataType.ANY],
    [DataType.ANY]: Object.values(DataType),
};

/**
 * Check if two data types are compatible for connection.
 */
function areTypesCompatible(sourceType: DataType, targetType: DataType): boolean {
    // ANY type on either side is always compatible
    if (sourceType === DataType.ANY || targetType === DataType.ANY) {
        return true;
    }

    // Check if source type can connect to target type
    const compatibleTypes = DATA_TYPE_COMPATIBILITY[sourceType];
    return compatibleTypes?.includes(targetType) ?? false;
}

// =============================================================================
// COMPONENT
// =============================================================================

const WorkflowCanvasInner: React.FC = () => {
    // ---------------------------------------------------------------------------
    // FETCH DATABASE NODES - Dynamic node types from OpenAPI specs
    // ---------------------------------------------------------------------------
    const { nodes: generatedNodes, loading: loadingGeneratedNodes } = useGeneratedNodes();

    // ---------------------------------------------------------------------------
    // BUILD DYNAMIC NODE TYPES - Merge static + database nodes
    // ---------------------------------------------------------------------------

    /**
     * Dynamically build nodeTypes by combining static nodes + database nodes.
     * This ensures React Flow knows how to render ALL node types.
     */
    const customNodeTypes: NodeTypes = useMemo(() => {
        const dynamicTypes: NodeTypes = { ...STATIC_NODE_TYPES };

        // Register each database-generated node
        generatedNodes.forEach((generatedNode) => {
            dynamicTypes[generatedNode.type] = BaseNode;
        });

        console.log(
            `[NODE TYPES] Registered ${Object.keys(STATIC_NODE_TYPES).length} static + ${generatedNodes.length} database nodes = ${Object.keys(dynamicTypes).length} total`
        );

        return dynamicTypes;
    }, [generatedNodes]);

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

    // Workflow name editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    // ---------------------------------------------------------------------------
    // COMPUTED PROPERTIES
    // ---------------------------------------------------------------------------

    // Check if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        const currentState = JSON.stringify({ nodes, edges, viewport, workflowName });
        return currentState !== lastSavedState;
    }, [nodes, edges, viewport, workflowName, lastSavedState]);

    // Check if workflow can be executed
    // Validates: nodes exist, required inputs are connected, and connections are valid
    const canExecute = useMemo(() => {
        if (nodes.length === 0) return false;

        // Check each node for required inputs
        for (const node of nodes) {
            // Try static nodes first
            let nodeDefinition = getNodeType(node.type || '');

            // If not found in static nodes, check database nodes
            if (!nodeDefinition) {
                const generatedNode = generatedNodes.find((n) => n.type === node.type);
                if (generatedNode) {
                    // Use database node's inputs for validation
                    nodeDefinition = {
                        inputs: generatedNode.inputs,
                        outputs: generatedNode.outputs,
                    } as any;
                }
            }

            if (!nodeDefinition) continue;

            // Check each required input
            for (const input of nodeDefinition.inputs) {
                if (input.required) {
                    // Find if there's an edge connecting to this input
                    const hasConnection = edges.some(
                        (edge) => edge.target === node.id && edge.targetHandle === input.id
                    );
                    if (!hasConnection) {
                        console.log(`[VALIDATE] Missing required input: ${node.id}.${input.id}`);
                        return false;
                    }
                }
            }
        }

        return true;
    }, [nodes, edges, generatedNodes]);

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
    // ADD NODE AT POSITION (Drag-and-Drop) - Supports static + database nodes
    // ---------------------------------------------------------------------------

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
            const newNode: Node = {
                id,
                type: nodeType, // ← Use actual node type so React Flow uses correct component
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

                    // Include configuration fields for editable nodes
                    configuration: nodeDefinition.configuration || [],
                    configValues: {},
                },
            };

            setNodes((nds: Node[]) => [...nds, newNode]);

            console.log('[ADD NODE] Created:', nodeDefinition.name, 'at', snappedPosition);
        },
        [generatedNodes]
    );

    // ---------------------------------------------------------------------------
    // SAVE WORKFLOW TO FILE
    // ---------------------------------------------------------------------------

    const saveWorkflow = useCallback(async () => {
        setIsSaving(true);
        try {
            const workflowData = {
                name: workflowName,
                version: '1.0',
                savedAt: new Date().toISOString(),
                canvas_data: {
                    nodes,
                    edges,
                    viewport,
                },
            };

            // Create JSON blob
            const jsonString = JSON.stringify(workflowData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${workflowName.replace(/[^a-z0-9]/gi, '_')}.easycall.json`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Update last saved state
            const savedState = JSON.stringify({
                nodes,
                edges,
                viewport,
                workflowName,
            });
            setLastSavedState(savedState);

            console.log('[SAVE] SUCCESS - Workflow saved to file:', link.download);
        } catch (error) {
            console.error('[SAVE] ERROR - Failed to save workflow:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [nodes, edges, viewport, workflowName]);

    // ---------------------------------------------------------------------------
    // LOAD WORKFLOW FROM FILE
    // ---------------------------------------------------------------------------

    const loadWorkflowFromFile = useCallback((file: File) => {
        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const workflowData = JSON.parse(content);

                // Validate the file structure
                if (!workflowData.canvas_data || !workflowData.name) {
                    alert('Invalid workflow file format.');
                    setIsLoading(false);
                    return;
                }

                // Check for unsaved changes
                if (hasUnsavedChanges) {
                    const confirmed = window.confirm(
                        'You have unsaved changes. Are you sure you want to load a different workflow?'
                    );
                    if (!confirmed) {
                        setIsLoading(false);
                        return;
                    }
                }

                setNodes(workflowData.canvas_data.nodes || []);
                setEdges(workflowData.canvas_data.edges || []);
                setViewport(workflowData.canvas_data.viewport || { x: 0, y: 0, zoom: 1 });
                setCurrentWorkflowId(null);
                setWorkflowName(workflowData.name);

                // Update last saved state
                const savedState = JSON.stringify({
                    nodes: workflowData.canvas_data.nodes || [],
                    edges: workflowData.canvas_data.edges || [],
                    viewport: workflowData.canvas_data.viewport || { x: 0, y: 0, zoom: 1 },
                    workflowName: workflowData.name,
                });
                setLastSavedState(savedState);

                console.log('[LOAD] SUCCESS - Workflow loaded from file:', workflowData.name);
            } catch (error) {
                console.error('[LOAD] ERROR - Failed to parse workflow file:', error);
                alert('Failed to load workflow file. Please ensure it is a valid .easycall.json file.');
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            console.error('[LOAD] ERROR - Failed to read file');
            alert('Failed to read the file.');
            setIsLoading(false);
        };

        reader.readAsText(file);
    }, [hasUnsavedChanges]);

    // ---------------------------------------------------------------------------
    // OPEN FILE PICKER
    // ---------------------------------------------------------------------------

    const openFilePicker = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.easycall.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                loadWorkflowFromFile(file);
            }
        };
        input.click();
    }, [loadWorkflowFromFile]);

    // ---------------------------------------------------------------------------
    // CREATE NEW WORKFLOW
    // ---------------------------------------------------------------------------

    const createNewWorkflow = useCallback(() => {
        // Check for unsaved changes
        if (hasUnsavedChanges) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to create a new workflow?'
            );
            if (!confirmed) return;
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
    // WORKFLOW NAME EDITING
    // ---------------------------------------------------------------------------

    const startEditingName = useCallback(() => {
        setEditedName(workflowName);
        setIsEditingName(true);
    }, [workflowName]);

    const saveEditedName = useCallback(() => {
        if (editedName.trim()) {
            setWorkflowName(editedName.trim());
        }
        setIsEditingName(false);
    }, [editedName]);

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
                type: 'credential_chainalysis',
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
                type: 'single_address',
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
                type: 'chainalysis_cluster_info',
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
                type: 'excel_export',
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

    /**
     * Validates if a connection is allowed based on data type compatibility.
     * Supports both static and database-generated nodes.
     */
    const isValidConnection = useCallback((connection: Connection): boolean => {
        const { source, target, sourceHandle, targetHandle } = connection;

        if (!source || !target || !sourceHandle || !targetHandle) {
            return false;
        }

        // Find source and target nodes
        const sourceNode = nodes.find((n) => n.id === source);
        const targetNode = nodes.find((n) => n.id === target);

        if (!sourceNode || !targetNode) {
            return false;
        }

        // Get node definitions (supports both static and database nodes)
        const sourceNodeDef = getNodeType(sourceNode.type || '') ||
            generatedNodes.find((n) => n.type === sourceNode.type);
        const targetNodeDef = getNodeType(targetNode.type || '') ||
            generatedNodes.find((n) => n.type === targetNode.type);

        if (!sourceNodeDef || !targetNodeDef) {
            return false;
        }

        // Find output and input pin definitions
        // Type assertion needed because database nodes use GeneratedNodePin which has compatible structure
        const outputPin = sourceNodeDef.outputs.find((o: any) => o.id === sourceHandle);
        const inputPin = targetNodeDef.inputs.find((i: any) => i.id === targetHandle);

        if (!outputPin || !inputPin) {
            console.log('[VALIDATE] Pin not found:', sourceHandle, '->', targetHandle);
            return false;
        }

        // Check type compatibility (cast to DataType for compatibility check)
        const isCompatible = areTypesCompatible(outputPin.type as DataType, inputPin.type as DataType);

        if (!isCompatible) {
            console.log(
                `[VALIDATE] Type mismatch: ${outputPin.type} -> ${inputPin.type}`,
                `(${sourceHandle} -> ${targetHandle})`
            );
        }

        return isCompatible;
    }, [nodes, generatedNodes]);

    const onConnect: OnConnect = useCallback((connection: Connection) => {
        // Validate connection before adding
        if (isValidConnection(connection)) {
            setEdges((eds: Edge[]) => addEdge({
                ...connection,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#00c853', strokeWidth: 2 },
            }, eds));
            console.log('[CONNECT] Valid connection:', connection.source, '->', connection.target);
        } else {
            console.log('[CONNECT] REJECTED - Invalid connection:', connection.source, '->', connection.target);
        }
    }, [isValidConnection]);

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

        console.log('[DROP] Dropped node type:', nodeType, 'at position:', position);
        addNodeAtPosition(nodeType, position);
    }, [addNodeAtPosition]);

    // ---------------------------------------------------------------------------
    // WORKFLOW EXECUTION - Validates and simulates data flow
    // ---------------------------------------------------------------------------

    const [isExecuting, setIsExecuting] = useState(false);
    const [executionLog, setExecutionLog] = useState<string[]>([]);
    const [showOutputPanel, setShowOutputPanel] = useState(false);

    /**
     * Execute the workflow by calling the backend API.
     */
    const runWorkflow = useCallback(async () => {
        if (!canExecute) {
            console.log('❌ [EXECUTE] Cannot run - workflow validation failed');
            return;
        }

        setIsExecuting(true);
        setExecutionLog([]);
        setShowOutputPanel(true);

        const log: string[] = [];
        const addLog = (message: string) => {
            console.log(message);
            log.push(message);
            setExecutionLog([...log]);
        };

        addLog('═══════════════════════════════════════════════════════════════');
        addLog('🚀 STARTING WORKFLOW EXECUTION');
        addLog('═══════════════════════════════════════════════════════════════');
        addLog(`📊 Sending ${nodes.length} nodes, ${edges.length} edges to backend...`);
        addLog('');

        try {
            // Call the backend execution API
            const result = await workflowApi.executeWorkflowDirect(nodes, edges, workflowName);

            // Display the execution log from backend
            if (result.execution_log && result.execution_log.length > 0) {
                result.execution_log.forEach((line) => {
                    addLog(line);
                });
            }

            // Add summary
            addLog('');
            addLog('═══════════════════════════════════════════════════════════════');
            if (result.status === 'success') {
                addLog('✅ BACKEND EXECUTION COMPLETED SUCCESSFULLY');
            } else {
                addLog('❌ BACKEND EXECUTION FAILED');
                if (result.error) {
                    addLog(`   Error: ${result.error}`);
                }
            }
            addLog('═══════════════════════════════════════════════════════════════');

            if (result.summary) {
                addLog('');
                addLog('📊 SUMMARY:');
                addLog(`   • Nodes executed: ${result.summary.nodes_executed}`);
                addLog(`   • Status: ${result.summary.status}`);
            }

        } catch (error: any) {
            addLog('');
            addLog('═══════════════════════════════════════════════════════════════');
            addLog('❌ EXECUTION ERROR');
            addLog('═══════════════════════════════════════════════════════════════');
            addLog(`   ${error.message || 'Unknown error occurred'}`);

            if (error.response?.data?.error) {
                addLog(`   Backend error: ${error.response.data.error}`);
            }
            if (error.response?.data?.traceback) {
                addLog('');
                addLog('📋 Traceback:');
                addLog(error.response.data.traceback);
            }

            console.error('[EXECUTE] API error:', error);
        }

        setIsExecuting(false);
    }, [canExecute, nodes, edges, workflowName]);

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}>
            {/* Top Toolbar */}
            <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '56px',
                backgroundColor: '#252526',
                borderBottom: '1px solid #3e3e42',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '16px',
            }}>
                {/* File Operations Group */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* New Button */}
                    <button
                        onClick={createNewWorkflow}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#3c3c3c',
                            color: '#ccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                        title="New Workflow"
                    >
                        📄 New
                    </button>

                    {/* Open/Load Button */}
                    <button
                        onClick={openFilePicker}
                        disabled={isLoading}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#3c3c3c',
                            color: '#ccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: isLoading ? 'wait' : 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                        title="Open Workflow from file"
                    >
                        {isLoading ? '⏳' : '📂'} Open
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={() => saveWorkflow()}
                        disabled={isSaving || nodes.length === 0}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: hasUnsavedChanges && nodes.length > 0 ? '#00897b' : '#3c3c3c',
                            color: hasUnsavedChanges && nodes.length > 0 ? 'white' : '#888',
                            border: hasUnsavedChanges && nodes.length > 0 ? '1px solid #00a98b' : '1px solid #555',
                            borderRadius: '4px',
                            cursor: isSaving || nodes.length === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                        title={nodes.length === 0 ? 'Add nodes to save' : 'Save Workflow to file'}
                    >
                        {isSaving ? '⏳' : '💾'} {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '32px', backgroundColor: '#555' }} />

                {/* Workflow Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    {isEditingName ? (
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={saveEditedName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditedName();
                                if (e.key === 'Escape') setIsEditingName(false);
                            }}
                            autoFocus
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#1e1e1e',
                                color: 'white',
                                border: '1px solid #00897b',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                outline: 'none',
                                minWidth: '200px',
                            }}
                        />
                    ) : (
                        <div
                            onClick={startEditingName}
                            style={{
                                padding: '6px 12px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                borderRadius: '4px',
                            }}
                            title="Click to rename"
                        >
                            {workflowName}
                            {hasUnsavedChanges && (
                                <span style={{ color: '#ff9800', fontSize: '10px' }}>●</span>
                            )}
                            <span style={{ color: '#666', fontSize: '11px' }}>✏️</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '32px', backgroundColor: '#555' }} />

                {/* Database Nodes Status Indicator */}
                {loadingGeneratedNodes && (
                    <div style={{
                        fontSize: '11px',
                        color: '#888',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                    }}>
                        <span>⏳ Loading database nodes...</span>
                    </div>
                )}
                {!loadingGeneratedNodes && generatedNodes.length > 0 && (
                    <div style={{
                        fontSize: '11px',
                        color: '#00897b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: '#00897b22',
                        borderRadius: '4px',
                        border: '1px solid #00897b',
                    }}>
                        <span>✓ {generatedNodes.length} database node{generatedNodes.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Status Indicator */}
                <div style={{
                    padding: '6px 12px',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '4px',
                    border: `1px solid ${canExecute ? '#00c853' : '#ff9800'}`,
                    color: canExecute ? '#00c853' : '#ff9800',
                    fontSize: '11px',
                    fontWeight: 500,
                }}>
                    {canExecute
                        ? `✓ ${nodes.length} nodes, ${edges.length} connections`
                        : `⚠ Connect required inputs`}
                </div>

                {/* Run Button */}
                <button
                    onClick={runWorkflow}
                    disabled={!canExecute || isExecuting}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: canExecute ? (isExecuting ? '#f57c00' : '#00c853') : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: canExecute && !isExecuting ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: canExecute ? '0 2px 8px rgba(0, 200, 83, 0.3)' : 'none',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {isExecuting ? '⏳' : '▶'} {isExecuting ? 'Running...' : 'Run'}
                </button>

                {/* Example Button */}
                <button
                    onClick={createExampleNodes}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#3c3c3c',
                        color: '#888',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                    }}
                    title="Load example workflow"
                >
                    🎨
                </button>
            </div>

            {/* Canvas Area - offset for toolbar */}
            <div style={{ position: 'absolute', top: '56px', left: 0, right: 0, bottom: 0 }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={customNodeTypes} // ← CRITICAL: Use dynamic node types (static + database)
                    isValidConnection={isValidConnection}
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

                    {/* Minimap with category colors (supports database nodes) */}
                    <MiniMap
                        nodeColor={(node) => {
                            const nodeDef = getNodeType(node.type || 'default') ||
                                generatedNodes.find((n) => n.type === node.type);
                            if (nodeDef) {
                                // Cast to NodeCategory for getCategoryColor
                                const category = (nodeDef.category || NodeCategory.QUERY) as NodeCategory;
                                return getCategoryColor(category);
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

            {/* Output Panel Toggle Button */}
            <button
                onClick={() => setShowOutputPanel(!showOutputPanel)}
                style={{
                    position: 'absolute',
                    bottom: showOutputPanel ? '252px' : '20px',
                    right: '20px',
                    zIndex: 20,
                    padding: '8px 16px',
                    backgroundColor: executionLog.length > 0 ? '#00897b' : '#444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                }}
            >
                {showOutputPanel ? '▼' : '▲'} Output {executionLog.length > 0 && `(${executionLog.length})`}
            </button>

            {/* Execution Output Panel */}
            {showOutputPanel && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '250px',
                        backgroundColor: '#1e1e1e',
                        borderTop: '2px solid #00897b',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 15,
                    }}
                >
                    {/* Panel Header */}
                    <div
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#252526',
                            borderBottom: '1px solid #3e3e42',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#00897b', fontWeight: 'bold', fontSize: '13px' }}>
                                📋 Execution Output
                            </span>
                            {isExecuting && (
                                <span style={{
                                    color: '#f57c00',
                                    fontSize: '12px',
                                    animation: 'pulse 1s infinite',
                                }}>
                                    ⏳ Running...
                                </span>
                            )}
                            {!isExecuting && executionLog.length > 0 && (
                                <span style={{ color: '#00c853', fontSize: '12px' }}>
                                    ✅ Complete
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setExecutionLog([])}
                                style={{
                                    padding: '4px 12px',
                                    backgroundColor: '#333',
                                    color: '#888',
                                    border: '1px solid #444',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                }}
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setShowOutputPanel(false)}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'transparent',
                                    color: '#888',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Log Content */}
                    <div
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '12px 16px',
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: '12px',
                            lineHeight: '1.5',
                            color: '#cccccc',
                        }}
                    >
                        {executionLog.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
                                Click "Run Workflow" to see execution output here
                            </div>
                        ) : (
                            executionLog.map((line, index) => (
                                <div
                                    key={index}
                                    style={{
                                        whiteSpace: 'pre-wrap',
                                        color: line.includes('✅') ? '#00c853'
                                            : line.includes('❌') ? '#f44336'
                                                : line.includes('▶') ? '#2196f3'
                                                    : line.includes('═') ? '#00897b'
                                                        : line.includes('📥') ? '#ff9800'
                                                            : line.includes('📤') ? '#4caf50'
                                                                : line.includes('⚙️') ? '#9c27b0'
                                                                    : '#cccccc',
                                    }}
                                >
                                    {line}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

// =============================================================================
// WRAPPED COMPONENT WITH PROVIDER
// =============================================================================

const WorkflowCanvas: React.FC = () => {
    return (
        <ReactFlowProvider>
            <WorkflowCanvasInner />
        </ReactFlowProvider>
    );
};

// =============================================================================
// EXPORT
// =============================================================================

export default WorkflowCanvas;