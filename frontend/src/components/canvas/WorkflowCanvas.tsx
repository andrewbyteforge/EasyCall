// src/components/canvas/WorkflowCanvas.tsx
import React, { useCallback, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Connection,
    addEdge,
    ReactFlowProvider,
    BackgroundVariant,
    Panel,
} from 'reactflow';
import { Box, Typography } from '@mui/material';

import { colors } from '../../theme';
import NodePalette from './NodePalette';
import 'reactflow/dist/style.css';

// =============================================================================
// TYPES
// =============================================================================

interface WorkflowCanvasProps {
    workflow: any; // From useWorkflow hook
}

// =============================================================================
// WORKFLOW CANVAS COMPONENT
// =============================================================================

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflow }) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // Use workflow state from hook
    const { nodes, edges, setNodes, setEdges, viewport, setViewport } = workflow;

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------

    const onNodesChange = useCallback(
        (changes: any) => {
            console.log('Nodes changed:', changes);
            // ReactFlow will call this when nodes are moved, deleted, etc.
            // The changes are already applied by ReactFlow's internal state management
        },
        []
    );

    const onEdgesChange = useCallback(
        (changes: any) => {
            console.log('Edges changed:', changes);
        },
        []
    );

    const onConnect = useCallback(
        (params: Connection) => {
            console.log('Connecting:', params);
            setEdges((eds: Edge[]) => addEdge(params, eds));
        },
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');
            const nodeDataStr = event.dataTransfer.getData('application/nodedata');

            if (!type || !nodeDataStr) {
                return;
            }

            const nodeData = JSON.parse(nodeDataStr);

            // Calculate position on canvas accounting for zoom and pan
            const position = {
                x: event.clientX - (reactFlowBounds?.left ?? 0) - (viewport?.x ?? 0),
                y: event.clientY - (reactFlowBounds?.top ?? 0) - (viewport?.y ?? 0),
            };

            // Create new node
            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type: 'default',
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
            setNodes((nds: Node[]) => [...nds, newNode]);
        },
        [setNodes, viewport]
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        console.log('Node clicked:', node);
        // TODO: Open node configuration dialog
    }, []);

    const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        console.log('Edge clicked:', edge);
    }, []);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------

    return (
        <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* Left Panel - Node Palette */}
            <Box
                sx={{
                    width: 280,
                    borderRight: `1px solid ${colors.divider}`,
                    overflow: 'hidden',
                }}
            >
                <NodePalette />
            </Box>

            {/* Right Panel - Canvas */}
            <Box
                ref={reactFlowWrapper}
                sx={{
                    flex: 1,
                    backgroundColor: colors.background.canvas,
                }}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    fitView
                    attributionPosition="bottom-left"
                    defaultViewport={viewport}
                    minZoom={0.1}
                    maxZoom={2}
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    deleteKeyCode="Delete"
                    nodesDraggable={true}  // ← ADD THIS LINE
                    elementsSelectable={true}  // ← ADD THIS LINE TOO
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={15}
                        size={1}
                        color={colors.divider}
                    />

                    <Controls
                        showInteractive={false}
                        style={{
                            backgroundColor: colors.background.paper,
                            border: `1px solid ${colors.divider}`,
                        }}
                    />

                    <MiniMap
                        nodeColor={(node) => node.data.color || colors.primary.main}
                        style={{
                            backgroundColor: colors.background.paper,
                            border: `1px solid ${colors.divider}`,
                        }}
                        maskColor={`${colors.background.canvas}cc`}
                    />

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
                                    Drag nodes from the left panel onto the canvas to start
                                    building your blockchain intelligence workflow.
                                </Typography>
                            </Box>
                        </Panel>
                    )}
                </ReactFlow>
            </Box>
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