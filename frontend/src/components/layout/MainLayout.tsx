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

    const handleSave = async () => {
        console.log('[SAVE] Saving workflow...');
        try {
            await workflow.saveWorkflow();
            addLog('success', `Workflow "${workflow.workflowName}" saved successfully`);
        } catch (error) {
            addLog('error', 'Failed to save workflow');
            console.error('[SAVE] Error:', error);
        }
    };

    const handleLoad = async () => {
        console.log('[LOAD] Opening load dialog...');
        addLog('info', 'Loading workflow...');

        // TODO: In future phase, show workflow selection dialog
        // For now, just show message
        addLog('warning', 'Load dialog not yet implemented');
    };

    const handleNew = () => {
        console.log('[NEW] Creating new workflow');

        if (workflow.hasUnsavedChanges) {
            // TODO: Show confirmation dialog in future phase
            addLog('warning', 'You have unsaved changes!');
        }

        workflow.createNewWorkflow();
        clearLogs();
        addLog('info', 'Created new workflow');
    };

    const handleRun = () => {
        console.log('[RUN] Executing workflow...');
        setOutputOpen(true); // Open output panel when running
        clearLogs(); // Clear previous logs

        addLog('info', 'Starting workflow execution...');
        addLog('info', `Workflow: "${workflow.workflowName}"`);
        addLog('info', `Nodes: ${workflow.nodes.length} | Edges: ${workflow.edges.length}`);

        try {
            workflow.executeWorkflow();
            addLog('success', 'Workflow execution completed');
        } catch (error) {
            addLog('error', 'Workflow execution failed');
            console.error('[RUN] Error:', error);
        }
    };

    const handleSettings = () => {
        console.log('[SETTINGS] Opening settings...');
        addLog('info', 'Opening settings...');
        // TODO: Open settings dialog in future phase
        addLog('warning', 'Settings dialog not yet implemented');
    };

    const handleToggleOutput = () => {
        setOutputOpen((prev) => !prev);
        console.log('[OUTPUT] Panel toggled:', !outputOpen ? 'OPEN' : 'CLOSED');
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
            addLog('info', `Connected: ${connection.source} -> ${connection.target}`);
        },
        [workflow]
    );

    // ---------------------------------------------------------------------------
    // NODE PALETTE HANDLERS
    // ---------------------------------------------------------------------------

    const handleNodeDragStart = (nodeType: any) => {
        console.log('[DRAG] Started dragging node:', nodeType.name);
        // Could add visual feedback here in future
    };

    const handleAddNode = useCallback(
        (nodeType: string, position: { x: number; y: number }) => {
            workflow.addNodeAtPosition(nodeType, position);
            addLog('info', `Added node: ${nodeType}`);
        },
        [workflow]
    );

    // ---------------------------------------------------------------------------
    // TEST HANDLER
    // ---------------------------------------------------------------------------

    const handleTest = () => {
        console.log('[TEST] Creating example nodes...');
        workflow.createExampleNodes();
        addLog('info', 'Created 3 example nodes with connections');
    };

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
                workflowName={workflow.workflowName}
                canRun={workflow.canExecute}
                hasUnsavedChanges={workflow.hasUnsavedChanges}
                onTest={handleTest}
                isSaving={workflow.isSaving}
                isLoading={workflow.isLoading}
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
                    onClose={() => setOutputOpen(false)}
                />
            )}
        </Box>
    );
};

export default MainLayout;