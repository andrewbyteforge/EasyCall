// =============================================================================
// FILE: frontend/src/components/canvas/WorkflowCanvas.tsx
// =============================================================================
// React Flow canvas for visual workflow editing.
// Provides drag-and-drop node placement, connections, and canvas controls.
// =============================================================================

import React, { useCallback, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    BackgroundVariant,
    Panel,
} from 'reactflow';
import { Box, Typography } from '@mui/material';

import { colors } from '../../theme';
import 'reactflow/dist/style.css';

// =============================================================================
// TYPES
// =============================================================================

interface WorkflowCanvasProps {
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onNodesChange?: (nodes: Node[]) => void;
    onEdgesChange?: (edges: Edge[]) => void;
}

// =============================================================================
// WORKFLOW CANVAS COMPONENT
// =============================================================================

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
    initialNodes = [],
    initialEdges = [],
    onNodesChange,
    onEdgesChange,
}) => {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------

    /**
     * Handle new connection between nodes.
     */
    const onConnect = useCallback(
        (params: Connection) => {
            console.log('Connecting:', params);
            setEdges((eds) => addEdge(params, eds));
        },
        [setEdges]
    );

    /**
     * Handle drag over event (for drag-and-drop from palette).
     */
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    /**
     * Handle drop event (node dropped from palette).
     */
    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');
            const nodeData = JSON.parse(
                event.dataTransfer.getData('application/nodedata')
            );

            if (typeof type === 'undefined' || !type) {
                return;
            }

            // Calculate position on canvas
            const position = {
                x: event.clientX - (reactFlowBounds?.left ?? 0),
                y: event.clientY - (reactFlowBounds?.top ?? 0),
            };

            // Create new node
            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type: 'default', // TODO: Custom node types
                position,
                data: {
                    label: nodeData.name,
                    nodeType: type,
                    category: nodeData.category,
                    icon: nodeData.icon,
                    color: nodeData.color,
                },
            };

            console.log('Dropped node:', newNode);
            setNodes((nds) => nds.concat(newNode));
        },
        [setNodes]
    );

    /**
     * Handle node selection.
     */
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        console.log('Node clicked:', node);
        // TODO: Open node configuration dialog
    }, []);

    /**
     * Handle edge click.
     */
    const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        console.log('Edge clicked:', edge);
    }, []);

    // -------------------------------------------------------------------------
    // CALLBACKS FOR PARENT
    // -------------------------------------------------------------------------

    // Notify parent of node changes
    React.useEffect(() => {
        if (onNodesChange) {
            onNodesChange(nodes);
        }
    }, [nodes, onNodesChange]);

    // Notify parent of edge changes
    React.useEffect(() => {
        if (onEdgesChange) {
            onEdgesChange(edges);
        }
    }, [edges, onEdgesChange]);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------

    return (
        <Box
            ref={reactFlowWrapper}
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.background.canvas,
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                fitView
                attributionPosition="bottom-left"
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                minZoom={0.1}
                maxZoom={2}
                snapToGrid={true}
                snapGrid={[15, 15]}
            >
                {/* Grid Background */}
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={15}
                    size={1}
                    color={colors.divider}
                />

                {/* Canvas Controls (zoom, fit, etc.) */}
                <Controls
                    showInteractive={false}
                    style={{
                        backgroundColor: colors.background.paper,
                        border: `1px solid ${colors.divider}`,
                    }}
                />

                {/* Minimap */}
                <MiniMap
                    nodeColor={(node) => {
                        return node.data.color || colors.primary.main;
                    }}
                    style={{
                        backgroundColor: colors.background.paper,
                        border: `1px solid ${colors.divider}`,
                    }}
                    maskColor={`${colors.background.canvas}cc`}
                />

                {/* Info Panel */}
                <Panel position="top-left">
                    <Box
                        sx={{
                            backgroundColor: colors.background.paper,
                            border: `1px solid ${colors.divider}`,
                            borderRadius: 1,
                            p: 1.5,
                            minWidth: 200,
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            Nodes: {nodes.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Connections: {edges.length}
                        </Typography>
                    </Box>
                </Panel>

                {/* Empty State */}
                {nodes.length === 0 && (
                    <Panel position="top-center">
                        <Box
                            sx={{
                                backgroundColor: `${colors.background.paper}ee`,
                                border: `1px solid ${colors.divider}`,
                                borderRadius: 1,
                                p: 3,
                                textAlign: 'center',
                                maxWidth: 400,
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Welcome to Workflow Builder
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Drag nodes from the left panel onto the canvas to start building
                                your blockchain intelligence workflow.
                            </Typography>
                        </Box>
                    </Panel>
                )}
            </ReactFlow>
        </Box>
    );
};

// =============================================================================
// WRAPPER WITH PROVIDER
// =============================================================================

const WorkflowCanvasWrapper: React.FC<WorkflowCanvasProps> = (props) => {
    return (
        <ReactFlowProvider>
            <WorkflowCanvas {...props} />
        </ReactFlowProvider>
    );
};

export default WorkflowCanvasWrapper;