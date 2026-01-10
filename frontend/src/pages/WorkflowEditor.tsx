// =============================================================================
// FILE: frontend/src/pages/WorkflowEditor.tsx
// =============================================================================
// Edit mode page for a specific workflow from the dashboard.
// Loads the workflow from database, allows editing, saving, and renaming.
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    EdgeTypes,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    Chip,
    CircularProgress,
    Snackbar,
    Alert,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    alpha,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
    PlayArrow as RunIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { getWorkflow, updateWorkflow, executeWorkflowDirect, Workflow } from '../api/workflow_api';
import {
    NodeTypeDefinition,
    getNodeType,
    DataType,
} from '../types/node_types';
import { useGeneratedNodes } from '../hooks/useProviders';
import type { GeneratedNodeDefinition } from '../types/provider';
import BaseNode from '../components/nodes/BaseNode';
import ClippedEdge from '../components/canvas/ClippedEdge';
import NodePalette from '../components/canvas/NodePalette';
import { useEasyMode } from '../context/EasyModeContext';
import NodeHelpDialog from '../components/canvas/NodeHelpDialog';
import { colors } from '../theme';

// =============================================================================
// EDGE TYPES
// =============================================================================

const customEdgeTypes: EdgeTypes = {
    clipped: ClippedEdge,
};

// =============================================================================
// STATIC NODE TYPES
// =============================================================================

const STATIC_NODE_TYPES: NodeTypes = {
    credential_chainalysis: BaseNode,
    credential_trm: BaseNode,
    single_address: BaseNode,
    batch_input: BaseNode,
    transaction_hash: BaseNode,
    batch_transaction: BaseNode,
    chainalysis_cluster_info: BaseNode,
    chainalysis_cluster_balance: BaseNode,
    chainalysis_cluster_counterparties: BaseNode,
    chainalysis_transaction_details: BaseNode,
    chainalysis_exposure_category: BaseNode,
    chainalysis_exposure_service: BaseNode,
    trm_address_attribution: BaseNode,
    trm_total_exposure: BaseNode,
    trm_address_summary: BaseNode,
    trm_address_transfers: BaseNode,
    trm_network_intelligence: BaseNode,
    output_path: BaseNode,
    txt_export: BaseNode,
    excel_export: BaseNode,
    json_export: BaseNode,
    csv_export: BaseNode,
    pdf_export: BaseNode,
    console_log: BaseNode,
};

// =============================================================================
// DATA TYPE COMPATIBILITY
// =============================================================================

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

function areTypesCompatible(sourceType: DataType, targetType: DataType): boolean {
    if (sourceType === DataType.ANY || targetType === DataType.ANY) return true;
    const compatibleTypes = DATA_TYPE_COMPATIBILITY[sourceType];
    return compatibleTypes?.includes(targetType) ?? false;
}

function findPin(pins: any[], pinId: string): { id: string; type: DataType } | undefined {
    return pins.find((pin) => pin.id === pinId);
}

// =============================================================================
// INNER COMPONENT
// =============================================================================

const WorkflowEditorInner: React.FC = () => {
    const navigate = useNavigate();
    const { workflowId } = useParams<{ workflowId: string }>();
    const { isEasyMode } = useEasyMode();

    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------

    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [workflowName, setWorkflowName] = useState<string>('');
    const [workflowDescription, setWorkflowDescription] = useState<string>('');
    const [lastSavedState, setLastSavedState] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [exitDialogOpen, setExitDialogOpen] = useState(false);

    // Easy Mode
    const [helpDialogOpen, setHelpDialogOpen] = useState(false);
    const [helpDialogNode, setHelpDialogNode] = useState<NodeTypeDefinition | null>(null);

    // Execution output
    const [showOutputPanel, setShowOutputPanel] = useState(false);
    const [executionLog, setExecutionLog] = useState<string[]>([]);

    // ---------------------------------------------------------------------------
    // DATABASE NODES
    // ---------------------------------------------------------------------------

    const { nodes: generatedNodes, loading: loadingGeneratedNodes } = useGeneratedNodes();

    const customNodeTypes: NodeTypes = useMemo(() => {
        const dynamicTypes: NodeTypes = { ...STATIC_NODE_TYPES };
        generatedNodes.forEach((generatedNode) => {
            dynamicTypes[generatedNode.type] = BaseNode;
        });
        return dynamicTypes;
    }, [generatedNodes]);

    // ---------------------------------------------------------------------------
    // COMPUTED
    // ---------------------------------------------------------------------------

    const hasUnsavedChanges = useMemo(() => {
        const currentState = JSON.stringify({ nodes, edges, viewport, workflowName, workflowDescription });
        return currentState !== lastSavedState;
    }, [nodes, edges, viewport, workflowName, workflowDescription, lastSavedState]);

    const canExecute = useMemo(() => {
        if (nodes.length === 0) return false;
        for (const node of nodes) {
            let nodeDefinition: NodeTypeDefinition | GeneratedNodeDefinition | undefined = getNodeType(node.type || '');
            if (!nodeDefinition) {
                nodeDefinition = generatedNodes.find((n) => n.type === node.type);
            }
            if (!nodeDefinition) continue;
            for (const input of nodeDefinition.inputs) {
                if (input.required) {
                    const hasConnection = edges.some(
                        (edge) => edge.target === node.id && edge.targetHandle === input.id
                    );
                    if (!hasConnection) return false;
                }
            }
        }
        return true;
    }, [nodes, edges, generatedNodes]);

    // ---------------------------------------------------------------------------
    // LOAD WORKFLOW
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (!workflowId) {
            setError('No workflow ID provided');
            setLoading(false);
            return;
        }

        const loadWorkflow = async () => {
            try {
                const data = await getWorkflow(workflowId);
                setWorkflow(data);
                setWorkflowName(data.name);
                setWorkflowDescription(data.description || '');

                if (data.canvas_data) {
                    setNodes(data.canvas_data.nodes || []);
                    setEdges(data.canvas_data.edges || []);
                    setViewport(data.canvas_data.viewport || { x: 0, y: 0, zoom: 1 });
                }

                const savedState = JSON.stringify({
                    nodes: data.canvas_data?.nodes || [],
                    edges: data.canvas_data?.edges || [],
                    viewport: data.canvas_data?.viewport || { x: 0, y: 0, zoom: 1 },
                    workflowName: data.name,
                    workflowDescription: data.description || '',
                });
                setLastSavedState(savedState);
            } catch (err) {
                console.error('Error loading workflow:', err);
                setError('Failed to load workflow');
            } finally {
                setLoading(false);
            }
        };

        loadWorkflow();
    }, [workflowId]);

    // ---------------------------------------------------------------------------
    // SAVE WORKFLOW
    // ---------------------------------------------------------------------------

    const saveWorkflow = useCallback(async () => {
        if (!workflowId || !workflow) return;

        setSaving(true);
        try {
            await updateWorkflow(workflowId, {
                name: workflowName,
                description: workflowDescription,
                canvas_data: { nodes, edges, viewport },
            });

            const savedState = JSON.stringify({ nodes, edges, viewport, workflowName, workflowDescription });
            setLastSavedState(savedState);

            setSnackbar({ open: true, message: 'Workflow saved successfully!', severity: 'success' });
        } catch (err) {
            console.error('Error saving workflow:', err);
            setSnackbar({ open: true, message: 'Failed to save workflow', severity: 'error' });
        } finally {
            setSaving(false);
        }
    }, [workflowId, workflow, workflowName, workflowDescription, nodes, edges, viewport]);

    // ---------------------------------------------------------------------------
    // EXECUTE WORKFLOW
    // ---------------------------------------------------------------------------

    const runWorkflow = useCallback(async () => {
        if (!canExecute) return;

        setExecuting(true);
        setExecutionLog([]);
        setShowOutputPanel(true);

        const log: string[] = [];
        const addLog = (message: string) => {
            log.push(message);
            setExecutionLog([...log]);
        };

        addLog('═══════════════════════════════════════════════════════════════');
        addLog('STARTING WORKFLOW EXECUTION (Dashboard Edit Mode)');
        addLog('═══════════════════════════════════════════════════════════════');
        addLog(`Sending ${nodes.length} nodes, ${edges.length} edges to backend...`);
        addLog('');

        try {
            const result = await executeWorkflowDirect(nodes, edges, workflowName);

            if (result.execution_log?.length > 0) {
                result.execution_log.forEach((line) => addLog(line));
            }

            addLog('');
            addLog('═══════════════════════════════════════════════════════════════');
            if (result.status === 'success') {
                addLog('EXECUTION COMPLETED SUCCESSFULLY');
            } else {
                addLog('EXECUTION FAILED');
                if (result.error) addLog(`Error: ${result.error}`);
            }
            addLog('═══════════════════════════════════════════════════════════════');
        } catch (error: any) {
            addLog('═══════════════════════════════════════════════════════════════');
            addLog('EXECUTION ERROR');
            addLog('═══════════════════════════════════════════════════════════════');
            addLog(error.message || 'Unknown error occurred');
        }

        setExecuting(false);
    }, [canExecute, nodes, edges, workflowName]);

    // ---------------------------------------------------------------------------
    // NODE OPERATIONS
    // ---------------------------------------------------------------------------

    const addNodeAtPosition = useCallback(
        (nodeType: string, position: { x: number; y: number }) => {
            let nodeDefinition = getNodeType(nodeType);

            if (!nodeDefinition) {
                const generatedNode = generatedNodes.find((n) => n.type === nodeType);
                if (generatedNode) {
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
                            usage: `Connect inputs -> Execute -> Use outputs`,
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
                return;
            }

            const id = `${nodeType}_${Date.now()}`;
            const snappedPosition = {
                x: Math.round(position.x / 15) * 15,
                y: Math.round(position.y / 15) * 15,
            };

            const newNode: Node = {
                id,
                type: nodeType,
                position: snappedPosition,
                data: {
                    label: nodeDefinition.name,
                    category: nodeDefinition.category,
                    icon: nodeDefinition.icon,
                    description: nodeDefinition.description,
                    inputs: nodeDefinition.inputs.map((input) => ({ id: input.id, label: input.label })),
                    outputs: nodeDefinition.outputs.map((output) => ({ id: output.id, label: output.label })),
                    configuration: nodeDefinition.configuration || [],
                    configValues: {},
                },
            };

            setNodes((nds) => [...nds, newNode]);

            if (isEasyMode && nodeDefinition) {
                setHelpDialogNode(nodeDefinition as NodeTypeDefinition);
                setHelpDialogOpen(true);
            }
        },
        [generatedNodes, isEasyMode]
    );

    // ---------------------------------------------------------------------------
    // REACT FLOW HANDLERS
    // ---------------------------------------------------------------------------

    const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const isValidConnection = useCallback((connection: Connection): boolean => {
        const { source, target, sourceHandle, targetHandle } = connection;
        if (!source || !target || !sourceHandle || !targetHandle) return false;

        const sourceNode = nodes.find((n) => n.id === source);
        const targetNode = nodes.find((n) => n.id === target);
        if (!sourceNode || !targetNode) return false;

        const sourceNodeDef = getNodeType(sourceNode.type || '') || generatedNodes.find((n) => n.type === sourceNode.type);
        const targetNodeDef = getNodeType(targetNode.type || '') || generatedNodes.find((n) => n.type === targetNode.type);
        if (!sourceNodeDef || !targetNodeDef) return false;

        const outputPin = findPin(sourceNodeDef.outputs, sourceHandle);
        const inputPin = findPin(targetNodeDef.inputs, targetHandle);
        if (!outputPin || !inputPin) return false;

        return areTypesCompatible(outputPin.type as DataType, inputPin.type as DataType);
    }, [nodes, generatedNodes]);

    const onConnect: OnConnect = useCallback((connection: Connection) => {
        if (isValidConnection(connection)) {
            setEdges((eds) => addEdge({
                ...connection,
                type: 'clipped',
                animated: true,
                style: { stroke: '#00c853', strokeWidth: 2 },
                data: { clips: [] },
            }, eds));
        }
    }, [isValidConnection]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const nodeType = event.dataTransfer.getData('application/reactflow');
        if (!nodeType) return;

        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        };

        addNodeAtPosition(nodeType, position);
    }, [addNodeAtPosition]);

    // ---------------------------------------------------------------------------
    // NAME EDITING
    // ---------------------------------------------------------------------------

    const startEditingName = () => {
        setEditedName(workflowName);
        setIsEditingName(true);
    };

    const saveEditedName = () => {
        if (editedName.trim()) {
            setWorkflowName(editedName.trim());
        }
        setIsEditingName(false);
    };

    // ---------------------------------------------------------------------------
    // NAVIGATION
    // ---------------------------------------------------------------------------

    const handleBack = () => {
        if (hasUnsavedChanges) {
            setExitDialogOpen(true);
        } else {
            navigate('/dashboard');
        }
    };

    const confirmExit = () => {
        setExitDialogOpen(false);
        navigate('/dashboard');
    };

    // ---------------------------------------------------------------------------
    // LOADING STATE
    // ---------------------------------------------------------------------------

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                bgcolor: colors.background.default,
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                bgcolor: colors.background.default,
                gap: 2,
            }}>
                <Typography color="error">{error}</Typography>
                <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#0a0e27' }}>
            {/* Header - Dashboard Edit Mode Banner */}
            <Box sx={{
                height: '64px',
                bgcolor: alpha(colors.primary.main, 0.15),
                borderBottom: `2px solid ${colors.primary.main}`,
                display: 'flex',
                alignItems: 'center',
                px: 2,
                gap: 2,
            }}>
                <Tooltip title="Back to Dashboard">
                    <IconButton onClick={handleBack} sx={{ color: colors.text.primary }}>
                        <BackIcon />
                    </IconButton>
                </Tooltip>

                <Chip
                    icon={<DashboardIcon />}
                    label="DASHBOARD EDIT MODE"
                    sx={{
                        bgcolor: colors.primary.main,
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiChip-icon': { color: 'white' },
                    }}
                />

                {/* Workflow Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    {isEditingName ? (
                        <>
                            <TextField
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditedName();
                                    if (e.key === 'Escape') setIsEditingName(false);
                                }}
                                autoFocus
                                size="small"
                                sx={{
                                    '& .MuiInputBase-input': { color: 'white', fontWeight: 'bold' },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: colors.primary.main },
                                    },
                                }}
                            />
                            <IconButton size="small" onClick={saveEditedName} sx={{ color: colors.status.success }}>
                                <CheckIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => setIsEditingName(false)} sx={{ color: colors.text.secondary }}>
                                <CloseIcon />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {workflowName}
                            </Typography>
                            {hasUnsavedChanges && (
                                <Chip size="small" label="Unsaved" sx={{ bgcolor: colors.status.warning, color: 'black' }} />
                            )}
                            <Tooltip title="Rename Workflow">
                                <IconButton size="small" onClick={startEditingName} sx={{ color: colors.primary.light }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                        onClick={saveWorkflow}
                        disabled={saving || !hasUnsavedChanges}
                        sx={{
                            borderColor: colors.primary.main,
                            color: colors.primary.light,
                            '&:hover': { borderColor: colors.primary.light, bgcolor: alpha(colors.primary.main, 0.1) },
                        }}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={executing ? <CircularProgress size={16} color="inherit" /> : <RunIcon />}
                        onClick={runWorkflow}
                        disabled={executing || !canExecute}
                        sx={{
                            bgcolor: colors.status.success,
                            '&:hover': { bgcolor: '#45a049' },
                        }}
                    >
                        {executing ? 'Running...' : 'Run'}
                    </Button>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Node Palette */}
                <NodePalette onNodeDragStart={() => {}} />

                {/* Canvas */}
                <Box sx={{ flex: 1, position: 'relative' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={customNodeTypes}
                        edgeTypes={customEdgeTypes}
                        defaultViewport={viewport}
                        onMoveEnd={(_, newViewport) => setViewport(newViewport)}
                        snapToGrid
                        snapGrid={[15, 15]}
                        fitView
                        isValidConnection={isValidConnection}
                        deleteKeyCode={['Backspace', 'Delete']}
                        style={{ backgroundColor: '#0a0e27' }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={20}
                            size={1}
                            color="rgba(255, 255, 255, 0.05)"
                        />
                        <Controls
                            style={{
                                backgroundColor: 'rgba(10, 14, 39, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                            }}
                        />
                        <MiniMap
                            style={{
                                backgroundColor: 'rgba(10, 14, 39, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                            nodeColor={(node) => {
                                switch (node.data?.category) {
                                    case 'configuration': return '#4a148c';
                                    case 'input': return '#1976d2';
                                    case 'query': return '#00897b';
                                    case 'output': return '#f57c00';
                                    default: return '#666';
                                }
                            }}
                        />
                    </ReactFlow>

                    {/* Status Bar */}
                    <Box sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'rgba(10, 14, 39, 0.9)',
                        border: `1px solid ${alpha(colors.primary.main, 0.3)}`,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        display: 'flex',
                        gap: 2,
                    }}>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            {nodes.length} nodes
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            {edges.length} connections
                        </Typography>
                        {loadingGeneratedNodes && (
                            <Typography variant="caption" sx={{ color: colors.status.info }}>
                                Loading database nodes...
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Output Panel */}
                {showOutputPanel && (
                    <Box sx={{
                        width: 400,
                        bgcolor: 'rgba(10, 14, 39, 0.95)',
                        borderLeft: `1px solid ${colors.divider}`,
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <Box sx={{
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>
                                Execution Output
                            </Typography>
                            <IconButton size="small" onClick={() => setShowOutputPanel(false)} sx={{ color: colors.text.secondary }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Box sx={{
                            flex: 1,
                            overflow: 'auto',
                            p: 2,
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            whiteSpace: 'pre-wrap',
                            color: colors.text.secondary,
                        }}>
                            {executionLog.map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Easy Mode Help Dialog */}
            <NodeHelpDialog
                open={helpDialogOpen}
                onClose={() => setHelpDialogOpen(false)}
                node={helpDialogNode}
            />

            {/* Exit Confirmation Dialog */}
            <Dialog open={exitDialogOpen} onClose={() => setExitDialogOpen(false)}>
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You have unsaved changes. Are you sure you want to leave without saving?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExitDialogOpen(false)}>Cancel</Button>
                    <Button onClick={saveWorkflow} disabled={saving} color="primary">
                        Save & Exit
                    </Button>
                    <Button onClick={confirmExit} color="error">
                        Discard Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// =============================================================================
// EXPORT WITH PROVIDER
// =============================================================================

const WorkflowEditor: React.FC = () => {
    return (
        <ReactFlowProvider>
            <WorkflowEditorInner />
        </ReactFlowProvider>
    );
};

export default WorkflowEditor;
