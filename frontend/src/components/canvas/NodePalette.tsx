// =============================================================================
// FILE: frontend/src/components/canvas/NodePalette.tsx
// =============================================================================
// Node palette displaying all 21 available node types.
// Organized by category with drag-and-drop functionality.
// =============================================================================

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
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
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get category display name.
 */
function getCategoryName(category: NodeCategory): string {
    const names: Record<NodeCategory, string> = {
        configuration: 'Configuration',
        input: 'Input',
        query: 'Query',
        output: 'Output',
    };
    return names[category];
}

/**
 * Get category icon.
 */
function getCategoryIcon(category: NodeCategory): string {
    const icons: Record<NodeCategory, string> = {
        configuration: '⚙️',
        input: '📥',
        query: '🔍',
        output: '📤',
    };
    return icons[category];
}

// =============================================================================
// NODE PALETTE COMPONENT
// =============================================================================

const NodePalette: React.FC<NodePaletteProps> = ({ onNodeSelect }) => {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([
        'configuration',
        'input',
    ]);

    // -------------------------------------------------------------------------
    // DATA
    // -------------------------------------------------------------------------

    const allNodes = getAllNodeTypes();
    const categories: NodeCategory[] = ['configuration', 'input', 'query', 'output'];

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

    /**
     * Handle accordion expand/collapse.
     */
    const handleCategoryToggle = (category: string) => {
        setExpandedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    /**
     * Handle drag start for node.
     */
    const onDragStart = (
        event: React.DragEvent,
        nodeType: NodeTypeDefinition
    ) => {
        event.dataTransfer.setData('application/reactflow', nodeType.type);
        event.dataTransfer.setData(
            'application/nodedata',
            JSON.stringify(nodeType)
        );
        event.dataTransfer.effectAllowed = 'move';
    };

    /**
     * Handle node click.
     */
    const handleNodeClick = (nodeType: NodeTypeDefinition) => {
        if (onNodeSelect) {
            onNodeSelect(nodeType);
        }
    };

    // -------------------------------------------------------------------------
    // RENDER NODE ITEM
    // -------------------------------------------------------------------------

    const renderNodeItem = (node: NodeTypeDefinition) => (
        <ListItem
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node)}
            onClick={() => handleNodeClick(node)}
            sx={{
                cursor: 'grab',
                borderRadius: 1,
                mb: 0.5,
                border: `1px solid ${colors.divider}`,
                backgroundColor: colors.background.elevated,
                transition: 'all 0.2s',
                '&:hover': {
                    backgroundColor: colors.background.paper,
                    borderColor: node.color,
                    transform: 'translateX(4px)',
                },
                '&:active': {
                    cursor: 'grabbing',
                },
            }}
        >
            <Tooltip
                title={node.longDescription}
                placement="right"
                arrow
            >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {/* Node Icon */}
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            backgroundColor: node.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5,
                            fontSize: '1.2rem',
                        }}
                    >
                        {node.icon}
                    </Box>

                    {/* Node Info */}
                    <ListItemText
                        primary={node.name}
                        secondary={node.description}
                        primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500,
                            noWrap: true,
                        }}
                        secondaryTypographyProps={{
                            variant: 'caption',
                            noWrap: true,
                            sx: { color: colors.text.secondary },
                        }}
                    />

                    {/* Provider Badge */}
                    {node.provider && (
                        <Chip
                            label={node.provider === 'chainalysis' ? 'C' : 'T'}
                            size="small"
                            sx={{
                                ml: 1,
                                height: 20,
                                fontSize: '0.7rem',
                                backgroundColor:
                                    node.provider === 'chainalysis'
                                        ? colors.nodeColors.configuration
                                        : colors.secondary.main,
                            }}
                        />
                    )}
                </Box>
            </Tooltip>
        </ListItem>
    );

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: colors.background.paper,
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
                    {filteredNodes.length} nodes available
                </Typography>
            </Box>

            {/* Node Categories */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                {searchQuery ? (
                    // Show filtered results
                    <List dense>
                        {filteredNodes.map(renderNodeItem)}
                    </List>
                ) : (
                    // Show by category
                    categories.map((category) => {
                        const categoryNodes = getNodesByCategory(category);

                        if (categoryNodes.length === 0) return null;

                        return (
                            <Accordion
                                key={category}
                                expanded={expandedCategories.includes(category)}
                                onChange={() => handleCategoryToggle(category)}
                                disableGutters
                                elevation={0}
                                sx={{
                                    backgroundColor: 'transparent',
                                    '&:before': { display: 'none' },
                                    mb: 0.5,
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        minHeight: 40,
                                        '& .MuiAccordionSummary-content': {
                                            my: 0.5,
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ mr: 1 }}>
                                            {getCategoryIcon(category)}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {getCategoryName(category)}
                                        </Typography>
                                        <Chip
                                            label={categoryNodes.length}
                                            size="small"
                                            sx={{
                                                ml: 1,
                                                height: 20,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails sx={{ p: 0.5, pt: 0 }}>
                                    <List dense>
                                        {categoryNodes.map(renderNodeItem)}
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })
                )}
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