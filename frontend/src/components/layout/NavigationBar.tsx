// src/components/layout/NavigationBar.tsx
import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Save as SaveIcon,
    FolderOpen as FolderOpenIcon,
    PlayArrow as PlayArrowIcon,
    Settings as SettingsIcon,
    Terminal as TerminalIcon,
} from '@mui/icons-material';
import { workflowApi } from '../../api/workflow_api';

interface NavigationBarProps {
    workflow: any; // Will be properly typed later
    onToggleOutput: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ workflow, onToggleOutput }) => {
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const [workflowName, setWorkflowName] = useState(workflow.workflowName);
    const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);

    const handleSave = async () => {
        try {
            await workflow.saveWorkflow(workflowName);
            setSaveDialogOpen(false);
            alert(`Workflow "${workflowName}" saved successfully!`);
        } catch (error) {
            alert('Failed to save workflow');
            console.error(error);
        }
    };

    const handleOpenLoadDialog = async () => {
        try {
            const workflows = await workflowApi.listWorkflows();
            setAvailableWorkflows(workflows);
            setLoadDialogOpen(true);
        } catch (error) {
            alert('Failed to load workflows');
            console.error(error);
        }
    };

    const handleLoad = async (workflowId: string) => {
        try {
            await workflow.loadWorkflow(workflowId);
            setLoadDialogOpen(false);
            alert('Workflow loaded successfully!');
        } catch (error) {
            alert('Failed to load workflow');
            console.error(error);
        }
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
                        📊 Blockchain Intelligence Workflow Builder
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            color="inherit"
                            startIcon={<AddIcon />}
                            onClick={workflow.newWorkflow}
                        >
                            New
                        </Button>

                        <Button
                            color="inherit"
                            startIcon={<FolderOpenIcon />}
                            onClick={handleOpenLoadDialog}
                        >
                            Load
                        </Button>

                        <Button
                            color="inherit"
                            startIcon={<SaveIcon />}
                            onClick={() => setSaveDialogOpen(true)}
                        >
                            Save
                        </Button>

                        <Button
                            color="inherit"
                            startIcon={<PlayArrowIcon />}
                            disabled
                        >
                            Run
                        </Button>

                        <Button
                            color="inherit"
                            startIcon={<SettingsIcon />}
                            disabled
                        >
                            Settings
                        </Button>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton color="inherit" onClick={onToggleOutput}>
                        <TerminalIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Save Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                <DialogTitle>Save Workflow</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Workflow Name"
                        fullWidth
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Load Dialog */}
            <Dialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)}>
                <DialogTitle>Load Workflow</DialogTitle>
                <DialogContent sx={{ minWidth: 400 }}>
                    <List>
                        {availableWorkflows.length === 0 ? (
                            <ListItem>
                                <ListItemText primary="No saved workflows" />
                            </ListItem>
                        ) : (
                            availableWorkflows.map((wf) => (
                                <ListItemButton
                                    key={wf.uuid}
                                    onClick={() => handleLoad(wf.uuid)}
                                >
                                    <ListItemText
                                        primary={wf.name}
                                        secondary={`${wf.node_count} nodes • Updated: ${new Date(
                                            wf.updated_at
                                        ).toLocaleDateString()}`}
                                    />
                                </ListItemButton>
                            ))
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLoadDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default NavigationBar;