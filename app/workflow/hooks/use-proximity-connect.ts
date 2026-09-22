import { useCallback } from 'react';
import { useReactFlow, useStoreApi } from '@xyflow/react';

/** Max distance (in flow-coordinate px) from a node's bounding box to auto-connect. */
const PROXIMITY_THRESHOLD = 80;

/**
 * Returns the shortest distance from a point to a rectangle's boundary.
 * Returns 0 when the point is inside the rectangle.
 */
function distanceToRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): number {
  const cx = Math.max(rx, Math.min(px, rx + rw));
  const cy = Math.max(ry, Math.min(py, ry + rh));
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Hook that provides proximity-based auto-connect on connection drop.
 *
 * When a user drags a connection line from a handle and releases it near
 * (but not directly on) another node, this hook finds the closest node
 * within `PROXIMITY_THRESHOLD` and returns the connection params so the
 * caller can complete the edge automatically.
 */
export function useProximityConnect() {
  const { screenToFlowPosition } = useReactFlow();
  const store = useStoreApi();

  const getProximityConnection = useCallback(
    (
      screenX: number,
      screenY: number,
      fromNodeId: string,
      fromHandleType: 'source' | 'target',
    ) => {
      const dropPos = screenToFlowPosition({ x: screenX, y: screenY });
      const { nodeLookup } = store.getState();

      let closest: { id: string; distance: number } | null = null;

      for (const [id, node] of nodeLookup) {
        // Skip the node we're dragging from
        if (id === fromNodeId) continue;
        // Skip comment nodes — they're not part of the workflow graph
        if (node.type === 'comment-node') continue;

        const x = node.internals.positionAbsolute.x;
        const y = node.internals.positionAbsolute.y;
        const w = node.measured?.width ?? 260;
        const h = node.measured?.height ?? 50;

        const d = distanceToRect(dropPos.x, dropPos.y, x, y, w, h);

        if (d < PROXIMITY_THRESHOLD && (!closest || d < closest.distance)) {
          closest = { id, distance: d };
        }
      }

      if (!closest) return null;

      // Wire up source→target based on which side the drag originated from
      if (fromHandleType === 'source') {
        return {
          source: fromNodeId,
          sourceHandle: 'output',
          target: closest.id,
          targetHandle: 'input',
        };
      }

      return {
        source: closest.id,
        sourceHandle: 'output',
        target: fromNodeId,
        targetHandle: 'input',
      };
    },
    [screenToFlowPosition, store],
  );

  return { getProximityConnection };
}
