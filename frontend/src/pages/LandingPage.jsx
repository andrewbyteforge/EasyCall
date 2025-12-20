// =============================================================================
// FILE: frontend/src/pages/LandingPage.jsx (UPDATED)
// =============================================================================
// Landing page with Add API Provider modal functionality
// Updated to open modal instead of redirecting to canvas
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Paper,
    Chip,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    AccountTree as WorkflowIcon,
    Api as ApiIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
} from '@mui/icons-material';
import AddProviderModal from '../components/AddProviderModal';
import { getStatistics } from '../services/apiService';

export default function LandingPage() {
    const navigate = useNavigate();

    // State
    const [showAddProviderModal, setShowAddProviderModal] = useState(false);
    const [stats, setStats] = useState({
        totalWorkflows: 0,
        totalProviders: 0,
        totalExecutions: 0,
        activeProviders: 0,
    });

    // Load statistics
    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const data = await getStatistics();
            setStats(data);
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    };

    /**
     * Handle successful provider addition
     */
    const handleProviderAdded = (providerData) => {
        console.log('Provider added:', providerData);

        // Refresh statistics
        loadStatistics();

        // Show success message (you could use a snackbar here)
        console.log(`✅ Added ${providerData.provider} with ${providerData.nodesCount} nodes`);
    };

    const features = [
        {
            icon: <WorkflowIcon sx={{ fontSize: 40 }} />,
            title: 'Visual Workflow Builder',
            description: 'Drag-and-drop interface for creating complex blockchain investigation workflows',
        },
        {
            icon: <ApiIcon sx={{ fontSize: 40 }} />,
            title: 'Dynamic API Integration',
            description: 'Upload any OpenAPI spec to automatically generate workflow nodes',
        },
        {
            icon: <SpeedIcon sx={{ fontSize: 40 }} />,
            title: 'Batch Processing',
            description: 'Process hundreds of addresses simultaneously with automated workflows',
        },
        {
            icon: <SecurityIcon sx={{ fontSize: 40 }} />,
            title: 'Professional Reports',
            description: 'Generate comprehensive PDF reports with charts and visualizations',
        },
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a1929 0%, #1a237e 100%)',
                pt: 8,
                pb: 6,
            }}
        >
            <Container maxWidth="lg">
                {/* Hero Section */}
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2,
                        }}
                    >
                        🔗 EasyCall
                    </Typography>

                    <Typography
                        variant="h5"
                        color="text.secondary"
                        sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}
                    >
                        Blockchain Intelligence Workflow Builder
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
                    >
                        Transform complex API interactions into visual workflows.
                        No coding required.
                    </Typography>

                    {/* Action Buttons */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        sx={{ mb: 6 }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/canvas')}
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
                                },
                            }}
                        >
                            Create Workflow
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<ApiIcon />}
                            onClick={() => setShowAddProviderModal(true)}
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                borderColor: '#90caf9',
                                color: '#90caf9',
                                '&:hover': {
                                    borderColor: '#64b5f6',
                                    bgcolor: 'rgba(144, 202, 249, 0.08)',
                                },
                            }}
                        >
                            Add API Provider
                        </Button>
                    </Stack>

                    {/* Live Stats */}
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={3}>
                                <Box>
                                    <Typography variant="h4" color="primary" fontWeight="bold">
                                        {stats.totalWorkflows}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Workflows
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                                <Box>
                                    <Typography variant="h4" color="primary" fontWeight="bold">
                                        {stats.activeProviders}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Providers
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                                <Box>
                                    <Typography variant="h4" color="primary" fontWeight="bold">
                                        {stats.totalExecutions}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Executions
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                                <Box>
                                    <Chip
                                        label="LIVE"
                                        color="success"
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        System Status
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                {/* Features Grid */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 12px 40px rgba(33, 150, 243, 0.3)',
                                    },
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* How It Works */}
                <Paper
                    sx={{
                        p: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <Typography
                        variant="h4"
                        align="center"
                        gutterBottom
                        fontWeight="bold"
                    >
                        How It Works
                    </Typography>

                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2,
                                    }}
                                >
                                    <Typography variant="h5" fontWeight="bold">
                                        1
                                    </Typography>
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    Add Provider
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Upload OpenAPI spec from Chainalysis, TRM Labs, or any API
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2,
                                    }}
                                >
                                    <Typography variant="h5" fontWeight="bold">
                                        2
                                    </Typography>
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    Build Workflow
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Drag and drop nodes to create your investigation workflow
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2,
                                    }}
                                >
                                    <Typography variant="h5" fontWeight="bold">
                                        3
                                    </Typography>
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    Execute & Export
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Run workflows and export results to PDF, CSV, or JSON
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                        Built with Django + React + React Flow
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Professional blockchain intelligence for compliance and investigation teams
                    </Typography>
                </Box>
            </Container>

            {/* Add Provider Modal */}
            <AddProviderModal
                open={showAddProviderModal}
                onClose={() => setShowAddProviderModal(false)}
                onSuccess={handleProviderAdded}
            />
        </Box>
    );
}