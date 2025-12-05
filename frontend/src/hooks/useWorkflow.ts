// src/hooks/useWorkflow.ts
import { useState, useCallback } from 'react';
import { Node, Edge, Viewport } from 'reactflow';
import { workflowApi, Workflow } from '../api/workflow_api';

export const useWorkflow = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
    const [workflowName, setWorkflowName] = useState<string>('Untitled Workflow');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const saveWorkflow = useCallback(async (name?: string) => {
        setIsSaving(true);
        try {
            const workflowData = {
                name: name || workflowName,
                description: '',
                canvas_data: {
                    nodes,
                    edges,
                    viewport,
                },
            };

            let savedWorkflow: Workflow;

            if (currentWorkflowId) {
                // Update existing workflow
                savedWorkflow = await workflowApi.updateWorkflow(currentWorkflowId, workflowData);
            } else {
                // Create new workflow
                savedWorkflow = await workflowApi.createWorkflow(workflowData);
                setCurrentWorkflowId(savedWorkflow.uuid);
            }

            setWorkflowName(savedWorkflow.name);
            return savedWorkflow;
        } catch (error) {
            console.error('Failed to save workflow:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [nodes, edges, viewport, currentWorkflowId, workflowName]);

    const loadWorkflow = useCallback(async (workflowId: string) => {
        setIsLoading(true);
        try {
            const workflow = await workflowApi.getWorkflow(workflowId);

            setNodes(workflow.canvas_data.nodes || []);
            setEdges(workflow.canvas_data.edges || []);
            setViewport(workflow.canvas_data.viewport || { x: 0, y: 0, zoom: 1 });
            setCurrentWorkflowId(workflow.uuid);
            setWorkflowName(workflow.name);

            return workflow;
        } catch (error) {
            console.error('Failed to load workflow:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const newWorkflow = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setViewport({ x: 0, y: 0, zoom: 1 });
        setCurrentWorkflowId(null);
        setWorkflowName('Untitled Workflow');
    }, []);

    return {
        nodes,
        edges,
        viewport,
        setNodes,
        setEdges,
        setViewport,
        currentWorkflowId,
        workflowName,
        setWorkflowName,
        saveWorkflow,
        loadWorkflow,
        newWorkflow,
        isSaving,
        isLoading,
    };
};