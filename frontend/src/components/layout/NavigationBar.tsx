// =============================================================================
// FILE: frontend/src/components/layout/NavigationBar.tsx
// =============================================================================
// Top navigation bar with workflow controls.
// Contains Save, Load, New, Run buttons and settings access.
// =============================================================================

import React from 'react';
import {
    AppBar,
    Toolbar,
    Box,
    Button,
    IconButton,
    Tooltip,
    Typography,
    Divider,
} from '@mui/material';
import {
    Save as SaveIcon,
    FolderOpen as LoadIcon,
    PlayArrow as RunIcon,
    NoteAdd as NewIcon,
    Settings as SettingsIcon,
    Visibility as ShowOutputIcon,
    VisibilityOff as HideOutputIcon,
    AutoFixHigh as TestIcon, // NEW: Test/Example nodes icon
} from '@mui/icons-material';

// =============================================================================
// TYPES
// =============================================================================

interface NavigationBarProps {
    /**
     * Handler for saving the current workflow
     */
    onSave: () => void;

    /**
     * Handler for loading a workflow
     */
    onLoad: () => void;

    /**
     * Handler for creating a new workflow
     */
    onNew: () => void;

    /**
     * Handler for running/executing the workflow
     */
    onRun: () => void;

    /**
     * Handler for opening settings dialog
     */
    onSettings: () => void;

    /**
     * Handler for toggling output panel visibility
     */
    onToggleOutput: () => void;

    /**
     * Whether the output panel is currently visible
     */
    outputPanelVisible: boolean;

    /**
     * Handler for creating example nodes (testing/development)
     */
    onTest?: () => void;

    /**
     * Optional: Current workflow name to display
     */
    workflowName?: string;

    /**
     * Optional: Disable run button if workflow is invalid
     */
    canRun?: boolean;

    /**
     * Optional: Disable save button if no changes
     */
    hasUnsavedChanges?: boolean;

    isSaving: boolean;

    isLoading: boolean;
}

// =============================================================================
// NAVIGATION BAR COMPONENT
// =============================================================================

const NavigationBar: React.FC<NavigationBarProps> = ({
    onSave,
    onLoad,
    onNew,
    onRun,
    onSettings,
    onToggleOutput,
    outputPanelVisible,
    onTest, // NEW: Test button handler
    workflowName = 'Untitled Workflow',
    canRun = true,
    hasUnsavedChanges = false,
}) => {
    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                backgroundColor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            <Toolbar
                sx={{
                    minHeight: '64px !important',
                    padding: '0 16px !important',
                }}
            >
                {/* ================================================================= */}
                {/* LEFT SECTION - App Title & Workflow Name */}
                {/* ================================================================= */}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {/* App Icon & Title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                fontSize: '1.5rem',
                                lineHeight: 1,
                            }}
                        >
                            🔗
                        </Box>
                        <Typography
                            variant="h6"
                            component="h1"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                fontSize: '1.1rem',
                            }}
                        >
                            EasyCall
                        </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    {/* Current Workflow Name */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                        }}
                    >
                        {workflowName}
                        {hasUnsavedChanges && (
                            <Box
                                component="span"
                                sx={{
                                    ml: 1,
                                    color: 'warning.main',
                                    fontSize: '0.75rem',
                                }}
                            >
                                • Unsaved
                            </Box>
                        )}
                    </Typography>
                </Box>

                {/* ================================================================= */}
                {/* CENTER SECTION - Primary Actions */}
                {/* ================================================================= */}

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* New Workflow Button */}
                    <Tooltip title="Create new workflow (Ctrl+N)" arrow>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<NewIcon />}
                            onClick={onNew}
                            sx={{
                                textTransform: 'none',
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        >
                            New
                        </Button>
                    </Tooltip>

                    {/* ============================================================= */}
                    {/* TEST BUTTON - Create Example Nodes (Development/Testing) */}
                    {/* ============================================================= */}
                    {onTest && (
                        <Tooltip title="Create UE5-style example nodes (Test)" arrow>
                            <IconButton
                                size="small"
                                onClick={onTest}
                                sx={{
                                    color: 'secondary.main',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                }}
                            >
                                <TestIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Load Workflow Button */}
                    <Tooltip title="Load workflow (Ctrl+O)" arrow>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LoadIcon />}
                            onClick={onLoad}
                            sx={{
                                textTransform: 'none',
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        >
                            Load
                        </Button>
                    </Tooltip>

                    {/* Save Workflow Button */}
                    <Tooltip title="Save workflow (Ctrl+S)" arrow>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={onSave}
                            disabled={!hasUnsavedChanges}
                            sx={{
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            Save
                        </Button>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    {/* Run Workflow Button */}
                    <Tooltip
                        title={
                            canRun
                                ? 'Execute workflow (F5)'
                                : 'Add nodes to canvas before running'
                        }
                        arrow
                    >
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<RunIcon />}
                                onClick={onRun}
                                disabled={!canRun}
                                color="success"
                                sx={{
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: 'none',
                                    },
                                }}
                            >
                                Run
                            </Button>
                        </span>
                    </Tooltip>
                </Box>

                {/* ================================================================= */}
                {/* RIGHT SECTION - View & Settings */}
                {/* ================================================================= */}

                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    {/* Toggle Output Panel Button */}
                    <Tooltip
                        title={outputPanelVisible ? 'Hide output panel' : 'Show output panel'}
                        arrow
                    >
                        <IconButton
                            size="small"
                            onClick={onToggleOutput}
                            sx={{
                                color: outputPanelVisible ? 'secondary.main' : 'text.secondary',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        >
                            {outputPanelVisible ? <HideOutputIcon /> : <ShowOutputIcon />}
                        </IconButton>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem />

                    {/* Settings Button */}
                    <Tooltip title="Application settings" arrow>
                        <IconButton
                            size="small"
                            onClick={onSettings}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default NavigationBar;