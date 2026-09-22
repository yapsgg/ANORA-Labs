'use client';

import { useCallback, useRef } from 'react';
import { type Edge } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';

import { AppEdge } from '@/app/workflow/components/edges';
import {
  AppNode,
  NodeProcessor,
  nodeProcessors,
} from '@/app/workflow/components/nodes';
import { useAppStore } from '@/app/workflow/store';
import { AppStore } from '@/app/workflow/store/app-store';
import { nodesConfig } from '../config';

export type IncomingNodeData = Record<string, (AppNode | undefined)[]>;

const selector = (state: AppStore) => ({
  getNodes: state.getNodes,
  setNodes: state.setNodes,
  getEdges: state.getEdges,
  updateNodeData: state.updateNodeData,
});

export function useWorkflowRunner() {
  const isRunning = useRef(false);
  const { getNodes, getEdges, updateNodeData } = useAppStore(
    useShallow(selector),
  );

  const stopWorkflow = useCallback(() => {
    isRunning.current = false;
  }, []);

  const getAllIncomingData = useCallback(
    <T extends AppNode>(node: T): IncomingNodeData => {
      const edges = getEdges();
      if (!node.type) return {};

      // Skip comment nodes (they don't participate in workflow)
      if (node.type === 'comment-node') return {};

      const nodeConfig = nodesConfig[node.type as keyof typeof nodesConfig];
      if (!nodeConfig) return {};

      const handles = nodeConfig.handles;
      const incomerEdges: Record<string, Edge[]> = Object.fromEntries(
        handles.map((handle) => [
          handle.id,
          edges.filter(
            (edge) =>
              edge.target === node.id && edge.targetHandle === handle.id,
          ),
        ]),
      );

      const nodes = getNodes();
      const incomers = Object.fromEntries(
        Object.entries(incomerEdges).map(([handleId, edges]) => [
          handleId,
          edges.map((e) => nodes.find((n) => n.id === e.source)),
        ]),
      );

      if (Object.keys(incomers).length == 0) {
        return {};
      }

      return incomers;
    },
    [getEdges, getNodes],
  );

  const processNode = useCallback(
    async function <T extends AppNode>(node: T) {
      // Skip comment nodes (they don't participate in workflow processing)
      if (node.type === 'comment-node') return;

      updateNodeData(node.id, { status: 'loading', error: undefined });

      const allIncomingData = getAllIncomingData(node);

      const processor = nodeProcessors[node.type as keyof typeof nodeProcessors] as NodeProcessor<T>;

      let newData: Partial<T['data']> | undefined;
      if (processor) {
        try {
          newData = await processor(allIncomingData, node as T);
        } catch (error) {
          console.error(`Error processing node ${node.id}:`, error);
          updateNodeData(node.id, {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
          return;
        }
      } else {
        console.error(`No processor found for node type: ${node.type}`);
        updateNodeData(node.id, { status: 'error', error: undefined });
        return;
      }

      if (!isRunning.current) {
        updateNodeData(node.id, { status: 'initial', error: undefined });
        return;
      }

      updateNodeData(
        node.id,
        newData ?? { status: 'error', error: 'Unknown error' },
      );
    },
    [updateNodeData, getAllIncomingData],
  );

  const runWorkflow = useCallback(
    async (startNodeId?: string) => {
      if (isRunning.current) return;
      const nodes = getNodes();
      const edges = getEdges();
      isRunning.current = true;

      const _startNodeId =
        startNodeId ||
        nodes.find((node) => !edges.some((e) => e.target === node.id))?.id;

      if (!_startNodeId) return;

      const nodesToProcess = topologicalSort(nodes, edges, _startNodeId);

      for (const node of nodesToProcess) {
        if (!isRunning.current) break;
        await processNode(node);
      }

      isRunning.current = false;
    },
    [getNodes, getEdges, processNode],
  );

  return { runWorkflow, stopWorkflow, isRunning: isRunning.current };
}

/**
 * Topological sort (BFS / Kahn's algorithm) starting from startNodeId.
 * Ensures all upstream nodes are processed before downstream nodes.
 */
function topologicalSort(
  nodes: AppNode[],
  edges: AppEdge[],
  startNodeId: string,
): AppNode[] {
  // First, collect all reachable nodes from startNodeId via BFS on outgoing edges
  const reachable = new Set<string>();
  const queue: string[] = [startNodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;
    reachable.add(current);
    for (const edge of edges) {
      if (edge.source === current && !reachable.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  // Build in-degree map for reachable nodes (only counting edges within reachable set)
  const inDegree = new Map<string, number>();
  for (const nodeId of reachable) {
    inDegree.set(nodeId, 0);
  }
  for (const edge of edges) {
    if (reachable.has(edge.source) && reachable.has(edge.target)) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  // Start with nodes that have 0 in-degree
  const sorted: AppNode[] = [];
  const bfsQueue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) {
      bfsQueue.push(nodeId);
    }
  }

  while (bfsQueue.length > 0) {
    const current = bfsQueue.shift()!;
    const node = nodes.find((n) => n.id === current);
    if (node) sorted.push(node);

    for (const edge of edges) {
      if (edge.source === current && reachable.has(edge.target)) {
        const newDeg = (inDegree.get(edge.target) ?? 1) - 1;
        inDegree.set(edge.target, newDeg);
        if (newDeg === 0) {
          bfsQueue.push(edge.target);
        }
      }
    }
  }

  return sorted;
}
