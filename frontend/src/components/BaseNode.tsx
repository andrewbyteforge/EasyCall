// =============================================================================
// FILE: frontend/src/components/nodes/BaseNode.tsx
// =============================================================================
// Base node component for rendering all node types in the workflow canvas.
// Uses Unreal Engine Blueprint-inspired visual design.
// =============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Tooltip } from '@mui/material';
import { NodeCategory, DataType, CATEGORY_COLORS } from '../types/node_types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input pin data structure.
 */
interface NodeInput {
    id: string;
    label: string;
    type: DataType;
    required: boolean;
    description: string;
}

/**
 * Output pin data structure.
 */
interface NodeOutput {
    id: string;
    label: string;
    type: DataType;
    description: string;
}

/**
 * Node data passed to the component.
 */
interface BaseNodeData {
    nodeType: string;
    category: NodeCategory;
    label: string;
    icon: string;
    color: string;
    width: number;
    height: number;
    description: string;
    inputs: NodeInput[];
    outputs: NodeOutput[];
    config: Record<string, any>;
}

// =============================================================================
// PIN COLORS BY DATA TYPE
// =============================================================================

/**
 * Colors for different data types (Unreal Engine Blueprint style).
 */
const PIN_COLORS: Record<DataType, string> = {
    [DataType.ADDRESS]: '#00d9ff',        // Cyan
    [DataType.ADDRESS_LIST]: '#00d9ff',   // Cyan
    [DataType.TRANSACTION]: '#ffd700',    // Gold
    [DataType.CREDENTIALS]: '#ff6b6b',    // Red
    [DataType.JSON_DATA]: '#98fb98',      // Pale green
    [DataType.STRING]: '#ff69b4',         // Hot pink
    [DataType.NUMBER]: '#32cd32',         // Lime green
    [DataType.BOOLEAN]: '#ff4500',        // Orange red
    [DataType.ANY]: '#c0c0c0',            // Silver
};

// =============================================================================
// COMPONENT: BaseNode
// =============================================================================

/**
 * Base node component that renders all node types.
 * Styled to match Unreal Engine Blueprint visual system.
 */
const BaseNode: React.FC<NodeProps<BaseNodeData>> = ({ data, selected }) => {
    const {
        label,
        icon,
        color,
        width,
        height,
        description,
        inputs = [],
        outputs = [],
        category,
    } = data;

    // -------------------------------------------------------------------------
    // Get category color with fallback
    // -------------------------------------------------------------------------
    const categoryColor = CATEGORY_COLORS[category] || color || '#666666';

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <Tooltip title={description} placement="top" arrow>
            <Box
                sx={{
                    width: width || 280,
                    minHeight: height || 150,
                    backgroundColor: '#252538',
                    borderRadius: '8px',
                    border: selected ? '2px solid #00d9ff' : '1px solid #3a3a5a',
                    boxShadow: selected
                        ? '0 0 20px rgba(0, 217, 255, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: '#00d9ff',
                        boxShadow: '0 0 15px rgba(0, 217, 255, 0.2)',
                    },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: categoryColor,
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Typography sx={{ fontSize: '18px' }}>{icon}</Typography>
                    <Typography
                        sx={{
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '14px',
                            letterSpacing: '0.5px',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                    >
                        {label}
                    </Typography>
                </Box>

                {/* Body */}
                <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                    {/* Input Pins */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {inputs.map((input, index) => (
                            <Box
                                key={input.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    position: 'relative',
                                }}
                            >
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={input.id}
                                    style={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: PIN_COLORS[input.type] || '#c0c0c0',
                                        border: '2px solid #1a1a2e',
                                        borderRadius: '50%',
                                        left: -6,
                                    }}
                                />
                                <Tooltip title={`${input.description}${input.required ? ' (Required)' : ''}`}>
                                    <Typography
                                        sx={{
                                            color: '#a0a0c0',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            ml: 1,
                                        }}
                                    >
                                        {input.label}
                                        {input.required && (
                                            <span style={{ color: '#ff6b6b', marginLeft: 2 }}>*</span>
                                        )}
                                    </Typography>
                                </Tooltip>
                            </Box>
                        ))}
                    </Box>

                    {/* Output Pins */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            alignItems: 'flex-end',
                        }}
                    >
                        {outputs.map((output, index) => (
                            <Box
                                key={output.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    position: 'relative',
                                }}
                            >
                                <Tooltip title={output.description}>
                                    <Typography
                                        sx={{
                                            color: '#a0a0c0',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            mr: 1,
                                        }}
                                    >
                                        {output.label}
                                    </Typography>
                                </Tooltip>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={output.id}
                                    style={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: PIN_COLORS[output.type] || '#c0c0c0',
                                        border: '2px solid #1a1a2e',
                                        borderRadius: '50%',
                                        right: -6,
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* No inputs/outputs message */}
                {inputs.length === 0 && outputs.length === 0 && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                            No connections
                        </Typography>
                    </Box>
                )}
            </Box>
        </Tooltip>
    );
};

// =============================================================================
// MEMOIZED EXPORT
// =============================================================================

export default memo(BaseNode);