// =============================================================================
// FILE: frontend/src/pages/WorkflowDashboard.tsx
// =============================================================================
// Dashboard page showing list of saved workflows with edit/delete actions
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Chip,
    Stack,
    CircularProgress,
    Paper,
    alpha,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    ArrowBack as BackIcon,
    AccountTree as WorkflowIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { listWorkflows, deleteWorkflow, WorkflowListItem } from '../api/workflow_api';
import { colors } from '../theme';

// =============================================================================
// COMPONENT
// =============================================================================

const WorkflowDashboard: React.FC = () => {
    const navigate = useNavigate();

    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------

    const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowListItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ---------------------------------------------------------------------------
    // LOAD WORKFLOWS
    // ---------------------------------------------------------------------------

    const loadWorkflows = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listWorkflows();
            setWorkflows(data);
        } catch (err) {
            console.error('Error loading workflows:', err);
            setError('Failed to load workflows. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWorkflows();
    }, [loadWorkflows]);

    // ---------------------------------------------------------------------------
    // DELETE WORKFLOW
    // ---------------------------------------------------------------------------

    const handleDeleteClick = (workflow: WorkflowListItem) => {
        setWorkflowToDelete(workflow);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!workflowToDelete) return;

        setDeleting(true);
        try {
            await deleteWorkflow(workflowToDelete.uuid);
            setWorkflows((prev) => prev.filter((w) => w.uuid !== workflowToDelete.uuid));
            setDeleteDialogOpen(false);
            setWorkflowToDelete(null);
        } catch (err) {
            console.error('Error deleting workflow:', err);
            setError('Failed to delete workflow. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setWorkflowToDelete(null);
    };

    // ---------------------------------------------------------------------------
    // NAVIGATION
    // ---------------------------------------------------------------------------

    const handleEditWorkflow = (workflowId: string) => {
        navigate(`/dashboard/${workflowId}`);
    };

    const handleCreateNew = () => {
        navigate('/canvas');
    };

    const handleBack = () => {
        navigate('/');
    };

    // ---------------------------------------------------------------------------
    // FORMAT DATE
    // ---------------------------------------------------------------------------

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${colors.background.default} 0%, #1a237e 100%)`,
                pt: 4,
                pb: 6,
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <IconButton
                            onClick={handleBack}
                            sx={{
                                color: colors.text.secondary,
                                '&:hover': {
                                    bgcolor: alpha(colors.primary.main, 0.1),
                                },
                            }}
                        >
                            <BackIcon />
                        </IconButton>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                color: colors.text.primary,
                            }}
                        >
                            Workflow Dashboard
                        </Typography>
                    </Stack>

                    <Typography
                        variant="body1"
                        sx={{ color: colors.text.secondary, ml: 6 }}
                    >
                        Manage your saved workflows - view, edit, or delete them.
                    </Typography>
                </Box>

                {/* Action Bar */}
                <Paper
                    sx={{
                        p: 2,
                        mb: 4,
                        bgcolor: alpha(colors.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${colors.divider}`,
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} saved
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateNew}
                            sx={{
                                background: `linear-gradient(45deg, ${colors.primary.main} 30%, ${colors.primary.light} 90%)`,
                                '&:hover': {
                                    background: `linear-gradient(45deg, ${colors.primary.dark} 30%, ${colors.primary.main} 90%)`,
                                },
                            }}
                        >
                            Create New Workflow
                        </Button>
                    </Stack>
                </Paper>

                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Paper
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            bgcolor: alpha(colors.status.error, 0.1),
                            border: `1px solid ${colors.status.error}`,
                        }}
                    >
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                        <Button variant="outlined" onClick={loadWorkflows}>
                            Try Again
                        </Button>
                    </Paper>
                )}

                {/* Empty State */}
                {!loading && !error && workflows.length === 0 && (
                    <Paper
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            bgcolor: alpha(colors.background.paper, 0.8),
                            border: `1px solid ${colors.divider}`,
                        }}
                    >
                        <WorkflowIcon
                            sx={{ fontSize: 64, color: colors.text.disabled, mb: 2 }}
                        />
                        <Typography variant="h6" sx={{ mb: 1, color: colors.text.primary }}>
                            No Workflows Yet
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ mb: 3, color: colors.text.secondary }}
                        >
                            Create your first workflow to get started with blockchain intelligence.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateNew}
                            sx={{
                                background: `linear-gradient(45deg, ${colors.primary.main} 30%, ${colors.primary.light} 90%)`,
                            }}
                        >
                            Create Your First Workflow
                        </Button>
                    </Paper>
                )}

                {/* Workflow Cards Grid */}
                {!loading && !error && workflows.length > 0 && (
                    <Grid container spacing={3}>
                        {workflows.map((workflow) => (
                            <Grid item xs={12} sm={6} md={4} key={workflow.uuid}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        bgcolor: alpha(colors.background.paper, 0.9),
                                        border: `1px solid ${colors.divider}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(colors.primary.main, 0.3)}`,
                                            borderColor: colors.primary.main,
                                        },
                                    }}
                                    onClick={() => handleEditWorkflow(workflow.uuid)}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Stack
                                            direction="row"
                                            alignItems="flex-start"
                                            justifyContent="space-between"
                                            sx={{ mb: 2 }}
                                        >
                                            <Box
                                                sx={{
                                                    p: 1,
                                                    borderRadius: 1,
                                                    bgcolor: alpha(colors.primary.main, 0.1),
                                                }}
                                            >
                                                <WorkflowIcon
                                                    sx={{ color: colors.primary.main }}
                                                />
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={`${workflow.node_count} nodes`}
                                                sx={{
                                                    bgcolor: alpha(colors.secondary.main, 0.2),
                                                    color: colors.secondary.light,
                                                }}
                                            />
                                        </Stack>

                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            sx={{
                                                fontWeight: 600,
                                                color: colors.text.primary,
                                                mb: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {workflow.name}
                                        </Typography>

                                        {workflow.description && (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: colors.text.secondary,
                                                    mb: 2,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {workflow.description}
                                            </Typography>
                                        )}

                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={0.5}
                                            sx={{ mt: 'auto' }}
                                        >
                                            <ScheduleIcon
                                                sx={{
                                                    fontSize: 14,
                                                    color: colors.text.disabled,
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{ color: colors.text.disabled }}
                                            >
                                                Updated {formatDate(workflow.updated_at)}
                                            </Typography>
                                        </Stack>
                                    </CardContent>

                                    <CardActions
                                        sx={{
                                            borderTop: `1px solid ${colors.divider}`,
                                            justifyContent: 'flex-end',
                                            px: 2,
                                            py: 1,
                                        }}
                                    >
                                        <Tooltip title="Edit Workflow">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditWorkflow(workflow.uuid);
                                                }}
                                                sx={{
                                                    color: colors.primary.main,
                                                    '&:hover': {
                                                        bgcolor: alpha(colors.primary.main, 0.1),
                                                    },
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Workflow">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(workflow);
                                                }}
                                                sx={{
                                                    color: colors.status.error,
                                                    '&:hover': {
                                                        bgcolor: alpha(colors.status.error, 0.1),
                                                    },
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                PaperProps={{
                    sx: {
                        bgcolor: colors.background.paper,
                        border: `1px solid ${colors.divider}`,
                    },
                }}
            >
                <DialogTitle sx={{ color: colors.text.primary }}>
                    Delete Workflow?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: colors.text.secondary }}>
                        Are you sure you want to delete "{workflowToDelete?.name}"? This action
                        cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleDeleteCancel}
                        disabled={deleting}
                        sx={{ color: colors.text.secondary }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        disabled={deleting}
                        variant="contained"
                        color="error"
                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WorkflowDashboard;
