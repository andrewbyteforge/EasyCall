// src/components/layout/MainLayout.tsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import NavigationBar from './NavigationBar';
import WorkflowCanvas from '../canvas/WorkflowCanvas';
import OutputPanel from './OutputPanel';
import { useWorkflow } from '../../hooks/useWorkflow';

const MainLayout: React.FC = () => {
    const workflow = useWorkflow();
    const [outputOpen, setOutputOpen] = useState(false);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Top Navigation Bar */}
            <NavigationBar
                workflow={workflow}
                onToggleOutput={() => setOutputOpen(!outputOpen)}
            />

            {/* Main Canvas Area */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <WorkflowCanvas workflow={workflow} />
            </Box>

            {/* Bottom Output Panel (collapsible) */}
            {outputOpen && (
                <OutputPanel isOpen={outputOpen} onClose={() => setOutputOpen(false)} />
            )}
        </Box>
    );
};

export default MainLayout;