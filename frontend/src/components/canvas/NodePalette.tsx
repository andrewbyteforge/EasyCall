// =============================================================================
// FILE: frontend/src/components/canvas/NodePalette.tsx
// =============================================================================
// Draggable node palette for the workflow canvas.
// Displays static nodes + dynamic database-driven nodes organized by provider.
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
    CircularProgress,
    Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    NodeTypeDefinition,
    getAllNodeTypes,
    NodeCategory,
} from '../../types/node_types';
import { useGeneratedNodes } from '../../hooks/useProviders';
import { GeneratedNodeDefinition } from '../../types/provider';

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
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert GeneratedNodeDefinition (from database) to NodeTypeDefinition (for canvas).
 * This allows database nodes to work with existing node rendering logic.
 */
/**
 * Convert GeneratedNodeDefinition (from database) to NodeTypeDefinition (for canvas).
 * This allows database nodes to work with existing node rendering logic.
 */
function convertGeneratedNodeToNodeType(
    generatedNode: GeneratedNodeDefinition
): NodeTypeDefinition {
    // Map database category string to NodeCategory enum
    let nodeCategory: NodeCategory;

    switch (generatedNode.category.toLowerCase()) {
        case 'config':
        case 'configuration':
            nodeCategory = NodeCategory.CONFIGURATION;
            break;
        case 'input':
            nodeCategory = NodeCategory.INPUT;
            break;
        case 'output':
            nodeCategory = NodeCategory.OUTPUT;
            break;
        case 'query':
        default:
            nodeCategory = NodeCategory.QUERY;
            break;
    }

    return {
        type: generatedNode.type,
        category: nodeCategory,  // ✅ Use mapped category, not hardcoded QUERY
        provider: generatedNode.provider as any,

        // Convenience properties
        name: generatedNode.name,
        icon: generatedNode.visual.icon,
        color: generatedNode.visual.color,
        description: generatedNode.description,
        longDescription: generatedNode.description,

        // Nested objects
        visual: {
            icon: generatedNode.visual.icon,
            color: generatedNode.visual.color,
            width: generatedNode.visual.width,
            height: typeof generatedNode.visual.height === 'string' ? 120 : generatedNode.visual.height,
        },
        documentation: {
            name: generatedNode.name,
            description: generatedNode.description,
            longDescription: generatedNode.description,
            usage: `Connect inputs → Execute → Use outputs`,
            examples: [`Query ${generatedNode.provider} API`],
        },
        inputs: generatedNode.inputs.map((pin) => ({
            id: pin.id,
            label: pin.label,
            type: pin.type as any,
            required: pin.required,
            description: pin.description,
        })),
        outputs: generatedNode.outputs.map((pin) => ({
            id: pin.id,
            label: pin.label,
            type: pin.type as any,
            description: pin.description,
        })),
        configuration: generatedNode.configuration || [],
    };
}

/**
 * Get dynamic categories based on providers in database.
 */
function getDynamicCategories(
    generatedNodes: GeneratedNodeDefinition[]
): CategoryConfig[] {
    // Get unique providers from generated nodes
    const providers = Array.from(
        new Set(generatedNodes.map((node) => node.provider))
    );

    // Color palette for dynamic providers (cycling through landing page colors)
    const dynamicColors = ['#667eea', '#764ba2', '#4facfe', '#f093fb'];

    // Create category for each provider
    return providers.map((provider, index) => ({
        key: `dynamic_${provider}`,
        icon: '🔌', // Plugin icon for dynamic providers
        label: `${provider.charAt(0).toUpperCase() + provider.slice(1)} (Database)`,
        defaultExpanded: true,
        color: dynamicColors[index % dynamicColors.length],
        filter: (node: NodeTypeDefinition) =>
            node.provider === provider && node.type.startsWith(`${provider}_`),
    }));
}

// =============================================================================
// STATIC CATEGORIES (Configuration, Input, Output, and hardcoded providers)
// =============================================================================

const STATIC_CATEGORIES: CategoryConfig[] = [
    {
        key: 'configuration',
        icon: '🔑',
        label: 'Configuration',
        defaultExpanded: false,
        color: '#f093fb',  // Pink accent
        filter: (node) => node.category === NodeCategory.CONFIGURATION,
    },
    {
        key: 'input',
        icon: '📍',
        label: 'Input',
        defaultExpanded: true,
        color: '#4facfe',  // Blue accent
        filter: (node) => node.category === NodeCategory.INPUT && node.type !== 'sticky_note',
    },
    {
        key: 'chainalysis',
        icon: '🔗',
        label: 'Chainalysis',
        defaultExpanded: true,
        color: '#667eea',  // Purple accent
        filter: (node) => node.provider === 'chainalysis' && !node.type.startsWith('chainalysis_dynamic'),
    },
    {
        key: 'trm',
        icon: '🛡️',
        label: 'TRM Labs',
        defaultExpanded: true,
        color: '#764ba2',  // Deep purple
        filter: (node) => node.provider === 'trm' && !node.type.startsWith('trm_dynamic'),
    },
];

// Output category defined separately so it can be added after dynamic categories
const OUTPUT_CATEGORY: CategoryConfig = {
    key: 'output',
    icon: '📤',
    label: 'Output',
    defaultExpanded: false,
    color: '#00f2fe',  // Cyan accent
    filter: (node) => node.category === NodeCategory.OUTPUT,
};

// Annotation category for sticky notes and other annotation nodes
const ANNOTATION_CATEGORY: CategoryConfig = {
    key: 'annotation',
    icon: '📝',
    label: 'Annotations',
    defaultExpanded: true,
    color: '#f59e0b',  // Amber accent
    filter: (node) => node.type === 'sticky_note',
};

// Sticky note node definition for the palette
const STICKY_NOTE_NODE: NodeTypeDefinition = {
    type: 'sticky_note',
    category: NodeCategory.INPUT, // Using INPUT as placeholder, filtered separately
    provider: undefined as any,
    name: 'Sticky Note',
    icon: '📝',
    color: '#f59e0b',
    description: 'Add notes and annotations to your workflow',
    longDescription: 'A resizable sticky note for adding comments, documentation, or reminders to your workflow canvas.',
    visual: {
        icon: '📝',
        color: '#f59e0b',
        width: 200,
        height: 150,
    },
    documentation: {
        name: 'Sticky Note',
        description: 'Add notes and annotations to your workflow',
        longDescription: 'A resizable sticky note for adding comments, documentation, or reminders to your workflow canvas.',
        usage: 'Drag onto canvas → Double-click to edit → Drag corners to resize',
        examples: ['Document workflow steps', 'Add reminders', 'Explain complex logic'],
    },
    inputs: [],
    outputs: [],
    configuration: [],
};

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
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#ffffff' }}>
                {node.name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem', color: '#a0aec0' }}>
                {node.longDescription || node.description}
            </Typography>

            {/* Input Pins */}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 1, color: '#4facfe' }}>
                Inputs:
            </Typography>
            {node.inputs.length > 0 ? (
                <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                    {node.inputs.map((input) => (
                        <li key={input.id}>
                            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                {input.label} ({input.type})
                                {input.required && ' *'}
                            </Typography>
                        </li>
                    ))}
                </Box>
            ) : (
                <Typography variant="caption" sx={{ color: '#6b7280', ml: 1 }}>
                    None
                </Typography>
            )}

            {/* Output Pins */}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 1, color: '#00f2fe' }}>
                Outputs:
            </Typography>
            {node.outputs.length > 0 ? (
                <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                    {node.outputs.map((output) => (
                        <li key={output.id}>
                            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                {output.label} ({output.type})
                            </Typography>
                        </li>
                    ))}
                </Box>
            ) : (
                <Typography variant="caption" sx={{ color: '#6b7280', ml: 1 }}>
                    None
                </Typography>
            )}

            {/* Provider Info */}
            {node.provider && (
                <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 1, fontStyle: 'italic', color: '#667eea' }}
                >
                    Provider: {node.provider === 'chainalysis' ? 'Chainalysis' : node.provider === 'trm' ? 'TRM Labs' : node.provider}
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
                        bgcolor: 'rgba(5, 10, 30, 0.95)',
                        color: '#a0aec0',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        maxWidth: 350,
                        fontSize: '0.8rem',
                        borderRadius: '12px',
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
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    cursor: 'grab',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        backgroundColor: `${categoryColor}15`,
                        borderColor: `${categoryColor}60`,
                        transform: 'translateX(4px)',
                        boxShadow: `0 4px 16px ${categoryColor}30`,
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
                        color: '#ffffff',
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
                                node.provider === 'chainalysis' ? '#667eea' : '#764ba2',
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
                backgroundColor: 'transparent',
                color: '#ffffff',
                boxShadow: 'none',
                border: 'none',
                '&:before': { display: 'none' },
                mb: 1,
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#a0aec0' }} />}
                sx={{
                    minHeight: 'auto',
                    padding: '12px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        backgroundColor: `${category.color}15`,
                        borderColor: `${category.color}40`,
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box sx={{ fontSize: '1.1rem' }}>{category.icon}</Box>
                    <Typography
                        variant="body2"
                        sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}
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
    // FETCH DYNAMIC NODES FROM DATABASE
    // ---------------------------------------------------------------------------

    const {
        nodes: generatedNodes,
        loading: loadingNodes,
        error: nodeError,
        refetch: refetchNodes,
    } = useGeneratedNodes();

    // ---------------------------------------------------------------------------
    // GET STATIC NODES
    // ---------------------------------------------------------------------------

    const staticNodes = useMemo(() => getAllNodeTypes(), []);

    // ---------------------------------------------------------------------------
    // MERGE STATIC + DYNAMIC NODES
    // ---------------------------------------------------------------------------

    const allNodes = useMemo(() => {
        // Convert generated nodes to NodeTypeDefinition format
        const convertedGeneratedNodes = generatedNodes.map(
            convertGeneratedNodeToNodeType
        );

        // Merge static and dynamic nodes, plus annotation nodes
        return [...staticNodes, ...convertedGeneratedNodes, STICKY_NOTE_NODE];
    }, [staticNodes, generatedNodes]);

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
    // BUILD CATEGORIES (Static + Dynamic)
    // ---------------------------------------------------------------------------

    const categories = useMemo(() => {
        // Get dynamic categories from generated nodes
        const dynamicCategories = getDynamicCategories(generatedNodes);

        // Merge static categories with dynamic ones, then add Output and Annotation at the end
        return [...STATIC_CATEGORIES, ...dynamicCategories, OUTPUT_CATEGORY, ANNOTATION_CATEGORY];
    }, [generatedNodes]);

    // ---------------------------------------------------------------------------
    // ORGANIZE NODES BY CATEGORY
    // ---------------------------------------------------------------------------

    const categorizedNodes = useMemo(() => {
        return categories.map((category) => ({
            ...category,
            nodes: filteredNodes.filter(category.filter),
        }));
    }, [categories, filteredNodes]);

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
                backgroundColor: '#050a1e',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    padding: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                {/* Title Row with Home Button and Refresh */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    {/* Home Button */}
                    <Tooltip title="Return to Home" placement="right">
                        <IconButton
                            onClick={handleHomeClick}
                            size="small"
                            sx={{
                                color: '#a0aec0',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                '&:hover': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                    borderColor: 'rgba(102, 126, 234, 0.4)',
                                    color: '#667eea',
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
                            color: '#ffffff',
                            flex: 1,
                        }}
                    >
                        Node Library
                    </Typography>

                    {/* Refresh Button */}
                    <Tooltip title="Refresh nodes from database" placement="left">
                        <IconButton
                            onClick={refetchNodes}
                            disabled={loadingNodes}
                            size="small"
                            sx={{
                                color: '#a0aec0',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                '&:hover': {
                                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                                    borderColor: 'rgba(79, 172, 254, 0.4)',
                                    color: '#4facfe',
                                },
                                '&:disabled': {
                                    opacity: 0.5,
                                },
                                width: 32,
                                height: 32,
                            }}
                        >
                            {loadingNodes ? (
                                <CircularProgress size={16} sx={{ color: '#667eea' }} />
                            ) : (
                                <RefreshIcon sx={{ fontSize: '1.1rem' }} />
                            )}
                        </IconButton>
                    </Tooltip>

                    {/* Count Badge */}
                    <Chip
                        label={totalCount}
                        size="small"
                        sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#ffffff',
                        }}
                    />
                </Box>

                {/* Loading/Error Status */}
                {loadingNodes && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                            padding: '6px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                        }}
                    >
                        <CircularProgress size={14} sx={{ color: '#667eea' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#667eea' }}>
                            Loading database nodes...
                        </Typography>
                    </Box>
                )}

                {nodeError && (
                    <Alert
                        severity="warning"
                        sx={{
                            mb: 1,
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            backgroundColor: 'rgba(240, 147, 251, 0.1)',
                            color: '#f093fb',
                            border: '1px solid rgba(240, 147, 251, 0.3)',
                            borderRadius: '8px',
                            '& .MuiAlert-icon': {
                                fontSize: '1rem',
                                color: '#f093fb',
                            },
                        }}
                    >
                        Failed to load database nodes. Showing static nodes only.
                    </Alert>
                )}

                {/* Database Node Count */}
                {generatedNodes.length > 0 && (
                    <Typography
                        sx={{
                            mb: 1,
                            fontSize: '0.75rem',
                            color: '#4facfe',
                            textAlign: 'center',
                            padding: '4px',
                            backgroundColor: 'rgba(79, 172, 254, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 172, 254, 0.2)',
                        }}
                    >
                        🔌 {generatedNodes.length} node{generatedNodes.length !== 1 ? 's' : ''} from database
                    </Typography>
                )}

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
                                <SearchIcon sx={{ color: '#a0aec0', fontSize: '1.1rem' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            borderRadius: '10px',
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(102, 126, 234, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                            },
                        },
                        '& input::placeholder': {
                            color: '#a0aec0',
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
                        backgroundColor: '#050a1e',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(102, 126, 234, 0.3)',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.5)',
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
                            color: '#a0aec0',
                        }}
                    >
                        <SearchIcon sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.5 }} />
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
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(10, 14, 39, 0.8)',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        color: '#a0aec0',
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