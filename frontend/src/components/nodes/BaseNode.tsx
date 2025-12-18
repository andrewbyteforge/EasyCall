// =============================================================================
// FILE: frontend/src/components/nodes/BaseNode.tsx
// =============================================================================
// Custom node component with properly aligned connection points.
// =============================================================================

import React, { useState, useMemo } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useEdges } from 'reactflow';
import {
    Box,
    Typography,
    Tooltip,
    Button,
    TextField,
    Select,
    MenuItem,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import './BaseNode.css';

// Node category colors matching your project spec
const CATEGORY_COLORS = {
    configuration: '#4a148c', // Deep purple
    input: '#1976d2',        // Blue
    query: '#00897b',        // Teal
    output: '#f57c00',       // Orange
};

interface ConfigOption {
    value: string;
    label: string;
}

interface ConfigField {
    id: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'password' | 'file' | 'filepath';
    required?: boolean;
    default?: any;
    placeholder?: string;
    options?: ConfigOption[];
    description?: string;
}

interface BaseNodeData {
    label: string;
    category: 'configuration' | 'input' | 'query' | 'output';
    icon?: string;
    description?: string;
    inputs?: Array<{ id: string; label: string }>;
    outputs?: Array<{ id: string; label: string }>;
    configuration?: ConfigField[];
    configValues?: Record<string, any>;
}

interface BaseNodeProps extends NodeProps {
    data: BaseNodeData;
}

const BaseNode: React.FC<BaseNodeProps> = ({ data, selected, id, type }) => {
    const categoryColor = CATEGORY_COLORS[data.category] || '#666666';
    const { setNodes, setEdges } = useReactFlow();
    const edges = useEdges();

    // Compute connected state for all pins
    const connectedInputs = useMemo(() => {
        const connected = new Set<string>();
        edges.forEach((edge) => {
            if (edge.target === id && edge.targetHandle) {
                connected.add(edge.targetHandle);
            }
        });
        return connected;
    }, [edges, id]);

    const connectedOutputs = useMemo(() => {
        const connected = new Set<string>();
        edges.forEach((edge) => {
            if (edge.source === id && edge.sourceHandle) {
                connected.add(edge.sourceHandle);
            }
        });
        return connected;
    }, [edges, id]);

    // Check if browser supports File System Access API
    // @ts-ignore
    const supportsFilePicker = typeof window !== 'undefined' && !!window.showDirectoryPicker;

    // State for filepath dialog
    const [filepathDialogOpen, setFilepathDialogOpen] = useState(false);
    const [filepathDialogFieldId, setFilepathDialogFieldId] = useState<string>('');
    const [filepathDialogFolder, setFilepathDialogFolder] = useState<string>('');
    const [filepathDialogFilename, setFilepathDialogFilename] = useState<string>('');
    const [filepathDialogHandle, setFilepathDialogHandle] = useState<any>(null);

    // Handle node deletion
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Remove the node
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
        // Remove any connected edges
        setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    };

    // Handle configuration value changes
    const handleConfigChange = (fieldId: string, value: any) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            configValues: {
                                ...(node.data.configValues || {}),
                                [fieldId]: value,
                            },
                        },
                    };
                }
                return node;
            })
        );
    };

    // Handle file selection
    const handleFileSelect = (fieldId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls,.pdf,.doc,.docx,.txt';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleConfigChange(fieldId, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    file: file,
                });
            }
        };
        input.click();
    };

    // Handle output filepath selection - opens dialog
    const handleFilepathSelect = (fieldId: string, defaultFilename: string) => {
        const currentValue = data.configValues?.[fieldId];
        setFilepathDialogFieldId(fieldId);
        setFilepathDialogFolder(currentValue?.folder || '');
        setFilepathDialogFilename(currentValue?.name || defaultFilename);
        setFilepathDialogHandle(currentValue?.handle || null);
        setFilepathDialogOpen(true);
    };

    // Handle browse folder button - opens native directory picker
    const handleBrowseFolder = async () => {
        // @ts-ignore - showDirectoryPicker is not yet in TypeScript types
        if (window.showDirectoryPicker) {
            try {
                // @ts-ignore
                const dirHandle = await window.showDirectoryPicker({
                    mode: 'readwrite',
                });
                setFilepathDialogFolder(dirHandle.name);
                setFilepathDialogHandle(dirHandle);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Error selecting folder:', err);
                }
            }
        }
    };

    // Handle quick location selection (for Firefox fallback)
    const handleQuickLocation = (location: string) => {
        setFilepathDialogFolder(location);
        setFilepathDialogHandle(null);
    };

    // Common folder locations based on OS
    const getCommonLocations = () => {
        const isWindows = navigator.platform.toLowerCase().includes('win');
        const username = 'User'; // Generic placeholder

        if (isWindows) {
            return [
                { label: 'Desktop', path: `C:/Users/${username}/Desktop` },
                { label: 'Documents', path: `C:/Users/${username}/Documents` },
                { label: 'Downloads', path: `C:/Users/${username}/Downloads` },
            ];
        } else {
            return [
                { label: 'Desktop', path: `~/Desktop` },
                { label: 'Documents', path: `~/Documents` },
                { label: 'Downloads', path: `~/Downloads` },
            ];
        }
    };

    // Handle filepath dialog save
    const handleFilepathDialogSave = () => {
        if (filepathDialogFilename.trim()) {
            const fullPath = filepathDialogFolder
                ? `${filepathDialogFolder}/${filepathDialogFilename}`
                : filepathDialogFilename;
            handleConfigChange(filepathDialogFieldId, {
                name: filepathDialogFilename,
                folder: filepathDialogFolder,
                path: fullPath,
                handle: filepathDialogHandle,
            });
        }
        setFilepathDialogOpen(false);
    };

    // Handle filepath dialog close
    const handleFilepathDialogClose = () => {
        setFilepathDialogOpen(false);
    };

    // Render a single configuration field
    const renderConfigField = (field: ConfigField) => {
        const value = data.configValues?.[field.id] ?? field.default ?? '';

        switch (field.type) {
            case 'file':
                const fileValue = data.configValues?.[field.id];
                return (
                    <Box key={field.id} sx={{ mb: 1 }} className="nodrag nowheel">
                        <Typography
                            sx={{
                                fontSize: '10px',
                                color: '#888',
                                mb: 0.5,
                            }}
                        >
                            {field.label} {field.required && '*'}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadFileIcon />}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFileSelect(field.id);
                            }}
                            sx={{
                                width: '100%',
                                fontSize: '11px',
                                textTransform: 'none',
                                borderColor: '#555',
                                color: '#ccc',
                                backgroundColor: '#333',
                                justifyContent: 'flex-start',
                                '&:hover': {
                                    borderColor: categoryColor,
                                    backgroundColor: '#3a3a3a',
                                },
                            }}
                        >
                            {fileValue?.name || 'Select File...'}
                        </Button>
                    </Box>
                );

            case 'filepath':
                const filepathValue = data.configValues?.[field.id];
                const displayPath = filepathValue?.path
                    ? (filepathValue.path.length > 30
                        ? '...' + filepathValue.path.slice(-27)
                        : filepathValue.path)
                    : null;
                return (
                    <Box key={field.id} sx={{ mb: 1 }} className="nodrag nowheel">
                        <Typography
                            sx={{
                                fontSize: '10px',
                                color: '#888',
                                mb: 0.5,
                            }}
                        >
                            {field.label} {field.required && '*'}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FolderOpenIcon />}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFilepathSelect(field.id, field.default || 'output.csv');
                            }}
                            sx={{
                                width: '100%',
                                fontSize: '11px',
                                textTransform: 'none',
                                borderColor: filepathValue?.path ? '#4caf50' : '#555',
                                color: filepathValue?.path ? '#4caf50' : '#ccc',
                                backgroundColor: '#333',
                                justifyContent: 'flex-start',
                                '&:hover': {
                                    borderColor: categoryColor,
                                    backgroundColor: '#3a3a3a',
                                },
                            }}
                        >
                            {displayPath || 'Click to Select Location...'}
                        </Button>
                    </Box>
                );

            case 'select':
                return (
                    <Box key={field.id} sx={{ mb: 1 }} className="nodrag nowheel">
                        <Typography
                            sx={{
                                fontSize: '10px',
                                color: '#888',
                                mb: 0.5,
                            }}
                        >
                            {field.label} {field.required && '*'}
                        </Typography>
                        <Select
                            size="small"
                            value={value}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleConfigChange(field.id, e.target.value);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                                width: '100%',
                                fontSize: '11px',
                                color: '#ccc',
                                backgroundColor: '#333',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#555',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: categoryColor,
                                },
                                '& .MuiSelect-icon': {
                                    color: '#888',
                                },
                            }}
                            MenuProps={{
                                // Render menu in a portal outside ReactFlow to avoid event capture
                                disablePortal: false,
                                PaperProps: {
                                    sx: {
                                        backgroundColor: '#2a2a2a',
                                        color: '#ccc',
                                    },
                                    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
                                },
                            }}
                        >
                            {field.options?.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                );

            case 'string':
            case 'password':
                return (
                    <Box key={field.id} sx={{ mb: 1 }} className="nodrag nowheel">
                        <Typography
                            sx={{
                                fontSize: '10px',
                                color: '#888',
                                mb: 0.5,
                            }}
                        >
                            {field.label} {field.required && '*'}
                        </Typography>
                        <TextField
                            size="small"
                            type={field.type === 'password' ? 'password' : 'text'}
                            value={value}
                            placeholder={field.placeholder}
                            onChange={(e) => handleConfigChange(field.id, e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                                width: '100%',
                                '& .MuiInputBase-input': {
                                    fontSize: '11px',
                                    color: '#ccc',
                                    padding: '6px 8px',
                                },
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#333',
                                    '& fieldset': {
                                        borderColor: '#555',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: categoryColor,
                                    },
                                },
                            }}
                        />
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <>
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
                    position: 'relative',
                    '&:hover': {
                        boxShadow: `0 0 20px ${categoryColor}60`,
                        transform: 'translateY(-2px)',
                    },
                    '&:hover .delete-button': {
                        opacity: 1,
                    }
                }}
            >
                {/* Delete Button */}
                <IconButton
                    className="delete-button nodrag"
                    size="small"
                    onClick={handleDelete}
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{
                        position: 'absolute',
                        top: -12,
                        right: -12,
                        width: 24,
                        height: 24,
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        '&:hover': {
                            backgroundColor: '#c82333',
                        },
                        zIndex: 10,
                    }}
                >
                    <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>

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

                    {/* Configuration Fields */}
                    {data.configuration && data.configuration.length > 0 && (
                        <Box sx={{ marginBottom: '12px' }}>
                            {data.configuration.map(renderConfigField)}
                        </Box>
                    )}

                    {/* Input Pins - Properly Aligned */}
                    {data.inputs && data.inputs.length > 0 && (
                        <Box sx={{ marginTop: '8px' }}>
                            {data.inputs.map((input, index) => {
                                const isConnected = connectedInputs.has(input.id);
                                // Connected = green, unconnected = hollow/pulsing
                                const pinColor = isConnected ? '#00c853' : categoryColor;

                                return (
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
                                                backgroundColor: isConnected ? pinColor : 'transparent',
                                                width: '12px',
                                                height: '12px',
                                                border: `2px solid ${pinColor}`,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                boxShadow: isConnected
                                                    ? `0 0 8px ${pinColor}`
                                                    : 'none',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                fontSize: '11px',
                                                color: isConnected ? '#00c853' : '#999999',
                                                marginLeft: '8px',
                                                fontWeight: 500,
                                                transition: 'color 0.3s ease',
                                            }}
                                        >
                                            {input.label}
                                            {!isConnected && (
                                                <span style={{
                                                    color: '#ff9800',
                                                    marginLeft: '4px',
                                                    fontSize: '9px',
                                                }}>
                                                    ●
                                                </span>
                                            )}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* Output Pins - Right Side */}
                    {data.outputs && data.outputs.length > 0 && (
                        <Box sx={{ marginTop: '8px' }}>
                            {data.outputs.map((output, index) => {
                                const isConnected = connectedOutputs.has(output.id);
                                // Connected = green, unconnected = category color (always filled)
                                const pinColor = isConnected ? '#00c853' : categoryColor;

                                return (
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
                                                color: isConnected ? '#00c853' : '#999999',
                                                marginRight: '8px',
                                                fontWeight: 500,
                                                transition: 'color 0.3s ease',
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
                                                backgroundColor: pinColor,
                                                width: '12px',
                                                height: '12px',
                                                border: '2px solid #1a1a1a',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                boxShadow: isConnected
                                                    ? `0 0 8px ${pinColor}`
                                                    : 'none',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        </Tooltip>

        {/* Output Path Selection Dialog */}
        <Dialog
            open={filepathDialogOpen}
            onClose={handleFilepathDialogClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#2a2a2a',
                    color: '#ccc',
                    borderRadius: '8px',
                },
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid #444', pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderOpenIcon sx={{ color: '#f57c00' }} />
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                        Select Output Location
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
                    Choose where to save your file by selecting a folder and entering a filename.
                </Typography>

                {/* Step 1: Select Folder */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 1 }}>
                        Step 1: Select Folder
                    </Typography>

                    {/* Native folder picker for Chrome/Edge */}
                    {supportsFilePicker ? (
                        <>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    value={filepathDialogFolder}
                                    onChange={(e) => setFilepathDialogFolder(e.target.value)}
                                    placeholder="Click 'Browse' to select a folder..."
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#333',
                                            color: '#fff',
                                            '& fieldset': { borderColor: '#555' },
                                            '&:hover fieldset': { borderColor: '#f57c00' },
                                            '&.Mui-focused fieldset': { borderColor: '#f57c00' },
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleBrowseFolder}
                                    startIcon={<FolderOpenIcon />}
                                    sx={{
                                        backgroundColor: '#444',
                                        '&:hover': { backgroundColor: '#555' },
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Browse
                                </Button>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                                Click Browse to open your computer's folder picker
                            </Typography>
                        </>
                    ) : (
                        /* Firefox/Safari fallback - Quick location buttons + manual input */
                        <>
                            <Typography variant="caption" sx={{ color: '#f57c00', display: 'block', mb: 1.5 }}>
                                Quick select a common location or type your own path:
                            </Typography>

                            {/* Quick location buttons */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                {getCommonLocations().map((loc) => (
                                    <Button
                                        key={loc.label}
                                        variant={filepathDialogFolder === loc.path ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => handleQuickLocation(loc.path)}
                                        sx={{
                                            fontSize: '12px',
                                            textTransform: 'none',
                                            borderColor: filepathDialogFolder === loc.path ? '#f57c00' : '#555',
                                            backgroundColor: filepathDialogFolder === loc.path ? '#f57c00' : 'transparent',
                                            color: filepathDialogFolder === loc.path ? '#fff' : '#ccc',
                                            '&:hover': {
                                                borderColor: '#f57c00',
                                                backgroundColor: filepathDialogFolder === loc.path ? '#e65100' : 'rgba(245, 124, 0, 0.1)',
                                            },
                                        }}
                                    >
                                        {loc.label}
                                    </Button>
                                ))}
                            </Box>

                            {/* Manual path input */}
                            <TextField
                                fullWidth
                                value={filepathDialogFolder}
                                onChange={(e) => setFilepathDialogFolder(e.target.value)}
                                placeholder="Or type folder path (e.g., C:/Users/YourName/Documents)"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#333',
                                        color: '#fff',
                                        '& fieldset': { borderColor: '#555' },
                                        '&:hover fieldset': { borderColor: '#f57c00' },
                                        '&.Mui-focused fieldset': { borderColor: '#f57c00' },
                                    },
                                }}
                            />
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                                Tip: Replace "User" with your actual Windows username
                            </Typography>
                        </>
                    )}
                </Box>

                {/* Step 2: Enter Filename */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 1 }}>
                        Step 2: Enter Filename
                    </Typography>
                    <TextField
                        fullWidth
                        value={filepathDialogFilename}
                        onChange={(e) => setFilepathDialogFilename(e.target.value)}
                        placeholder="e.g., report.csv"
                        size="small"
                        autoFocus
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#333',
                                color: '#fff',
                                '& fieldset': { borderColor: '#555' },
                                '&:hover fieldset': { borderColor: '#f57c00' },
                                '&.Mui-focused fieldset': { borderColor: '#f57c00' },
                            },
                        }}
                    />
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                        Include the file extension (.csv, .xlsx, .json, .txt)
                    </Typography>
                </Box>

                {/* Preview */}
                {(filepathDialogFolder || filepathDialogFilename) && (
                    <Box sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: '#1a1a1a',
                        borderRadius: 1,
                        border: '1px solid #444'
                    }}>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                            Full path preview:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#4caf50', fontFamily: 'monospace', mt: 0.5 }}>
                            {filepathDialogFolder
                                ? `${filepathDialogFolder}/${filepathDialogFilename}`
                                : filepathDialogFilename || '(no path selected)'}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #444', p: 2 }}>
                <Button
                    onClick={handleFilepathDialogClose}
                    sx={{ color: '#888' }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleFilepathDialogSave}
                    variant="contained"
                    disabled={!filepathDialogFilename.trim()}
                    startIcon={<SaveIcon />}
                    sx={{
                        backgroundColor: '#f57c00',
                        '&:hover': { backgroundColor: '#e65100' },
                        '&.Mui-disabled': { backgroundColor: '#444', color: '#666' },
                    }}
                >
                    Save Path
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default BaseNode;