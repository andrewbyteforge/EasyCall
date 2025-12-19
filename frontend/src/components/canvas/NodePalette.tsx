// =============================================================================
// FILE: frontend/src/components/canvas/NodePalette.tsx
// =============================================================================
// Draggable node palette for the workflow canvas.
// Displays all 21 available node types organized by platform.
// =============================================================================

import React, { useState, useMemo } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip,
    Chip,
    IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import {
    NodeTypeDefinition,
    getAllNodeTypes,
    NodeCategory,
} from '../../types/node_types';

// =============================================================================
// TYPES
// =============================================================================

interface NodePaletteProps {
    onNodeDragStart?: (nodeType: NodeTypeDefinition) => void;
}

interface CategoryConfig {
    key: string;
    icon: string;
    label: string;
    defaultExpanded: boolean;
    color: string;
    filter: (node: NodeTypeDefinition) => boolean;
}

// =============================================================================
// CATEGORY CONFIGURATION (Platform-based organization)
// =============================================================================

const CATEGORIES: CategoryConfig[] = [
    {
        key: 'configuration',
        icon: '🔑',
        label: 'Configuration',
        defaultExpanded: false,
        color: '#4a148c',
        filter: (node) => node.category === NodeCategory.CONFIGURATION,
    },
    {
        key: 'input',
        icon: '📍',
        label: 'Input',
        defaultExpanded: true,
        color: '#1976d2',
        filter: (node) => node.category === NodeCategory.INPUT,
    },
    {
        key: 'chainalysis',
        icon: '🔗',
        label: 'Chainalysis',
        defaultExpanded: true,
        color: '#00897b',
        filter: (node) => node.provider === 'chainalysis',
    },
    {
        key: 'trm',
        icon: '🛡️',
        label: 'TRM Labs',
        defaultExpanded: true,
        color: '#00897b',
        filter: (node) => node.provider === 'trm',
    },
    {
        key: 'output',
        icon: '📤',
        label: 'Output',
        defaultExpanded: false,
        color: '#f57c00',
        filter: (node) => node.category === NodeCategory.OUTPUT,
    },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Individual draggable node item.
 */
const NodePaletteItem: React.FC<{
    node: NodeTypeDefinition;
    categoryColor: string;
    onDragStart?: (node: NodeTypeDefinition) => void;
}> = ({ node, categoryColor, onDragStart }) => {
    // Build tooltip content
    const tooltipContent = (
        <Box sx={{ p: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {node.name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem' }}>
                {node.longDescription || node.description}
            </Typography>

            {/* Input Pins */}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 1 }}>
                Inputs:
            </Typography>
            {node.inputs.length > 0 ? (
                <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                    {node.inputs.map((input) => (
                        <li key={input.id}>
                            <Typography variant="caption">
                                {input.label} ({input.type})
                                {input.required && ' *'}
                            </Typography>
                        </li>
                    ))}
                </Box>
            ) : (
                <Typography variant="caption" sx={{ color: '#888', ml: 1 }}>
                    None
                </Typography>
            )}

            {/* Output Pins */}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 1 }}>
                Outputs:
            </Typography>
            {node.outputs.length > 0 ? (
                <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                    {node.outputs.map((output) => (
                        <li key={output.id}>
                            <Typography variant="caption">
                                {output.label} ({output.type})
                            </Typography>
                        </li>
                    ))}
                </Box>
            ) : (
                <Typography variant="caption" sx={{ color: '#888', ml: 1 }}>
                    None
                </Typography>
            )}

            {/* Provider Info */}
            {node.provider && (
                <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 1, fontStyle: 'italic', color: '#aaa' }}
                >
                    Provider: {node.provider === 'chainalysis' ? 'Chainalysis' : 'TRM Labs'}
                </Typography>
            )}
        </Box>
    );

    // Drag start handler
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/reactflow', node.type);

        // Also store full node definition as JSON for convenience
        e.dataTransfer.setData('application/json', JSON.stringify(node));

        onDragStart?.(node);

        console.log('🎯 Drag started:', node.type);
    };

    return (
        <Tooltip
            title={tooltipContent}
            placement="right"
            enterDelay={300}
            componentsProps={{
                tooltip: {
                    sx: {
                        bgcolor: '#2d2d30',
                        color: '#cccccc',
                        border: '1px solid #3e3e42',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        maxWidth: 350,
                        fontSize: '0.8rem',
                    },
                },
            }}
        >
            <Box
                draggable
                onDragStart={handleDragStart}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: '8px 12px',
                    marginBottom: '6px',
                    backgroundColor: '#2d2d30',
                    border: '1px solid #3e3e42',
                    borderRadius: '6px',
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: '#37373d',
                        borderColor: categoryColor,
                        transform: 'translateX(4px)',
                        boxShadow: `0 2px 8px ${categoryColor}40`,
                    },
                    '&:active': {
                        cursor: 'grabbing',
                    },
                }}
            >
                {/* Node Icon */}
                <Box sx={{ fontSize: '1.2rem', flexShrink: 0 }}>{node.icon}</Box>

                {/* Node Name */}
                <Typography
                    variant="body2"
                    sx={{
                        flex: 1,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#cccccc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {node.name}
                </Typography>

                {/* Provider Badge (only show for query nodes in Configuration category) */}
                {node.category === NodeCategory.CONFIGURATION && node.provider && (
                    <Chip
                        label={node.provider === 'chainalysis' ? 'C' : 'T'}
                        size="small"
                        sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            backgroundColor:
                                node.provider === 'chainalysis' ? '#4a148c' : '#00897b',
                            color: '#ffffff',
                        }}
                    />
                )}
            </Box>
        </Tooltip>
    );
};

/**
 * Category section with accordion.
 */
const CategorySection: React.FC<{
    category: CategoryConfig;
    nodes: NodeTypeDefinition[];
    onNodeDragStart?: (node: NodeTypeDefinition) => void;
}> = ({ category, nodes, onNodeDragStart }) => {
    if (nodes.length === 0) return null;

    return (
        <Accordion
            defaultExpanded={category.defaultExpanded}
            disableGutters
            sx={{
                backgroundColor: '#252526',
                color: '#cccccc',
                boxShadow: 'none',
                border: 'none',
                '&:before': { display: 'none' },
                mb: 1,
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#cccccc' }} />}
                sx={{
                    minHeight: 'auto',
                    padding: '12px 8px',
                    backgroundColor: '#2d2d30',
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: '#37373d',
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box sx={{ fontSize: '1.1rem' }}>{category.icon}</Box>
                    <Typography
                        variant="body2"
                        sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        {category.label}
                    </Typography>
                    <Chip
                        label={nodes.length}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: category.color,
                            color: '#ffffff',
                        }}
                    />
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '8px 4px' }}>
                {nodes.map((node) => (
                    <NodePaletteItem
                        key={node.type}
                        node={node}
                        categoryColor={category.color}
                        onDragStart={onNodeDragStart}
                    />
                ))}
            </AccordionDetails>
        </Accordion>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const NodePalette: React.FC<NodePaletteProps> = ({ onNodeDragStart }) => {
    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------

    const [searchQuery, setSearchQuery] = useState<string>('');

    // ---------------------------------------------------------------------------
    // GET ALL NODES
    // ---------------------------------------------------------------------------

    const allNodes = useMemo(() => getAllNodeTypes(), []);

    // ---------------------------------------------------------------------------
    // FILTER NODES BY SEARCH
    // ---------------------------------------------------------------------------

    const filteredNodes = useMemo(() => {
        if (!searchQuery.trim()) return allNodes;

        const query = searchQuery.toLowerCase();
        return allNodes.filter(
            (node) =>
                node.name.toLowerCase().includes(query) ||
                node.description.toLowerCase().includes(query) ||
                node.type.toLowerCase().includes(query) ||
                node.provider?.toLowerCase().includes(query)
        );
    }, [allNodes, searchQuery]);

    // ---------------------------------------------------------------------------
    // ORGANIZE NODES BY CATEGORY
    // ---------------------------------------------------------------------------

    const categorizedNodes = useMemo(() => {
        return CATEGORIES.map((category) => ({
            ...category,
            nodes: filteredNodes.filter(category.filter),
        }));
    }, [filteredNodes]);

    // ---------------------------------------------------------------------------
    // TOTAL COUNT
    // ---------------------------------------------------------------------------

    const totalCount = filteredNodes.length;

    // ---------------------------------------------------------------------------
    // HOME NAVIGATION
    // ---------------------------------------------------------------------------

    const handleHomeClick = (): void => {
        // Navigate to Django backend landing page
        window.location.href = 'http://localhost:8000/';
    };

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Box
            sx={{
                width: 280,
                height: '100%',
                backgroundColor: '#1e1e1e',
                borderRight: '1px solid #3e3e42',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    padding: 2,
                    borderBottom: '1px solid #3e3e42',
                }}
            >
                {/* Title Row with Home Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    {/* Home Button */}
                    <Tooltip title="Return to Home" placement="right">
                        <IconButton
                            onClick={handleHomeClick}
                            size="small"
                            sx={{
                                color: '#cccccc',
                                backgroundColor: '#2d2d30',
                                border: '1px solid #3e3e42',
                                '&:hover': {
                                    backgroundColor: '#37373d',
                                    borderColor: '#0e639c',
                                    color: '#0e639c',
                                },
                                width: 32,
                                height: 32,
                            }}
                        >
                            <HomeIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#cccccc',
                            flex: 1,
                        }}
                    >
                        Node Library
                    </Typography>

                    {/* Count Badge */}
                    <Chip
                        label={totalCount}
                        size="small"
                        sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            backgroundColor: '#0e639c',
                            color: '#ffffff',
                        }}
                    />
                </Box>

                {/* Search Box */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#858585', fontSize: '1.1rem' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: '#2d2d30',
                            color: '#cccccc',
                            fontSize: '0.8rem',
                            '& fieldset': {
                                borderColor: '#3e3e42',
                            },
                            '&:hover fieldset': {
                                borderColor: '#0e639c',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#0e639c',
                            },
                        },
                        '& input::placeholder': {
                            color: '#858585',
                            opacity: 1,
                        },
                    }}
                />
            </Box>

            {/* Category Sections */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 1,
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
                {categorizedNodes.map((category) => (
                    <CategorySection
                        key={category.key}
                        category={category}
                        nodes={category.nodes}
                        onNodeDragStart={onNodeDragStart}
                    />
                ))}

                {/* No Results Message */}
                {totalCount === 0 && (
                    <Box
                        sx={{
                            padding: 3,
                            textAlign: 'center',
                            color: '#858585',
                        }}
                    >
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            No nodes found matching "{searchQuery}"
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    padding: 1.5,
                    borderTop: '1px solid #3e3e42',
                    backgroundColor: '#252526',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        color: '#858585',
                        fontSize: '0.7rem',
                    }}
                >
                    Drag nodes onto canvas
                </Typography>
            </Box>
        </Box>
    );
};

export default NodePalette;