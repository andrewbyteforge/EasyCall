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
import NodePalette from '../canvas/NodePalette';
import OutputPanel from './OutputPanel';
import { useWorkflow } from '../../hooks/useWorkflow';

// =============================================================================
// COMPONENT
// =============================================================================

const MainLayout: React.FC = () => {
    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------

    const [outputOpen, setOutputOpen] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const workflow = useWorkflow();

    // ---------------------------------------------------------------------------
    // LOG MANAGEMENT
    // ---------------------------------------------------------------------------

    const addLog = (level: 'info' | 'success' | 'warning' | 'error', message: string) => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        setLogs((prev) => [...prev, logEntry]);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    // ---------------------------------------------------------------------------
    // NAVIGATION HANDLERS
    // ---------------------------------------------------------------------------

    const handleSave = () => {
        console.log('💾 Save workflow');
        workflow.saveWorkflow();
        addLog('success', 'Workflow saved successfully');
    };

    const handleLoad = () => {
        console.log('📂 Load workflow');
        workflow.loadWorkflow();
        addLog('info', 'Loading workflow...');
    };

    const handleNew = () => {
        console.log('📄 New workflow');
        workflow.createNewWorkflow();
        addLog('info', 'Created new workflow');
    };

    const handleRun = () => {
        console.log('▶️ Run workflow');
        setOutputOpen(true); // Open output panel when running
        clearLogs(); // Clear previous logs
        addLog('info', 'Starting workflow execution...');
        addLog('info', `Executing ${workflow.nodes.length} nodes`);
        workflow.executeWorkflow();
        addLog('success', 'Workflow execution completed');
    };

    const handleSettings = () => {
        console.log('⚙️ Settings');
        addLog('info', 'Opening settings...');
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
            addLog('info', 'Connected nodes');
        },
        [workflow]
    );

    // ---------------------------------------------------------------------------
    // NODE PALETTE HANDLERS
    // ---------------------------------------------------------------------------

    const handleNodeDragStart = (nodeType: any) => {
        console.log('Started dragging node:', nodeType.name);
        // Could add visual feedback here in future
    };

    // ⭐ NEW: Handle node drop from palette
    const handleAddNode = useCallback(
        (nodeType: string, position: { x: number; y: number }) => {
            workflow.addNodeAtPosition(nodeType, position);
            addLog('info', `Added node: ${nodeType}`);
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
            {/* ================================================================= */}
            {/* NAVIGATION BAR */}
            {/* ================================================================= */}

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
                onTest={workflow.createExampleNodes}
            />

            {/* ================================================================= */}
            {/* MAIN CONTENT AREA */}
            {/* ================================================================= */}

            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                }}
            >
                {/* Node Palette - LEFT SIDEBAR */}
                <NodePalette onNodeDragStart={handleNodeDragStart} />

                {/* Workflow Canvas - CENTER */}
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
                        onAddNode={handleAddNode} // ⭐ ADDED: Drag-and-drop handler
                    />
                </Box>
            </Box>

            {/* ================================================================= */}
            {/* OUTPUT PANEL - BOTTOM (Conditional) */}
            {/* ================================================================= */}

            {outputOpen && (
                <OutputPanel
                    visible={outputOpen}
                    logs={logs}
                    onClear={clearLogs}
                />
            )}
        </Box>
    );
};

export default MainLayout;