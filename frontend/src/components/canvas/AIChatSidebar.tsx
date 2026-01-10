// =============================================================================
// FILE: frontend/src/components/canvas/AIChatSidebar.tsx
// =============================================================================
// AI Chat Sidebar for generating workflows from natural language.
// Supports multiple AI providers (Anthropic, OpenAI, Ollama) with model selection.
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import apiClient from '../../api/api_client';

// =============================================================================
// TYPES
// =============================================================================

export interface AIProvider {
    id: string;
    name: string;
    models: AIModel[];
    requiresApiKey: boolean;
    isOffline: boolean;
}

export interface AIModel {
    id: string;
    name: string;
    description?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    workflowData?: {
        nodes: Node[];
        edges: Edge[];
    };
    isLoading?: boolean;
    error?: string;
}

export interface AIChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyWorkflow: (nodes: Node[], edges: Edge[]) => void;
    existingNodes: Node[];
    existingEdges: Edge[];
}

// =============================================================================
// AI PROVIDER CONFIGURATIONS
// =============================================================================

const AI_PROVIDERS: AIProvider[] = [
    {
        id: 'anthropic',
        name: 'Anthropic',
        requiresApiKey: true,
        isOffline: false,
        models: [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Latest balanced model' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Fast and capable' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest' },
        ],
    },
    {
        id: 'openai',
        name: 'OpenAI',
        requiresApiKey: true,
        isOffline: false,
        models: [
            { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest multimodal (Recommended)' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast GPT-4' },
            { id: 'gpt-4', name: 'GPT-4', description: 'Most capable' },
        ],
    },
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        requiresApiKey: false,
        isOffline: true,
        models: [
            { id: 'llama3', name: 'Llama 3', description: 'Meta\'s latest' },
            { id: 'llama3:70b', name: 'Llama 3 70B', description: 'Larger Llama 3' },
            { id: 'mistral', name: 'Mistral 7B', description: 'Fast and efficient' },
            { id: 'mixtral', name: 'Mixtral 8x7B', description: 'MoE model' },
            { id: 'codellama', name: 'Code Llama', description: 'Code specialized' },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Coding focused' },
        ],
    },
];

// =============================================================================
// LOCAL STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
    PROVIDER: 'easycall_ai_provider',
    MODEL: 'easycall_ai_model',
    // API keys are stored per-provider for security
    API_KEY_PREFIX: 'easycall_ai_api_key_',
    OFFLINE_ENDPOINT: 'easycall_ai_offline_endpoint',
    CHAT_HISTORY: 'easycall_ai_chat_history',
};

// Helper to get provider-specific API key storage key
const getApiKeyStorageKey = (providerId: string) => `${STORAGE_KEYS.API_KEY_PREFIX}${providerId}`;

// =============================================================================
// COMPONENT
// =============================================================================

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
    isOpen,
    onClose,
    onApplyWorkflow,
    existingNodes,
    existingEdges,
}) => {
    // ---------------------------------------------------------------------------
    // STATE - Settings
    // ---------------------------------------------------------------------------
    const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'anthropic';
    });
    const [selectedModelId, setSelectedModelId] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.MODEL) || 'claude-sonnet-4-20250514';
    });
    // API key is loaded per-provider in useEffect below
    const [apiKey, setApiKey] = useState<string>('');
    const [offlineEndpoint, setOfflineEndpoint] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.OFFLINE_ENDPOINT) || 'http://localhost:11434';
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [settingsExpanded, setSettingsExpanded] = useState(true);

    // ---------------------------------------------------------------------------
    // STATE - Chat
    // ---------------------------------------------------------------------------
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ---------------------------------------------------------------------------
    // COMPUTED
    // ---------------------------------------------------------------------------
    const selectedProvider = AI_PROVIDERS.find(p => p.id === selectedProviderId) || AI_PROVIDERS[0];
    const selectedModel = selectedProvider.models.find(m => m.id === selectedModelId) || selectedProvider.models[0];

    // ---------------------------------------------------------------------------
    // EFFECTS - Persist settings
    // ---------------------------------------------------------------------------
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.PROVIDER, selectedProviderId);
        // Load the API key for the newly selected provider
        const savedApiKey = localStorage.getItem(getApiKeyStorageKey(selectedProviderId)) || '';
        setApiKey(savedApiKey);
    }, [selectedProviderId]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.MODEL, selectedModelId);
    }, [selectedModelId]);

    // Save API key per-provider when it changes
    useEffect(() => {
        if (selectedProviderId) {
            localStorage.setItem(getApiKeyStorageKey(selectedProviderId), apiKey);
        }
    }, [apiKey, selectedProviderId]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_ENDPOINT, offlineEndpoint);
    }, [offlineEndpoint]);

    // Load initial API key for the default provider on mount
    useEffect(() => {
        const initialProvider = localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'anthropic';
        const savedApiKey = localStorage.getItem(getApiKeyStorageKey(initialProvider)) || '';
        setApiKey(savedApiKey);
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input when sidebar opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // ---------------------------------------------------------------------------
    // HANDLERS - Provider/Model selection
    // ---------------------------------------------------------------------------
    const handleProviderChange = useCallback((providerId: string) => {
        setSelectedProviderId(providerId);
        const provider = AI_PROVIDERS.find(p => p.id === providerId);
        if (provider && provider.models.length > 0) {
            setSelectedModelId(provider.models[0].id);
        }
    }, []);

    // ---------------------------------------------------------------------------
    // HANDLERS - Send message
    // ---------------------------------------------------------------------------
    const sendMessage = useCallback(async () => {
        if (!inputValue.trim() || isGenerating) return;

        // Validate API key for online providers
        if (selectedProvider.requiresApiKey && !apiKey.trim()) {
            alert('Please enter an API key for ' + selectedProvider.name);
            return;
        }

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        const loadingMessage: ChatMessage = {
            id: `msg_${Date.now()}_loading`,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages(prev => [...prev, userMessage, loadingMessage]);
        setInputValue('');
        setIsGenerating(true);

        try {
            // Build conversation history for context
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            // Call backend API using apiClient with extended timeout for AI calls
            const response = await apiClient.post('/ai/generate-workflow/', {
                prompt: inputValue.trim(),
                provider: selectedProviderId,
                model: selectedModelId,
                api_key: apiKey,
                offline_endpoint: selectedProvider.isOffline ? offlineEndpoint : null,
                conversation_history: conversationHistory,
                existing_nodes: existingNodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    data: n.data,
                })),
                existing_edges: existingEdges.map(e => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                    targetHandle: e.targetHandle,
                })),
            }, {
                timeout: 120000, // 2 minute timeout for AI API calls
            });

            const data = response.data;

            // Update the loading message with the response
            const assistantMessage: ChatMessage = {
                id: loadingMessage.id,
                role: 'assistant',
                content: data.message || 'Here\'s the workflow I generated:',
                timestamp: new Date(),
                workflowData: data.workflow ? {
                    nodes: data.workflow.nodes || [],
                    edges: data.workflow.edges || [],
                } : undefined,
            };

            setMessages(prev => prev.map(m =>
                m.id === loadingMessage.id ? assistantMessage : m
            ));

        } catch (error: any) {
            console.error('[AI CHAT] Error:', error);

            // Extract error message from axios error or regular error
            let errorMsg = 'Unknown error';
            if (error.response?.data?.error) {
                // Django API error response
                errorMsg = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.message) {
                errorMsg = error.message;
            }

            // Update loading message with error
            const errorMessage: ChatMessage = {
                id: loadingMessage.id,
                role: 'assistant',
                content: 'Sorry, I encountered an error while generating the workflow.',
                timestamp: new Date(),
                error: errorMsg,
            };

            setMessages(prev => prev.map(m =>
                m.id === loadingMessage.id ? errorMessage : m
            ));
        } finally {
            setIsGenerating(false);
        }
    }, [inputValue, isGenerating, selectedProvider, selectedProviderId, selectedModelId, apiKey, offlineEndpoint, messages, existingNodes, existingEdges]);

    // ---------------------------------------------------------------------------
    // HANDLERS - Apply workflow to canvas
    // ---------------------------------------------------------------------------
    const handleApplyWorkflow = useCallback((workflowData: { nodes: Node[]; edges: Edge[] }) => {
        onApplyWorkflow(workflowData.nodes, workflowData.edges);
    }, [onApplyWorkflow]);

    // ---------------------------------------------------------------------------
    // HANDLERS - Clear chat
    // ---------------------------------------------------------------------------
    const clearChat = useCallback(() => {
        setMessages([]);
    }, []);

    // ---------------------------------------------------------------------------
    // HANDLERS - Keyboard
    // ---------------------------------------------------------------------------
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }, [sendMessage]);

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '380px',
                backgroundColor: 'rgba(5, 10, 30, 0.98)',
                borderLeft: '1px solid rgba(102, 126, 234, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🤖</span>
                    <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>
                        AI Workflow Assistant
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#a0aec0',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Close"
                >
                    ✕
                </button>
            </div>

            {/* Settings Section */}
            <div
                style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                {/* Settings Header */}
                <div
                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                    style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                >
                    <span style={{ color: '#a0aec0', fontSize: '12px', fontWeight: 600 }}>
                        ⚙️ Settings
                    </span>
                    <span style={{ color: '#a0aec0', fontSize: '12px' }}>
                        {settingsExpanded ? '▲' : '▼'}
                    </span>
                </div>

                {/* Settings Content */}
                {settingsExpanded && (
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Provider Selection */}
                        <div>
                            <label style={{ display: 'block', color: '#a0aec0', fontSize: '11px', marginBottom: '4px', fontWeight: 500 }}>
                                Provider
                            </label>
                            <select
                                value={selectedProviderId}
                                onChange={(e) => handleProviderChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {AI_PROVIDERS.map(provider => (
                                    <option key={provider.id} value={provider.id} style={{ backgroundColor: '#1a1f36' }}>
                                        {provider.name} {provider.isOffline ? '(Offline)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Model Selection */}
                        <div>
                            <label style={{ display: 'block', color: '#a0aec0', fontSize: '11px', marginBottom: '4px', fontWeight: 500 }}>
                                Model
                            </label>
                            <select
                                value={selectedModelId}
                                onChange={(e) => setSelectedModelId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {selectedProvider.models.map(model => (
                                    <option key={model.id} value={model.id} style={{ backgroundColor: '#1a1f36' }}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                            {selectedModel.description && (
                                <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '4px' }}>
                                    {selectedModel.description}
                                </div>
                            )}
                        </div>

                        {/* API Key (for online providers) */}
                        {selectedProvider.requiresApiKey && (
                            <div>
                                <label style={{ display: 'block', color: '#a0aec0', fontSize: '11px', marginBottom: '4px', fontWeight: 500 }}>
                                    API Key
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={`Enter your ${selectedProvider.name} API key`}
                                        style={{
                                            width: '100%',
                                            padding: '8px 36px 8px 10px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${apiKey ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                            borderRadius: '8px',
                                            color: '#ffffff',
                                            fontSize: '13px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#a0aec0',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                        }}
                                        title={showApiKey ? 'Hide' : 'Show'}
                                    >
                                        {showApiKey ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Offline Endpoint (for Ollama) */}
                        {selectedProvider.isOffline && (
                            <div>
                                <label style={{ display: 'block', color: '#a0aec0', fontSize: '11px', marginBottom: '4px', fontWeight: 500 }}>
                                    Ollama Endpoint
                                </label>
                                <input
                                    type="text"
                                    value={offlineEndpoint}
                                    onChange={(e) => setOfflineEndpoint(e.target.value)}
                                    placeholder="http://localhost:11434"
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        )}

                        {/* Status Indicator */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px',
                                backgroundColor: selectedProvider.isOffline
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : apiKey
                                        ? 'rgba(102, 126, 234, 0.1)'
                                        : 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '6px',
                                border: `1px solid ${selectedProvider.isOffline
                                    ? 'rgba(16, 185, 129, 0.3)'
                                    : apiKey
                                        ? 'rgba(102, 126, 234, 0.3)'
                                        : 'rgba(245, 158, 11, 0.3)'}`,
                            }}
                        >
                            <span style={{ fontSize: '12px' }}>
                                {selectedProvider.isOffline ? '🟢' : apiKey ? '🔑' : '⚠️'}
                            </span>
                            <span style={{
                                fontSize: '11px',
                                color: selectedProvider.isOffline
                                    ? '#10b981'
                                    : apiKey
                                        ? '#667eea'
                                        : '#f59e0b',
                            }}>
                                {selectedProvider.isOffline
                                    ? 'Offline mode - using local model'
                                    : apiKey
                                        ? `Ready - using ${selectedProvider.name}`
                                        : 'API key required'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🧠</div>
                        <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                            Describe your workflow
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>
                            Tell me what you want to achieve and I'll create the nodes and connections for you.
                        </div>
                        <div style={{
                            marginTop: '20px',
                            padding: '12px',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                        }}>
                            <div style={{ color: '#667eea', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
                                💡 Example prompts:
                            </div>
                            <div style={{ color: '#a0aec0', fontSize: '11px', lineHeight: 1.6 }}>
                                "Create a workflow to check a Bitcoin address using Chainalysis and export to Excel"
                                <br /><br />
                                "Add a TRM Labs exposure check to my workflow"
                                <br /><br />
                                "I need to analyze transaction counterparties and save results as JSON"
                            </div>
                        </div>
                    </div>
                ) : (
                    messages.map(message => (
                        <div
                            key={message.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: '90%',
                                    padding: '10px 14px',
                                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    backgroundColor: message.role === 'user'
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    background: message.role === 'user'
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    border: message.role === 'user'
                                        ? 'none'
                                        : '1px solid rgba(255, 255, 255, 0.08)',
                                }}
                            >
                                {message.isLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: '#667eea',
                                            animation: 'pulse 1s infinite',
                                        }} />
                                        <span style={{ color: '#a0aec0', fontSize: '13px' }}>
                                            Generating workflow...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            color: message.role === 'user' ? '#ffffff' : '#e5e7eb',
                                            fontSize: '13px',
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-wrap',
                                        }}>
                                            {message.content}
                                        </div>

                                        {message.error && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444',
                                                fontSize: '11px',
                                            }}>
                                                Error: {message.error}
                                            </div>
                                        )}

                                        {message.workflowData && message.workflowData.nodes.length > 0 && (
                                            <div style={{ marginTop: '12px' }}>
                                                <div style={{
                                                    padding: '10px',
                                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(102, 126, 234, 0.3)',
                                                    marginBottom: '8px',
                                                }}>
                                                    <div style={{ color: '#667eea', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                                                        📦 Generated Workflow:
                                                    </div>
                                                    <div style={{ color: '#a0aec0', fontSize: '11px' }}>
                                                        {message.workflowData.nodes.length} nodes, {message.workflowData.edges.length} connections
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleApplyWorkflow(message.workflowData!)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: '#ffffff',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                    }}
                                                >
                                                    ✨ Apply to Canvas
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div style={{
                                color: '#6b7280',
                                fontSize: '10px',
                                marginTop: '4px',
                                paddingLeft: '4px',
                                paddingRight: '4px',
                            }}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Clear Chat Button */}
            {messages.length > 0 && (
                <div style={{ padding: '0 16px' }}>
                    <button
                        onClick={clearChat}
                        style={{
                            width: '100%',
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#6b7280',
                            fontSize: '11px',
                            cursor: 'pointer',
                        }}
                    >
                        🗑️ Clear conversation
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div
                style={{
                    padding: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-end',
                }}>
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your workflow..."
                        disabled={isGenerating}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            resize: 'none',
                            minHeight: '44px',
                            maxHeight: '120px',
                            fontFamily: 'inherit',
                        }}
                        rows={1}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isGenerating}
                        style={{
                            width: '44px',
                            height: '44px',
                            background: inputValue.trim() && !isGenerating
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            borderRadius: '12px',
                            color: inputValue.trim() && !isGenerating ? '#ffffff' : '#6b7280',
                            fontSize: '18px',
                            cursor: inputValue.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                        title="Send"
                    >
                        {isGenerating ? '⏳' : '➤'}
                    </button>
                </div>
                <div style={{
                    color: '#6b7280',
                    fontSize: '10px',
                    marginTop: '8px',
                    textAlign: 'center',
                }}>
                    Press Enter to send, Shift+Enter for new line
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default AIChatSidebar;
