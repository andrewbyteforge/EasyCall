// =============================================================================
// FILE: frontend/src/components/layout/OutputPanel.tsx
// =============================================================================
// Output panel for displaying execution logs and results.
// Shows real-time execution status and detailed logs.
// =============================================================================

import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import {
    Clear as ClearIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface OutputPanelProps {
    /** Whether the panel is visible */
    visible: boolean;
    /** Execution logs to display */
    logs?: string[];
    /** Callback to clear logs */
    onClear?: () => void;
    onClose: () => void;
}

// =============================================================================
// LOG ENTRY INTERFACE
// =============================================================================

interface LogEntry {
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const OutputPanel: React.FC<OutputPanelProps> = ({
    visible,
    logs = [],
    onClear,
}) => {
    // ---------------------------------------------------------------------------
    // HANDLERS
    // ---------------------------------------------------------------------------

    const handleCopyLogs = () => {
        const logText = logs.join('\n');
        navigator.clipboard.writeText(logText);
        console.log('📋 Logs copied to clipboard');
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
            console.log('🗑️ Logs cleared');
        }
    };

    // ---------------------------------------------------------------------------
    // HELPER FUNCTIONS
    // ---------------------------------------------------------------------------

    const parseLogEntry = (log: string): LogEntry => {
        // Parse log format: [HH:MM:SS] LEVEL: Message
        const match = log.match(/\[(\d{2}:\d{2}:\d{2})\]\s+(\w+):\s+(.+)/);
        if (match) {
            return {
                timestamp: match[1],
                level: match[2].toLowerCase() as LogEntry['level'],
                message: match[3],
            };
        }
        // Fallback for unparsed logs
        return {
            timestamp: new Date().toLocaleTimeString(),
            level: 'info',
            message: log,
        };
    };

    const getLogColor = (level: LogEntry['level']): string => {
        switch (level) {
            case 'success':
                return '#4caf50'; // Green
            case 'warning':
                return '#ff9800'; // Orange
            case 'error':
                return '#f44336'; // Red
            case 'info':
            default:
                return '#2196f3'; // Blue
        }
    };

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    if (!visible) {
        return null;
    }

    return (
        <Box
            sx={{
                height: 250,
                backgroundColor: '#1e1e1e',
                borderTop: '1px solid #3e3e42',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    backgroundColor: '#252526',
                    borderBottom: '1px solid #3e3e42',
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: '#cccccc',
                        fontWeight: 'bold',
                        fontSize: '13px',
                    }}
                >
                    📊 EXECUTION OUTPUT
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Copy logs">
                        <IconButton
                            size="small"
                            onClick={handleCopyLogs}
                            disabled={logs.length === 0}
                            sx={{ color: '#888888', '&:hover': { color: '#cccccc' } }}
                        >
                            <CopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Clear logs">
                        <IconButton
                            size="small"
                            onClick={handleClear}
                            disabled={logs.length === 0}
                            sx={{ color: '#888888', '&:hover': { color: '#f44336' } }}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Logs Content */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 2,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#1e1e1e',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#3e3e42',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: '#4e4e52',
                        },
                    },
                }}
            >
                {logs.length === 0 ? (
                    <Box sx={{ color: '#888888', fontStyle: 'italic' }}>
                        No execution logs yet. Click "Run" to execute the workflow.
                    </Box>
                ) : (
                    logs.map((log, index) => {
                        const entry = parseLogEntry(log);
                        return (
                            <Box
                                key={index}
                                sx={{
                                    marginBottom: '4px',
                                    display: 'flex',
                                    gap: 1,
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        color: '#888888',
                                        minWidth: '70px',
                                    }}
                                >
                                    [{entry.timestamp}]
                                </Box>
                                <Box
                                    component="span"
                                    sx={{
                                        color: getLogColor(entry.level),
                                        fontWeight: 'bold',
                                        minWidth: '80px',
                                    }}
                                >
                                    {entry.level.toUpperCase()}:
                                </Box>
                                <Box
                                    component="span"
                                    sx={{
                                        color: '#cccccc',
                                        flex: 1,
                                    }}
                                >
                                    {entry.message}
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        </Box>
    );
};

export default OutputPanel;