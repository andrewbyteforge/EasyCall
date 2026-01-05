// =============================================================================
// FILE: frontend/src/components/canvas/ClippedEdge.tsx
// =============================================================================
// Custom edge component that supports draggable clips (waypoints) along the path.
// Double-click on the edge to add a clip. Each clip has a red X delete button.
// =============================================================================

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
    EdgeProps,
    getBezierPath,
    EdgeLabelRenderer,
    useReactFlow,
} from 'reactflow';

// =============================================================================
// TYPES
// =============================================================================

export interface ClipPoint {
    id: string;
    x: number;
    y: number;
}

export interface ClippedEdgeData {
    clips?: ClipPoint[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Corner radius for the bends at clip points
 */
const CORNER_RADIUS = 8;

/**
 * Generate a path with sharp bends at each clip point.
 * Uses rounded corners for a polished look while maintaining clear direction changes.
 */
function generateClippedPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    clips: ClipPoint[]
): string {
    // Build ordered points: source -> clips (sorted by distance from source) -> target
    const allPoints = [
        { x: sourceX, y: sourceY },
        ...clips.sort((a, b) => {
            // Sort clips by distance from source for logical path ordering
            const distA = Math.sqrt(Math.pow(a.x - sourceX, 2) + Math.pow(a.y - sourceY, 2));
            const distB = Math.sqrt(Math.pow(b.x - sourceX, 2) + Math.pow(b.y - sourceY, 2));
            return distA - distB;
        }),
        { x: targetX, y: targetY },
    ];

    if (allPoints.length < 2) return '';
    if (allPoints.length === 2) {
        // No clips - straight line
        return `M ${allPoints[0].x} ${allPoints[0].y} L ${allPoints[1].x} ${allPoints[1].y}`;
    }

    // Generate path with sharp bends and rounded corners at each clip
    let path = `M ${allPoints[0].x} ${allPoints[0].y}`;

    for (let i = 1; i < allPoints.length; i++) {
        const prev = allPoints[i - 1];
        const current = allPoints[i];
        const next = allPoints[i + 1];

        if (!next) {
            // Last point - draw line to it
            path += ` L ${current.x} ${current.y}`;
        } else {
            // Calculate vectors
            const v1x = current.x - prev.x;
            const v1y = current.y - prev.y;
            const v2x = next.x - current.x;
            const v2y = next.y - current.y;

            // Calculate lengths
            const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
            const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

            // Use smaller radius if segments are short
            const radius = Math.min(CORNER_RADIUS, len1 / 3, len2 / 3);

            if (radius < 2 || len1 < 4 || len2 < 4) {
                // Too short for rounded corner - use sharp corner
                path += ` L ${current.x} ${current.y}`;
            } else {
                // Normalize vectors
                const n1x = v1x / len1;
                const n1y = v1y / len1;
                const n2x = v2x / len2;
                const n2y = v2y / len2;

                // Calculate points where the curve starts and ends
                const startX = current.x - n1x * radius;
                const startY = current.y - n1y * radius;
                const endX = current.x + n2x * radius;
                const endY = current.y + n2y * radius;

                // Draw line to start of curve, then quadratic curve through corner
                path += ` L ${startX} ${startY}`;
                path += ` Q ${current.x} ${current.y} ${endX} ${endY}`;
            }
        }
    }

    return path;
}

/**
 * Generate an orthogonal (right-angle) path through clips.
 * This creates very pronounced bends with horizontal and vertical segments.
 */
function generateOrthogonalPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    clips: ClipPoint[]
): string {
    // Build ordered points
    const allPoints = [
        { x: sourceX, y: sourceY },
        ...clips.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - sourceX, 2) + Math.pow(a.y - sourceY, 2));
            const distB = Math.sqrt(Math.pow(b.x - sourceX, 2) + Math.pow(b.y - sourceY, 2));
            return distA - distB;
        }),
        { x: targetX, y: targetY },
    ];

    if (allPoints.length < 2) return '';

    let path = `M ${allPoints[0].x} ${allPoints[0].y}`;

    for (let i = 1; i < allPoints.length; i++) {
        const prev = allPoints[i - 1];
        const current = allPoints[i];

        // Create orthogonal path: first horizontal, then vertical
        // This creates very clear 90-degree bends
        const midX = current.x;
        const midY = prev.y;

        // Add rounded corners
        const radius = Math.min(CORNER_RADIUS, Math.abs(current.x - prev.x) / 2, Math.abs(current.y - prev.y) / 2);

        if (radius > 2 && Math.abs(current.x - prev.x) > 4 && Math.abs(current.y - prev.y) > 4) {
            // Determine direction of turn
            const goingRight = current.x > prev.x;
            const goingDown = current.y > prev.y;

            // Horizontal segment
            const hEndX = goingRight ? midX - radius : midX + radius;
            path += ` L ${hEndX} ${midY}`;

            // Rounded corner
            const vStartY = goingDown ? midY + radius : midY - radius;
            path += ` Q ${midX} ${midY} ${midX} ${vStartY}`;

            // Vertical segment to target
            path += ` L ${current.x} ${current.y}`;
        } else {
            // Short segments - just use lines
            path += ` L ${midX} ${midY}`;
            path += ` L ${current.x} ${current.y}`;
        }
    }

    return path;
}

// =============================================================================
// EDGE CLIP COMPONENT
// =============================================================================

interface EdgeClipProps {
    clip: ClipPoint;
    edgeId: string;
    onDelete: (clipId: string) => void;
    onDragStart: (clipId: string, e: React.MouseEvent) => void;
}

const EdgeClip: React.FC<EdgeClipProps> = ({ clip, edgeId, onDelete, onDragStart }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${clip.x}px, ${clip.y}px)`,
                pointerEvents: 'all',
                zIndex: 1000,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Delete button - always visible, positioned to top-right */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(clip.id);
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '-12px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: isHovered ? '#dc2626' : '#ef4444',
                    color: 'white',
                    border: '2px solid #ffffff',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 8px rgba(239, 68, 68, 0.6)',
                    transition: 'all 0.15s ease',
                    padding: 0,
                    lineHeight: 1,
                    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                    zIndex: 1001,
                }}
                title="Remove clip"
            >
                ×
            </button>

            {/* Main clip circle */}
            <div
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onDragStart(clip.id, e);
                }}
                style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: isHovered ? '#667eea' : 'rgba(102, 126, 234, 0.9)',
                    border: '2px solid #ffffff',
                    borderRadius: '50%',
                    cursor: 'grab',
                    boxShadow: isHovered
                        ? '0 0 12px rgba(102, 126, 234, 0.8), 0 2px 8px rgba(0,0,0,0.4)'
                        : '0 2px 6px rgba(0,0,0,0.4), 0 0 6px rgba(102, 126, 234, 0.5)',
                    transition: 'all 0.15s ease',
                    transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
            />
        </div>
    );
};

// =============================================================================
// CLIPPED EDGE COMPONENT
// =============================================================================

const ClippedEdge: React.FC<EdgeProps<ClippedEdgeData>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) => {
    const { setEdges, getZoom } = useReactFlow();
    const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
    const pathRef = useRef<SVGPathElement>(null);

    const clips = data?.clips || [];

    // ---------------------------------------------------------------------------
    // ADD CLIP ON DOUBLE-CLICK
    // ---------------------------------------------------------------------------

    const handleDoubleClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();

        // Get the position relative to the React Flow viewport
        const svg = (event.target as Element).closest('svg');
        if (!svg) return;

        const svgRect = svg.getBoundingClientRect();
        const zoom = getZoom();

        // Get the viewBox to account for panning
        const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 0, 0];
        const [vbX, vbY] = viewBox;

        // Calculate position in flow coordinates
        const x = (event.clientX - svgRect.left) / zoom + vbX;
        const y = (event.clientY - svgRect.top) / zoom + vbY;

        // Create new clip
        const newClip: ClipPoint = {
            id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x,
            y,
        };

        // Update edge data with new clip
        setEdges((eds) =>
            eds.map((edge) => {
                if (edge.id === id) {
                    const existingClips = (edge.data as ClippedEdgeData)?.clips || [];
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            clips: [...existingClips, newClip],
                        },
                    };
                }
                return edge;
            })
        );

        console.log('[EDGE CLIP] Added clip at', { x, y });
    }, [id, setEdges, getZoom]);

    // ---------------------------------------------------------------------------
    // DELETE CLIP
    // ---------------------------------------------------------------------------

    const handleDeleteClip = useCallback((clipId: string) => {
        setEdges((eds) =>
            eds.map((edge) => {
                if (edge.id === id) {
                    const existingClips = (edge.data as ClippedEdgeData)?.clips || [];
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            clips: existingClips.filter((c) => c.id !== clipId),
                        },
                    };
                }
                return edge;
            })
        );
        console.log('[EDGE CLIP] Deleted clip', clipId);
    }, [id, setEdges]);

    // ---------------------------------------------------------------------------
    // DRAG CLIP
    // ---------------------------------------------------------------------------

    const handleDragStart = useCallback((clipId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDraggingClipId(clipId);
    }, []);

    useEffect(() => {
        if (!draggingClipId) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Find the SVG element
            const svg = document.querySelector('.react-flow__edges');
            if (!svg) return;

            const svgElement = svg.closest('svg');
            if (!svgElement) return;

            const svgRect = svgElement.getBoundingClientRect();
            const zoom = getZoom();

            // Get viewBox for panning offset
            const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 0, 0];
            const [vbX, vbY] = viewBox;

            // Calculate new position
            const x = (e.clientX - svgRect.left) / zoom + vbX;
            const y = (e.clientY - svgRect.top) / zoom + vbY;

            // Update clip position
            setEdges((eds) =>
                eds.map((edge) => {
                    if (edge.id === id) {
                        const existingClips = (edge.data as ClippedEdgeData)?.clips || [];
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                clips: existingClips.map((c) =>
                                    c.id === draggingClipId ? { ...c, x, y } : c
                                ),
                            },
                        };
                    }
                    return edge;
                })
            );
        };

        const handleMouseUp = () => {
            setDraggingClipId(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingClipId, id, setEdges, getZoom]);

    // ---------------------------------------------------------------------------
    // GENERATE PATH
    // ---------------------------------------------------------------------------

    let edgePath: string;

    if (clips.length === 0) {
        // No clips - use default bezier path
        [edgePath] = getBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        });
    } else {
        // Has clips - generate custom path through clips
        edgePath = generateClippedPath(sourceX, sourceY, targetX, targetY, clips);
    }

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <>
            {/* Invisible wider path for easier double-click detection */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                onDoubleClick={handleDoubleClick}
                style={{ cursor: 'crosshair' }}
            />

            {/* Visible edge path */}
            <path
                ref={pathRef}
                id={id}
                d={edgePath}
                fill="none"
                stroke={style.stroke || '#667eea'}
                strokeWidth={style.strokeWidth || 2}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    pointerEvents: 'none',
                }}
                className="react-flow__edge-path animated"
            />

            {/* Render clips */}
            <EdgeLabelRenderer>
                {clips.map((clip) => (
                    <EdgeClip
                        key={clip.id}
                        clip={clip}
                        edgeId={id}
                        onDelete={handleDeleteClip}
                        onDragStart={handleDragStart}
                    />
                ))}
            </EdgeLabelRenderer>
        </>
    );
};

export default ClippedEdge;
