// =============================================================================
// FILE: frontend/src/components/AddProviderModal.jsx
// =============================================================================
// Modal for adding new API providers via OpenAPI spec upload
// Features: File upload, automatic parsing, node generation, feedback
// =============================================================================

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Api as ApiIcon,
} from '@mui/icons-material';
import { uploadProvider, parseProvider, generateNodes } from '../services/apiService';

const steps = ['Upload Spec', 'Parse Spec', 'Generate Nodes'];

/**
 * AddProviderModal Component
 * 
 * Handles the complete workflow of adding a new API provider:
 * 1. Upload OpenAPI specification file
 * 2. Parse the specification
 * 3. Generate workflow nodes
 */
export default function AddProviderModal({ open, onClose, onSuccess }) {
    // State management
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form data
    const [providerName, setProviderName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [specId, setSpecId] = useState(null);
    const [generatedNodes, setGeneratedNodes] = useState([]);

    // File upload stats
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * Reset modal state
     */
    const handleReset = () => {
        setActiveStep(0);
        setLoading(false);
        setError(null);
        setSuccess(null);
        setProviderName('');
        setSelectedFile(null);
        setSpecId(null);
        setGeneratedNodes([]);
        setUploadProgress(0);
    };

    /**
     * Close modal and reset
     */
    const handleClose = () => {
        handleReset();
        onClose();
    };

    /**
     * Handle file selection
     */
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const validExtensions = ['.json', '.yaml', '.yml'];
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (!validExtensions.includes(fileExtension)) {
                setError('Please upload a valid OpenAPI spec file (.json, .yaml, or .yml)');
                return;
            }

            setSelectedFile(file);
            setError(null);

            // Auto-populate provider name from filename if empty
            if (!providerName) {
                const baseName = file.name.replace(/\.(json|yaml|yml)$/i, '');
                setProviderName(baseName.replace(/[^a-z0-9_]/gi, '_').toLowerCase());
            }
        }
    };

    /**
     * Step 1: Upload OpenAPI Spec
     */
    const handleUploadSpec = async () => {
        if (!providerName || !selectedFile) {
            setError('Please provide both provider name and spec file');
            return;
        }

        setLoading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('provider', providerName);
            formData.append('spec_file', selectedFile);
            formData.append('is_active', 'true');

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            // Upload spec
            const response = await uploadProvider(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.id) {
                setSpecId(response.id);
                setSuccess(`✅ Uploaded ${providerName} specification`);
                setActiveStep(1);

                // Auto-proceed to parsing after 1 second
                setTimeout(() => {
                    handleParseSpec(response.id);
                }, 1000);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to upload specification');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Step 2: Parse the uploaded spec
     */
    const handleParseSpec = async (id) => {
        const targetId = id || specId;

        if (!targetId) {
            setError('No spec ID found. Please upload again.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await parseProvider(targetId);

            if (response.success || response.is_parsed) {
                setSuccess(`✅ Parsed specification successfully`);
                setActiveStep(2);

                // Auto-proceed to node generation after 1 second
                setTimeout(() => {
                    handleGenerateNodes(targetId);
                }, 1000);
            } else {
                throw new Error(response.message || 'Parsing failed');
            }
        } catch (err) {
            console.error('Parse error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to parse specification');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Step 3: Generate nodes from parsed spec
     */
    const handleGenerateNodes = async (id) => {
        const targetId = id || specId;

        if (!targetId) {
            setError('No spec ID found. Please start over.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await generateNodes(targetId);

            if (response.nodes && response.nodes.length > 0) {
                setGeneratedNodes(response.nodes);
                setSuccess(`✅ Generated ${response.nodes.length} workflow nodes`);

                // Notify parent component
                if (onSuccess) {
                    onSuccess({
                        provider: providerName,
                        nodesCount: response.nodes.length,
                        nodes: response.nodes,
                    });
                }
            } else {
                throw new Error('No nodes generated');
            }
        } catch (err) {
            console.error('Node generation error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to generate nodes');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Render upload step
     */
    const renderUploadStep = () => (
        <Box>
            <TextField
                fullWidth
                label="Provider Name"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g., trm_labs, chainalysis"
                margin="normal"
                required
                helperText="Lowercase letters, numbers, and underscores only"
                sx={{ mb: 3 }}
            />

            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: selectedFile ? 'primary.main' : 'divider',
                    bgcolor: selectedFile ? 'action.hover' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                    },
                }}
                component="label"
            >
                <input
                    type="file"
                    hidden
                    accept=".json,.yaml,.yml"
                    onChange={handleFileSelect}
                />

                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

                <Typography variant="h6" gutterBottom>
                    {selectedFile ? selectedFile.name : 'Choose OpenAPI Spec File'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    Supports .json, .yaml, and .yml files
                </Typography>

                {selectedFile && (
                    <Chip
                        label={`${(selectedFile.size / 1024).toFixed(2)} KB`}
                        color="primary"
                        size="small"
                        sx={{ mt: 2 }}
                    />
                )}
            </Paper>

            {uploadProgress > 0 && uploadProgress < 100 && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Uploading... {uploadProgress}%
                    </Typography>
                </Box>
            )}
        </Box>
    );

    /**
     * Render parsing step
     */
    const renderParsingStep = () => (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            {loading ? (
                <>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6">Parsing specification...</Typography>
                    <Typography variant="body2" color="text.secondary">
                        This may take a few moments
                    </Typography>
                </>
            ) : success ? (
                <>
                    <SuccessIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6">{success}</Typography>
                </>
            ) : (
                <>
                    <ApiIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">Ready to parse</Typography>
                </>
            )}
        </Box>
    );

    /**
     * Render node generation step
     */
    const renderNodeGenerationStep = () => (
        <Box>
            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6">Generating workflow nodes...</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Creating nodes from API endpoints
                    </Typography>
                </Box>
            ) : generatedNodes.length > 0 ? (
                <>
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="h6" component="div">
                            🎉 Successfully generated {generatedNodes.length} nodes!
                        </Typography>
                    </Alert>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Generated Nodes:
                    </Typography>

                    <Paper
                        variant="outlined"
                        sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.default' }}
                    >
                        <List dense>
                            {generatedNodes.map((node, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={node.name || node.type}
                                        secondary={`Type: ${node.type}`}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    <Chip
                                        label={node.endpoint?.method || 'API'}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        These nodes are now available in the workflow canvas palette.
                    </Typography>
                </>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ApiIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">Ready to generate nodes</Typography>
                </Box>
            )}
        </Box>
    );

    /**
     * Render current step content
     */
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return renderUploadStep();
            case 1:
                return renderParsingStep();
            case 2:
                return renderNodeGenerationStep();
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ApiIcon />
                    <Typography variant="h6">Add API Provider</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Progress Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Success Alert */}
                {success && activeStep < 2 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Step Content */}
                {renderStepContent()}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    {generatedNodes.length > 0 ? 'Close' : 'Cancel'}
                </Button>

                {activeStep === 0 && (
                    <Button
                        variant="contained"
                        onClick={handleUploadSpec}
                        disabled={!providerName || !selectedFile || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                        {loading ? 'Uploading...' : 'Upload & Parse'}
                    </Button>
                )}

                {activeStep === 1 && !success && !loading && (
                    <Button
                        variant="contained"
                        onClick={() => handleParseSpec()}
                        disabled={loading}
                    >
                        Parse Spec
                    </Button>
                )}

                {activeStep === 2 && generatedNodes.length === 0 && !loading && (
                    <Button
                        variant="contained"
                        onClick={() => handleGenerateNodes()}
                        disabled={loading}
                    >
                        Generate Nodes
                    </Button>
                )}

                {generatedNodes.length > 0 && (
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        color="success"
                    >
                        Done - Go to Canvas
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}