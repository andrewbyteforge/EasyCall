// =============================================================================
// FILE: frontend/src/components/canvas/WorkflowCanvas.tsx
// =============================================================================
// React Flow canvas with UE5-style grid and custom nodes.
// =============================================================================

import React, { useRef, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    ReactFlowProvider,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Node,
    Edge,
    ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import UE5Node from '../nodes/UE5Node';

// =============================================================================
// TYPES
// =============================================================================

interface WorkflowCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onAddNode: (nodeType: string, position: { x: number; y: number }) => void;
}

// ⭐ REGISTER CUSTOM NODE TYPES
const nodeTypes = {
    default: UE5Node,
};

// =============================================================================
// COMPONENT
// =============================================================================

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onAddNode,
}) => {
    // ---------------------------------------------------------------------------
    // REFS & STATE
    // ---------------------------------------------------------------------------

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    // ---------------------------------------------------------------------------
    // DROP HANDLER
    // ---------------------------------------------------------------------------

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const nodeType = event.dataTransfer.getData('application/reactflow');

            if (!nodeType || !reactFlowWrapper.current || !reactFlowInstance) {
                return;
            }

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            onAddNode(nodeType, position);
        },
        [reactFlowInstance, onAddNode]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Box
            ref={reactFlowWrapper}
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1e1e1e',
                // ⭐ REMOVE WHITE BACKGROUNDS
                '& .react-flow__node': {
                    backgroundColor: 'transparent !important',
                },
                '& .react-flow__node-default': {
                    backgroundColor: 'transparent !important',
                    border: 'none !important',
                    padding: '0 !important',
                },
                // ⭐ STYLE CONTROLS (moved to sx instead of style prop)
                '& .react-flow__controls': {
                    '& button': {
                        backgroundColor: '#2d2d30',
                        color: '#cccccc',
                        borderColor: '#3e3e42',
                        '&:hover': {
                            backgroundColor: '#3e3e42',
                        },
                    },
                },
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    nodeTypes={nodeTypes}
                    fitView
                    snapToGrid
                    snapGrid={[10, 10]}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: false,
                        style: { stroke: '#3b82f6', strokeWidth: 2 },
                    }}
                >
                    {/* UE5-STYLE GRID (Two layers) */}
                    <Background
                        variant={BackgroundVariant.Lines}
                        gap={10}
                        size={0.5}
                        color="#252525"
                    />
                    <Background
                        variant={BackgroundVariant.Lines}
                        gap={100}
                        size={1}
                        color="#2a2a2a"
                    />

                    {/* Controls - ⭐ REMOVED INVALID STYLE PROP */}
                    <Controls />

                    {/* MiniMap */}
                    <MiniMap
                        nodeColor={(node) => {
                            const category = node.data?.category;
                            const colors: Record<string, string> = {
                                configuration: '#4a148c',
                                input: '#1976d2',
                                query: '#00897b',
                                output: '#f57c00',
                            };
                            return colors[category] || '#64748b';
                        }}
                        maskColor="#1e1e1e80"
                        style={{
                            backgroundColor: '#2d2d30',
                            border: '1px solid #3e3e42',
                        }}
                    />
                </ReactFlow>
            </ReactFlowProvider>
        </Box>
    );
};

export default WorkflowCanvas;