'use client';

import { getBezierPath, Position, type ConnectionLineComponentProps } from '@xyflow/react';
import { useAppStore } from '@/app/workflow/store';

/**
 * Custom connection line that renders lines from ALL selected nodes
 * when dragging a connection from a multi-selected node.
 */
export function GroupConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode,
  connectionLineStyle,
}: ConnectionLineComponentProps) {
  const selectedNodes = useAppStore((s) =>
    s.nodes.filter((n) => n.selected && n.type !== 'comment-node'),
  );

  const isMulti =
    selectedNodes.length >= 2 &&
    fromNode &&
    selectedNodes.some((n) => n.id === fromNode.id);

  // Build source points: the dragged handle + every other selected node's handle
  const sources: { x: number; y: number; pos: Position }[] = [
    { x: fromX, y: fromY, pos: fromPosition },
  ];

  if (isMulti && fromNode) {
    for (const node of selectedNodes) {
      if (node.id === fromNode.id) continue;

      const w = node.measured?.width ?? 320;
      const h = node.measured?.height ?? 320;

      const x =
        fromPosition === Position.Right
          ? node.position.x + w
          : node.position.x;
      const y = node.position.y + h / 2;

      sources.push({ x, y, pos: fromPosition });
    }
  }

  return (
    <g>
      {sources.map((from, i) => {
        const [path] = getBezierPath({
          sourceX: from.x,
          sourceY: from.y,
          sourcePosition: from.pos,
          targetX: toX,
          targetY: toY,
          targetPosition: toPosition,
        });
        return (
          <path
            key={i}
            d={path}
            fill="none"
            style={connectionLineStyle}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
}
