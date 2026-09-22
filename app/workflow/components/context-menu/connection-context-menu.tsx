'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useReactFlow, getBezierPath, Position } from '@xyflow/react';

import { useAppStore } from '@/app/workflow/store';
import { nodesConfig } from '@/app/workflow/config';
import { createNodeByType, type WorkflowNodeType } from '@/app/workflow/components/nodes';
import { createEdge } from '@/app/workflow/components/edges';
import {
  NODE_SHORTCUTS,
  matchesShortcut,
  SHORTCUT_ESCAPE,
} from '@/lib/shortcuts';
import { BlockPicker, type BlockPickerNode } from './block-picker';

export interface ConnectionDropState {
  // Screen position where the connection was dropped
  position: { x: number; y: number };
  // The node ID where the connection started
  fromNodeId: string;
  // The handle ID where the connection started
  fromHandleId: string | null;
  // Whether the connection started from a source (output) or target (input)
  handleType: 'source' | 'target';
  // Screen position of the source handle (for phantom connection line)
  fromHandlePosition: { x: number; y: number } | null;
}

interface ConnectionContextMenuProps {
  connectionDrop: ConnectionDropState;
  onClose: () => void;
  takeSnapshot: () => void;
}

export function ConnectionContextMenu({
  connectionDrop,
  onClose,
  takeSnapshot,
}: ConnectionContextMenuProps) {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useAppStore((s) => s.addNode);
  const addStoreEdge = useAppStore((s) => s.addEdge);
  const storeNodes = useAppStore((s) => s.nodes);
  const ref = useRef<HTMLDivElement>(null);

  // Normalize the source handle ID (plus-handle → standard)
  const normalizedFromHandle = connectionDrop.fromHandleId === 'plus-output'
    ? 'output'
    : connectionDrop.fromHandleId === 'plus-input'
      ? 'input'
      : connectionDrop.fromHandleId;

  // All selected non-comment nodes that should participate in fan-out
  const selectedSourceIds = useMemo(() => {
    const selected = storeNodes.filter(
      (n) => n.selected && n.type !== 'comment-node',
    );
    if (selected.length >= 2 && selected.some((n) => n.id === connectionDrop.fromNodeId)) {
      return selected.map((n) => n.id);
    }
    return [connectionDrop.fromNodeId];
  }, [storeNodes, connectionDrop.fromNodeId]);

  // Build list of existing connectable nodes (exclude selected sources + comment nodes)
  const existingNodes: BlockPickerNode[] = storeNodes
    .filter((n) => !selectedSourceIds.includes(n.id) && n.type !== 'comment-node')
    .map((n) => {
      const data = n.data as { label?: string; title?: string };
      return {
        id: n.id,
        label: data.label || data.title || 'Untitled',
        type: n.type as string,
      };
    });

  // Helper: create edges from all selected source nodes
  const connectAll = useCallback(
    (targetNodeId: string, targetHandleId: string) => {
      for (const sourceId of selectedSourceIds) {
        if (connectionDrop.handleType === 'source') {
          addStoreEdge(createEdge(sourceId, targetNodeId, 'output', targetHandleId));
        } else {
          addStoreEdge(createEdge(targetNodeId, sourceId, targetHandleId, 'input'));
        }
      }
    },
    [selectedSourceIds, connectionDrop.handleType, addStoreEdge],
  );

  // Create a NEW node and connect
  const onAddNode = useCallback(
    (type: string) => {
      takeSnapshot();

      const flowPosition = screenToFlowPosition(connectionDrop.position);
      const newNode = createNodeByType({ type: type as WorkflowNodeType, position: flowPosition });
      addNode(newNode);

      const newNodeConfig = nodesConfig[type as WorkflowNodeType];

      if (connectionDrop.handleType === 'source') {
        const targetHandle = newNodeConfig.handles.find((h) => h.type === 'target');
        if (targetHandle?.id) connectAll(newNode.id, targetHandle.id);
      } else {
        const sourceHandle = newNodeConfig.handles.find((h) => h.type === 'source');
        if (sourceHandle?.id) connectAll(newNode.id, sourceHandle.id);
      }

      onClose();
    },
    [connectionDrop, screenToFlowPosition, addNode, connectAll, onClose, takeSnapshot],
  );

  // Connect to an EXISTING node
  const onSelectExistingNode = useCallback(
    (nodeId: string) => {
      takeSnapshot();

      const targetNode = storeNodes.find((n) => n.id === nodeId);
      if (!targetNode) return;

      const targetConfig = nodesConfig[targetNode.type as WorkflowNodeType];
      if (!targetConfig) return;

      if (connectionDrop.handleType === 'source') {
        const targetHandle = targetConfig.handles.find((h) => h.type === 'target');
        if (targetHandle?.id) connectAll(nodeId, targetHandle.id);
      } else {
        const sourceHandle = targetConfig.handles.find((h) => h.type === 'source');
        if (sourceHandle?.id) connectAll(nodeId, sourceHandle.id);
      }

      onClose();
    },
    [connectionDrop, storeNodes, connectAll, onClose, takeSnapshot],
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
        onClose();
        return;
      }

      if (e.target instanceof HTMLInputElement) return;

      for (const [nodeType, shortcut] of Object.entries(NODE_SHORTCUTS)) {
        if (matchesShortcut(e, shortcut)) {
          e.preventDefault();
          onAddNode(nodeType);
          return;
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onAddNode]);

  // Compute phantom connection line path (source handle → drop position)
  const phantomPath = (() => {
    if (!connectionDrop.fromHandlePosition) return null;
    const sourcePosition = connectionDrop.handleType === 'source' ? Position.Right : Position.Left;
    const targetPosition = connectionDrop.handleType === 'source' ? Position.Left : Position.Right;
    const [path] = getBezierPath({
      sourceX: connectionDrop.fromHandlePosition.x,
      sourceY: connectionDrop.fromHandlePosition.y,
      sourcePosition,
      targetX: connectionDrop.position.x,
      targetY: connectionDrop.position.y,
      targetPosition,
    });
    return path;
  })();

  return (
    <>
      {phantomPath && (
        <svg
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 49, width: '100vw', height: '100vh' }}
        >
          <path
            d={phantomPath}
            fill="none"
            stroke="var(--color-connection-line-color)"
            strokeWidth={2}
          />
        </svg>
      )}
      <div
        ref={ref}
        className="fixed z-50 min-w-[220px] rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
        style={{ left: connectionDrop.position.x, top: connectionDrop.position.y }}
      >
        <BlockPicker
          heading="Add & Connect"
          onSelectBlock={onAddNode}
          nodes={existingNodes}
          onSelectNode={onSelectExistingNode}
        />
      </div>
    </>
  );
}
