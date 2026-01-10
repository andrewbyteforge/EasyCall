// =============================================================================
// FILE: frontend/src/components/nodes/StickyNoteNode.tsx
// =============================================================================
// A sticky note node for annotations on the workflow canvas.
// Supports editable text, multiple colors, and resizing.
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

// =============================================================================
// TYPES
// =============================================================================

export interface StickyNoteData {
    text: string;
    color: string;
    fontSize?: number;
}

// Available sticky note colors
export const STICKY_NOTE_COLORS = [
    { name: 'Yellow', value: '#fef3c7', border: '#f59e0b' },
    { name: 'Pink', value: '#fce7f3', border: '#ec4899' },
    { name: 'Blue', value: '#dbeafe', border: '#3b82f6' },
    { name: 'Green', value: '#d1fae5', border: '#10b981' },
    { name: 'Purple', value: '#ede9fe', border: '#8b5cf6' },
    { name: 'Orange', value: '#ffedd5', border: '#f97316' },
];

// =============================================================================
// COMPONENT
// =============================================================================

const StickyNoteNode: React.FC<NodeProps<StickyNoteData>> = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.text || '');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Find the color config for the current color
    const currentColor = STICKY_NOTE_COLORS.find(c => c.value === data.color) || STICKY_NOTE_COLORS[0];

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    // Handle double-click to edit
    const handleDoubleClick = useCallback(() => {
        setIsEditing(true);
    }, []);

    // Handle blur to save
    const handleBlur = useCallback(() => {
        setIsEditing(false);
        // Update node data through React Flow
        if (data.text !== text) {
            // Dispatch custom event to update node data
            window.dispatchEvent(new CustomEvent('updateNodeData', {
                detail: { nodeId: id, updates: { text } }
            }));
        }
    }, [id, text, data.text]);

    // Handle text change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    }, []);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditing(false);
            setText(data.text || '');
        }
        // Don't propagate to prevent React Flow from handling keys while typing
        e.stopPropagation();
    }, [data.text]);

    // Handle color change
    const handleColorChange = useCallback((newColor: string) => {
        window.dispatchEvent(new CustomEvent('updateNodeData', {
            detail: { nodeId: id, updates: { color: newColor } }
        }));
        setShowColorPicker(false);
    }, [id]);

    // Handle delete
    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Dispatch custom event to delete this node
        window.dispatchEvent(new CustomEvent('deleteNode', {
            detail: { nodeId: id }
        }));
    }, [id]);

    return (
        <>
            {/* Node Resizer - only visible when selected */}
            <NodeResizer
                minWidth={120}
                minHeight={80}
                isVisible={selected}
                lineStyle={{ borderColor: currentColor.border }}
                handleStyle={{ backgroundColor: currentColor.border, width: 8, height: 8 }}
            />

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    minWidth: '120px',
                    minHeight: '80px',
                    backgroundColor: data.color || STICKY_NOTE_COLORS[0].value,
                    borderRadius: '4px',
                    boxShadow: selected
                        ? `0 4px 20px rgba(0,0,0,0.3), 0 0 0 2px ${currentColor.border}`
                        : '0 2px 8px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s ease',
                }}
                onDoubleClick={handleDoubleClick}
            >
                {/* Header with color picker and delete button */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderBottom: `1px solid ${currentColor.border}40`,
                        backgroundColor: `${currentColor.border}15`,
                    }}
                >
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: currentColor.border,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        📝 Note
                    </span>

                    {/* Header buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Color picker button */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowColorPicker(!showColorPicker);
                                }}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    backgroundColor: currentColor.border,
                                    border: '2px solid white',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                }}
                                title="Change color"
                            />

                        {/* Color picker dropdown */}
                        {showColorPicker && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '4px',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                                    display: 'flex',
                                    gap: '6px',
                                    zIndex: 100,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {STICKY_NOTE_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleColorChange(color.value)}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: color.value,
                                            border: data.color === color.value
                                                ? `3px solid ${color.border}`
                                                : '2px solid #ccc',
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s ease',
                                        }}
                                        title={color.name}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        </div>

                        {/* Delete button */}
                        <button
                            onClick={handleDelete}
                            style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                transition: 'all 0.15s ease',
                            }}
                            title="Delete note"
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                                e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content area */}
                <div
                    style={{
                        flex: 1,
                        padding: '8px',
                        overflow: 'auto',
                    }}
                >
                    {isEditing ? (
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                resize: 'none',
                                fontFamily: "'Segoe UI', system-ui, sans-serif",
                                fontSize: data.fontSize || 13,
                                lineHeight: 1.4,
                                color: '#1f2937',
                            }}
                            placeholder="Type your notes here..."
                        />
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                fontFamily: "'Segoe UI', system-ui, sans-serif",
                                fontSize: data.fontSize || 13,
                                lineHeight: 1.4,
                                color: '#1f2937',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                cursor: 'text',
                            }}
                        >
                            {text || (
                                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                    Double-click to add notes...
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Hint when selected */}
                {selected && !isEditing && (
                    <div
                        style={{
                            padding: '4px 8px',
                            backgroundColor: `${currentColor.border}20`,
                            fontSize: '10px',
                            color: currentColor.border,
                            textAlign: 'center',
                        }}
                    >
                        Double-click to edit • Drag corners to resize
                    </div>
                )}
            </div>
        </>
    );
};

export default StickyNoteNode;
