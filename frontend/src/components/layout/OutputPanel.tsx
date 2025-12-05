// =============================================================================
// FILE: src/components/layout/OutputPanel.tsx
// =============================================================================
// Collapsible bottom panel for execution logs and output
// =============================================================================

import React from 'react';
import { Paper, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface OutputPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <Paper
            sx={{
                height: '200px',
                borderTop: '1px solid #333',
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderBottom: '1px solid #333',
                    backgroundColor: '#252526',
                }}
            >
                <Typography variant="subtitle2">Output Terminal</Typography>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    padding: 2,
                    overflowY: 'auto',
                    backgroundColor: '#1a1a1a',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#ccc',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    No output yet. Run a workflow to see results here.
                </Typography>
            </Box>
        </Paper>
    );
};

export default OutputPanel;