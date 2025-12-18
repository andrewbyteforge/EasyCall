// =============================================================================
// FILE: frontend/src/components/layout/MainLayout.tsx
// =============================================================================
// Main application layout with canvas and node palette.
// The WorkflowCanvas component contains its own integrated toolbar.
// =============================================================================

import React from 'react';
import { Box } from '@mui/material';
import WorkflowCanvas from '../canvas/WorkflowCanvas';
import NodePalette from '../canvas/NodePalette';

// =============================================================================
// COMPONENT
// =============================================================================

const MainLayout: React.FC = () => {
    // ---------------------------------------------------------------------------
    // NODE PALETTE HANDLERS
    // ---------------------------------------------------------------------------

    const handleNodeDragStart = (nodeType: any) => {
        console.log('[DRAG] Started dragging node:', nodeType.name);
    };

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                height: '100vh',
                backgroundColor: '#1e1e1e',
                overflow: 'hidden',
            }}
        >
            {/* Node Palette - LEFT SIDEBAR */}
            <NodePalette onNodeDragStart={handleNodeDragStart} />

            {/* Workflow Canvas - CENTER (includes integrated toolbar) */}
            <Box
                sx={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <WorkflowCanvas />
            </Box>
        </Box>
    );
};

export default MainLayout;