// =============================================================================
// FILE: frontend/src/components/nodes/BaseNode.tsx
// =============================================================================
// Custom node component with properly aligned connection points.
// =============================================================================

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Tooltip } from '@mui/material';
import './BaseNode.css';

// Node category colors matching your project spec
const CATEGORY_COLORS = {
    configuration: '#4a148c', // Deep purple
    input: '#1976d2',        // Blue
    query: '#00897b',        // Teal
    output: '#f57c00',       // Orange
};

interface BaseNodeData {
    label: string;
    category: 'configuration' | 'input' | 'query' | 'output';
    icon?: string;
    description?: string;
    inputs?: Array<{ id: string; label: string }>;
    outputs?: Array<{ id: string; label: string }>;
}

interface BaseNodeProps extends NodeProps {
    data: BaseNodeData;
}

const BaseNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
    const categoryColor = CATEGORY_COLORS[data.category] || '#666666';

    return (
        <Tooltip title={data.description || ''} arrow placement="top">
            <Box
                className={`custom-node ${selected ? 'selected' : ''}`}
                sx={{
                    backgroundColor: '#2a2a2a',
                    border: `2px solid ${categoryColor}`,
                    borderRadius: '8px',
                    minWidth: '200px',
                    boxShadow: selected
                        ? `0 0 15px ${categoryColor}80`
                        : '0 2px 8px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: `0 0 20px ${categoryColor}60`,
                        transform: 'translateY(-2px)',
                    }
                }}
            >
                {/* Header with Icon and Label */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px 6px 0 0',
                    marginBottom: '12px',
                }}>
                    {data.icon && (
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{data.icon}</span>
                    )}
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '14px',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {data.label}
                    </Typography>
                </Box>

                {/* Content Area with Pins */}
                <Box sx={{ padding: '0 16px 12px 16px', position: 'relative' }}>
                    {/* Category Badge */}
                    <Box
                        sx={{
                            display: 'inline-block',
                            backgroundColor: categoryColor,
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '12px',
                        }}
                    >
                        {data.category}
                    </Box>

                    {/* Input Pins - Properly Aligned */}
                    {data.inputs && data.inputs.length > 0 && (
                        <Box sx={{ marginTop: '8px' }}>
                            {data.inputs.map((input, index) => (
                                <Box
                                    key={input.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '6px',
                                        position: 'relative',
                                        minHeight: '20px',
                                    }}
                                >
                                    <Handle
                                        type="target"
                                        position={Position.Left}
                                        id={input.id}
                                        style={{
                                            left: '-24px',
                                            position: 'absolute',
                                            backgroundColor: categoryColor,
                                            width: '12px',
                                            height: '12px',
                                            border: '2px solid #1a1a1a',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: '11px',
                                            color: '#999999',
                                            marginLeft: '8px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {input.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Output Pins - Properly Aligned */}
                    {data.outputs && data.outputs.length > 0 && (
                        <Box sx={{ marginTop: '8px' }}>
                            {data.outputs.map((output, index) => (
                                <Box
                                    key={output.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        marginBottom: '6px',
                                        position: 'relative',
                                        minHeight: '20px',
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: '11px',
                                            color: '#999999',
                                            marginRight: '8px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {output.label}
                                    </Typography>
                                    <Handle
                                        type="source"
                                        position={Position.Right}
                                        id={output.id}
                                        style={{
                                            right: '-24px',
                                            position: 'absolute',
                                            backgroundColor: categoryColor,
                                            width: '12px',
                                            height: '12px',
                                            border: '2px solid #1a1a1a',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                        }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>
        </Tooltip>
    );
};

export default BaseNode;