'use client';

import { useCallback } from 'react';
import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  useStore,
  type ReactFlowState,
} from '@xyflow/react';

export function AnimatedEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = useStore(
    useCallback(
      (s: ReactFlowState) => {
        const node = s.nodeLookup.get(source);
        return (node?.internals?.userNode?.data as Record<string, unknown>)
          ?.status === 'loading';
      },
      [source],
    ),
  );

  return (
    <>
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={6}
          strokeOpacity={0.3}
          className="animate-pulse"
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isActive ? undefined : undefined,
          strokeWidth: isActive ? 2 : 1.5,
        }}
      />
      {isActive && (
        <circle r={4} fill="#DCDCDC" opacity={0.8}>
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </>
  );
}
