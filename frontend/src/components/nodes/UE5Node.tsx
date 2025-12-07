// =============================================================================
// FILE: frontend/src/components/nodes/UE5Node.tsx
// =============================================================================
// Custom node component styled exactly like Unreal Engine 5 Blueprint nodes.
// =============================================================================

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// =============================================================================
// TYPES
// =============================================================================

interface PinDefinition {
    id: string;
    label: string;
    type: string;
    color: string;
}

interface UE5NodeData {
    label: string;
    category: 'configuration' | 'input' | 'query' | 'output';
    icon: string;
    nodeType?: string;
    inputs?: PinDefinition[];
    outputs?: PinDefinition[];
    properties?: Array<{ key: string; value: string }>;
    onDelete?: () => void;
}

// =============================================================================
// CATEGORY COLORS
// =============================================================================

const CATEGORY_COLORS = {
    configuration: '#4a148c', // Deep purple
    input: '#1976d2',         // Blue
    query: '#00897b',         // Teal
    output: '#f57c00',        // Orange
};

// =============================================================================
// PIN COLORS (matching UE5 style)
// =============================================================================

const PIN_COLORS: Record<string, string> = {
    address: '#22c55e',     // Green
    data: '#3b82f6',        // Blue
    credentials: '#a855f7', // Purple
    output: '#f97316',      // Orange
    string: '#22d3ee',      // Cyan
    number: '#eab308',      // Yellow
    boolean: '#ef4444',     // Red
    array: '#8b5cf6',       // Violet
    exec: '#ffffff',        // White (execution pins)
};

// =============================================================================
// PIN COMPONENT (UE5 Style)
// =============================================================================

const Pin: React.FC<{
    pin: PinDefinition;
    isInput: boolean;
    nodeId: string;
}> = ({ pin, isInput, nodeId }) => {
    const pinColor = PIN_COLORS[pin.type] || '#ffffff';

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isInput ? 'flex-start' : 'flex-end',
                minHeight: 24,
                position: 'relative',
                pr: isInput ? 0 : 1,
                pl: isInput ? 1 : 0,
            }}
        >
            {/* Input Pin Label (on left) */}
            {isInput && (
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: '0.75rem',
                        color: '#cccccc',
                        fontWeight: 400,
                        userSelect: 'none',
                        ml: 0.5,
                    }}
                >
                    {pin.label}
                </Typography>
            )}

            {/* Output Pin Label (on right) */}
            {!isInput && (
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: '0.75rem',
                        color: '#cccccc',
                        fontWeight: 400,
                        userSelect: 'none',
                        mr: 0.5,
                    }}
                >
                    {pin.label}
                </Typography>
            )}

            {/* Handle (connection point) - UE5 style circle */}
            <Handle
                type={isInput ? 'target' : 'source'}
                position={isInput ? Position.Left : Position.Right}
                id={pin.id}
                style={{
                    width: 14,
                    height: 14,
                    border: `2px solid ${pinColor}`,
                    background: '#1e1e1e',
                    left: isInput ? -7 : undefined,
                    right: isInput ? undefined : -7,
                    top: '50%',
                    transform: 'translateY(-50%)',
                }}
            />
        </Box>
    );
};

// =============================================================================
// MAIN NODE COMPONENT
// =============================================================================

const UE5Node: React.FC<NodeProps<UE5NodeData>> = ({ data, selected, id }) => {
    const categoryColor = CATEGORY_COLORS[data.category] || '#64748b';
    const inputs = data.inputs || [];
    const outputs = data.outputs || [];

    // State for hover (to show delete button)
    const [isHovered, setIsHovered] = useState(false);

    // Combine all pins for vertical layout (UE5 style)
    const allPins = [
        ...inputs.map(pin => ({ pin, isInput: true })),
        ...outputs.map(pin => ({ pin, isInput: false })),
    ];

    return (
        <Box
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                minWidth: 240,
                maxWidth: 320,
                backgroundColor: '#2d2d30',
                border: `2px solid ${selected ? categoryColor : '#3e3e42'}`,
                borderRadius: '8px',
                boxShadow: selected
                    ? `0 0 0 2px ${categoryColor}40, 0 8px 24px rgba(0,0,0,0.5)`
                    : '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                    borderColor: categoryColor,
                    boxShadow: `0 0 0 2px ${categoryColor}20, 0 8px 24px rgba(0,0,0,0.5)`,
                },
            }}
        >
            {/* ============================================================= */}
            {/* DELETE BUTTON (appears on hover) */}
            {/* ============================================================= */}

            {isHovered && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onDelete?.();
                    }}
                    sx={{
                        position: 'absolute',
                        top: -12,
                        right: -12,
                        width: 24,
                        height: 24,
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        zIndex: 1000,
                        '&:hover': {
                            backgroundColor: '#b91c1c',
                            transform: 'scale(1.1)',
                        },
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}
                >
                    <CloseIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
            )}

            {/* ============================================================= */}
            {/* HEADER */}
            {/* ============================================================= */}

            <Box
                sx={{
                    backgroundColor: categoryColor,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderTopLeftRadius: '6px',
                    borderTopRightRadius: '6px',
                }}
            >
                {/* Icon */}
                <Box sx={{ fontSize: '1rem', lineHeight: 1 }}>{data.icon}</Box>

                {/* Label */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        flex: 1,
                        userSelect: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {data.label}
                </Typography>
            </Box>

            {/* ============================================================= */}
            {/* BODY (Pins listed vertically like UE5) */}
            {/* ============================================================= */}

            <Box sx={{ padding: '8px 0' }}>
                {allPins.length > 0 ? (
                    allPins.map(({ pin, isInput }, idx) => (
                        <Pin
                            key={`${isInput ? 'in' : 'out'}-${pin.id}`}
                            pin={pin}
                            isInput={isInput}
                            nodeId={id}
                        />
                    ))
                ) : (
                    // If no pins, show minimal padding
                    <Box sx={{ py: 1 }} />
                )}

                {/* PROPERTIES (if any) */}
                {data.properties && data.properties.length > 0 && (
                    <Box
                        sx={{
                            mt: 1,
                            pt: 1,
                            px: 1.5,
                            borderTop: '1px solid #3e3e42',
                        }}
                    >
                        {data.properties.map((prop, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mb: 0.5,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.7rem',
                                        color: '#858585',
                                        fontWeight: 500,
                                    }}
                                >
                                    {prop.key}:
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.7rem',
                                        color: '#cccccc',
                                        fontWeight: 600,
                                    }}
                                >
                                    {prop.value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default memo(UE5Node);