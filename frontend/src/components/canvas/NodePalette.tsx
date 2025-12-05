// =============================================================================
// FILE: frontend/src/components/canvas/NodePalette.tsx
// =============================================================================
// Node palette displaying all 21 available node types.
// Organized by category with drag-and-drop functionality.
// Split Query nodes by provider (Chainalysis vs TRM Labs)
// =============================================================================

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Chip,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';

import { colors } from '../../theme';
import {
    NodeTypeDefinition,
    NodeCategory,
    getAllNodeTypes,
    getNodesByCategory,
} from '../../types/node_types';

// =============================================================================
// TYPES
// =============================================================================

interface NodePaletteProps {
    onNodeSelect?: (nodeType: NodeTypeDefinition) => void;
}

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

const categoryDisplay = [
    { id: NodeCategory.CONFIGURATION, label: '🔑 Configuration', color: '#4a148c' },
    { id: NodeCategory.INPUT, label: '📍 Input', color: '#1976d2' },
    { id: 'query_chainalysis', label: '🔍 Query - Chainalysis', color: '#7b1fa2' },
    { id: 'query_trm', label: '🔍 Query - TRM Labs', color: '#00897b' },
    { id: NodeCategory.OUTPUT, label: '📤 Output', color: '#f57c00' },
];

// =============================================================================
// NODE PALETTE COMPONENT
// =============================================================================

const NodePalette: React.FC<NodePaletteProps> = ({ onNodeSelect }) => {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        [NodeCategory.CONFIGURATION]: false,
        [NodeCategory.INPUT]: false,
        'query_chainalysis': false,
        'query_trm': false,
        [NodeCategory.OUTPUT]: false,
    });

    // -------------------------------------------------------------------------
    // DATA
    // -------------------------------------------------------------------------

    const allNodes = getAllNodeTypes();

    // Filter nodes by search query
    const filteredNodes = searchQuery
        ? allNodes.filter((node) =>
            node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allNodes;

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const onDragStart = (
        event: React.DragEvent,
        nodeType: string
    ) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------

    return (
        <Box
            sx={{
                width: '280px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: colors.background.paper,
                borderRight: `1px solid ${colors.divider}`,
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${colors.divider}` }}>
                <Typography variant="h6" gutterBottom>
                    Node Library
                </Typography>

                {/* Search */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Node Count */}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                >
                    {allNodes.length} nodes available
                </Typography>
            </Box>

            {/* Node Categories */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
                {categoryDisplay.map((cat) => {
                    let categoryNodes: NodeTypeDefinition[];

                    // Handle the split query categories
                    // Handle the split query categories
                    if (cat.id === 'query_chainalysis') {
                        categoryNodes = filteredNodes.filter(
                            node => node.category === NodeCategory.QUERY &&
                                node.provider === 'chainalysis'
                        );
                    } else if (cat.id === 'query_trm') {
                        categoryNodes = filteredNodes.filter(
                            node => node.category === NodeCategory.QUERY &&
                                node.provider === 'trm'
                        );
                    } else {
                        categoryNodes = getNodesByCategory(cat.id as NodeCategory);
                        if (searchQuery) {
                            categoryNodes = categoryNodes.filter(node =>
                                node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                node.description.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                        }
                    }

                    if (categoryNodes.length === 0 && searchQuery) return null;

                    return (
                        <Box key={cat.id} sx={{ mb: 1 }}>
                            {/* Category Header */}
                            <Box
                                onClick={() => toggleCategory(cat.id)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: '#2d2d30',
                                    borderRadius: '4px',
                                    borderLeft: `4px solid ${cat.color}`,
                                    '&:hover': {
                                        backgroundColor: '#333',
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {cat.label}
                                    </Typography>
                                    <Chip
                                        label={categoryNodes.length}
                                        size="small"
                                        sx={{
                                            height: '18px',
                                            fontSize: '0.7rem',
                                            backgroundColor: cat.color,
                                        }}
                                    />
                                </Box>
                                <IconButton size="small">
                                    {expandedCategories[cat.id] ? (
                                        <ExpandLess fontSize="small" />
                                    ) : (
                                        <ExpandMore fontSize="small" />
                                    )}
                                </IconButton>
                            </Box>

                            {/* Category Content */}
                            <Collapse in={expandedCategories[cat.id]}>
                                <Box sx={{ mt: 1 }}>
                                    {categoryNodes.map((node) => (
                                        <Box
                                            key={node.type}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, node.type)}
                                            className="node-palette-item"
                                            sx={{
                                                padding: '10px 12px',
                                                marginBottom: '6px',
                                                backgroundColor: '#252526',
                                                borderRadius: '4px',
                                                borderLeft: `3px solid ${cat.color}`,
                                                cursor: 'grab',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    backgroundColor: '#2d2d30',
                                                    transform: 'translateX(4px)',
                                                    borderLeftColor: cat.color,
                                                },
                                                '&:active': {
                                                    cursor: 'grabbing',
                                                },
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    marginBottom: '4px',
                                                    color: '#fff',
                                                }}
                                            >
                                                {node.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#999',
                                                    display: 'block',
                                                    fontSize: '0.7rem',
                                                }}
                                            >
                                                {node.description}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
            </Box>

            {/* Footer Info */}
            <Box
                sx={{
                    p: 1.5,
                    borderTop: `1px solid ${colors.divider}`,
                    backgroundColor: colors.background.elevated,
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    💡 Drag nodes onto the canvas to build your workflow
                </Typography>
            </Box>
        </Box>
    );
};

export default NodePalette;