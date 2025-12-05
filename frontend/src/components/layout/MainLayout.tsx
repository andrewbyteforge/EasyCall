// =============================================================================
// FILE: frontend/src/components/layout/MainLayout.tsx
// =============================================================================
// Main application layout with navigation, canvas, and output panel.
// =============================================================================

import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import {
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from 'reactflow';
import NavigationBar from './NavigationBar';
import WorkflowCanvas from '../canvas/WorkflowCanvas';
import { useWorkflow } from '../../hooks/useWorkflow';

// =============================================================================
// COMPONENT
// =============================================================================

const MainLayout: React.FC = () => {
    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------

    const [outputOpen, setOutputOpen] = useState(false);
    const workflow = useWorkflow();

    // ---------------------------------------------------------------------------
    // NAVIGATION HANDLERS
    // ---------------------------------------------------------------------------

    const handleSave = () => {
        console.log('💾 Save workflow');
        workflow.saveWorkflow();
    };

    const handleLoad = () => {
        console.log('📂 Load workflow');
        workflow.loadWorkflow();
    };

    const handleNew = () => {
        console.log('📄 New workflow');
        workflow.createNewWorkflow();
    };

    const handleRun = () => {
        console.log('▶️ Run workflow');
        setOutputOpen(true); // Open output panel when running
        workflow.executeWorkflow();
    };

    const handleSettings = () => {
        console.log('⚙️ Settings');
        // TODO: Open settings dialog in future phase
    };

    const handleToggleOutput = () => {
        setOutputOpen((prev) => !prev);
    };

    // ---------------------------------------------------------------------------
    // REACT FLOW HANDLERS
    // ---------------------------------------------------------------------------

    const handleNodesChange: OnNodesChange = useCallback(
        (changes) => {
            workflow.setNodes((nds) => applyNodeChanges(changes, nds));
        },
        [workflow]
    );

    const handleEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            workflow.setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        [workflow]
    );

    const handleConnect: OnConnect = useCallback(
        (connection) => {
            workflow.setEdges((eds) => addEdge(connection, eds));
        },
        [workflow]
    );

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                backgroundColor: '#1e1e1e',
                overflow: 'hidden',
            }}
        >
            {/* Navigation Bar */}
            <NavigationBar
                onSave={handleSave}
                onLoad={handleLoad}
                onNew={handleNew}
                onRun={handleRun}
                onSettings={handleSettings}
                onToggleOutput={handleToggleOutput}
                outputPanelVisible={outputOpen}
                workflowName={workflow.name || 'Untitled Workflow'}
                canRun={workflow.canExecute}
                hasUnsavedChanges={workflow.hasUnsavedChanges}
            />

            {/* Main Content Area */}
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                }}
            >
                {/* Node Palette (Left Sidebar) */}
                <Box
                    sx={{
                        width: 280,
                        backgroundColor: '#252526',
                        borderRight: '1px solid #3e3e42',
                        overflowY: 'auto',
                        padding: 2,
                    }}
                >
                    <Box sx={{ color: '#cccccc', fontSize: '14px', fontWeight: 'bold', mb: 2 }}>
                        📦 NODE PALETTE
                    </Box>
                    <Box sx={{ color: '#888888', fontSize: '12px' }}>
                        (Phase 3: Drag-and-drop nodes will appear here)
                    </Box>
                </Box>

                {/* Workflow Canvas (Center) */}
                <Box
                    sx={{
                        flex: 1,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <WorkflowCanvas
                        nodes={workflow.nodes}
                        edges={workflow.edges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={handleEdgesChange}
                        onConnect={handleConnect}
                    />
                </Box>
            </Box>

            {/* Output Panel (Bottom) */}
            {outputOpen && (
                <Box
                    sx={{
                        height: 250,
                        backgroundColor: '#1e1e1e',
                        borderTop: '1px solid #3e3e42',
                        overflowY: 'auto',
                        padding: 2,
                    }}
                >
                    <Box sx={{ color: '#cccccc', fontSize: '14px', fontWeight: 'bold', mb: 2 }}>
                        📊 EXECUTION OUTPUT
                    </Box>
                    <Box sx={{ color: '#888888', fontSize: '12px', fontFamily: 'monospace' }}>
                        [00:00:00] Execution logs will appear here...
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default MainLayout;