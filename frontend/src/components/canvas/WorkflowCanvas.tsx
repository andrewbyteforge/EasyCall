// =============================================================================
// FILE: frontend/src/components/canvas/WorkflowCanvas.tsx
// =============================================================================
// Main React Flow canvas component for visual workflow editing.
// Handles node/edge interactions, drag-and-drop, and canvas controls.
// =============================================================================

import React, { useCallback } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Connection,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    NodeTypes,
    ConnectionMode,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface WorkflowCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
}

// =============================================================================
// NODE TYPES (Placeholder - will be expanded in Phase 3)
// =============================================================================

const nodeTypes: NodeTypes = {
    // Custom node types will be registered here in Phase 3
    // For now, React Flow will use default nodes
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
}) => {
    // ---------------------------------------------------------------------------
    // STYLES
    // ---------------------------------------------------------------------------

    const canvasStyles = {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        '& .react-flow__node': {
            backgroundColor: '#2d2d30',
            border: '1px solid #3e3e42',
            borderRadius: '4px',
            padding: '10px',
            fontSize: '12px',
            color: '#cccccc',
        },
        '& .react-flow__node.selected': {
            border: '2px solid #00897b',
            boxShadow: '0 0 8px rgba(0, 137, 123, 0.4)',
        },
        '& .react-flow__edge': {
            stroke: '#3e3e42',
            strokeWidth: 2,
        },
        '& .react-flow__edge.selected': {
            stroke: '#00897b',
            strokeWidth: 3,
        },
        '& .react-flow__edge-path': {
            stroke: '#3e3e42',
            strokeWidth: 2,
        },
        '& .react-flow__handle': {
            width: '10px',
            height: '10px',
            backgroundColor: '#00897b',
            border: '2px solid #1a1a1a',
        },
        '& .react-flow__handle:hover': {
            backgroundColor: '#26a69a',
        },
        '& .react-flow__controls': {
            backgroundColor: '#252526',
            border: '1px solid #3e3e42',
            borderRadius: '4px',
            '& button': {
                backgroundColor: '#252526',
                borderBottom: '1px solid #3e3e42',
                color: '#cccccc',
                '&:hover': {
                    backgroundColor: '#2d2d30',
                },
            },
        },
        '& .react-flow__minimap': {
            backgroundColor: '#1e1e1e',
            border: '1px solid #3e3e42',
            borderRadius: '4px',
            '& .react-flow__minimap-mask': {
                fill: '#252526',
            },
            '& .react-flow__minimap-node': {
                fill: '#3e3e42',
                stroke: 'none',
            },
        },
        '& .react-flow__background': {
            backgroundColor: '#1a1a1a',
        },
        '& .react-flow__attribution': {
            display: 'none',
        },
    };

    // ---------------------------------------------------------------------------
    // EVENT HANDLERS
    // ---------------------------------------------------------------------------

    const handleConnect = useCallback(
        (connection: Connection) => {
            console.log('🔗 Connection created:', connection);
            onConnect(connection);
        },
        [onConnect]
    );

    const handleNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            console.log('🖱️ Node clicked:', node.id, node.type);
        },
        []
    );

    const handleEdgeClick = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            console.log('🖱️ Edge clicked:', edge.id);
        },
        []
    );

    const handlePaneClick = useCallback((event: React.MouseEvent) => {
        console.log('🖱️ Canvas clicked');
    }, []);

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Box sx={canvasStyles}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{
                    padding: 0.2,
                    includeHiddenNodes: false,
                }}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#3e3e42', strokeWidth: 2 },
                }}
                snapToGrid={true}
                snapGrid={[15, 15]}
                attributionPosition="bottom-right"
                minZoom={0.1}
                maxZoom={2}
                deleteKeyCode="Delete"
                multiSelectionKeyCode="Shift"
                selectionKeyCode="Shift"
                panOnScroll={false}
                zoomOnScroll={true}
                zoomOnPinch={true}
                panOnDrag={true}
                selectNodesOnDrag={false}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#2d2d30"
                />

                <Controls
                    showZoom={true}
                    showFitView={true}
                    showInteractive={true}
                    position="bottom-left"
                />

                <MiniMap
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'input':
                                return '#1976d2';
                            case 'query':
                                return '#00897b';
                            case 'output':
                                return '#f57c00';
                            case 'configuration':
                                return '#4a148c';
                            default:
                                return '#3e3e42';
                        }
                    }}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                    position="bottom-right"
                    style={{
                        width: 150,
                        height: 100,
                    }}
                />
            </ReactFlow>
        </Box>
    );
};

export default WorkflowCanvas;