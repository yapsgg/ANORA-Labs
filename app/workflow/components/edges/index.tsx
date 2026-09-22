import { type Edge, type EdgeTypes } from '@xyflow/react';
import { nanoid } from 'nanoid';

export type AppEdge = Edge;

export const edgeTypes: EdgeTypes = {};

export const createEdge = (
  source: string,
  target: string,
  sourceHandleId?: string | null,
  targetHandleId?: string | null,
): AppEdge => ({
  id: `edge-${nanoid()}`,
  source,
  target,
  sourceHandle: sourceHandleId,
  targetHandle: targetHandleId,
});
