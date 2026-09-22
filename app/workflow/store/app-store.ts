import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  XYPosition,
} from '@xyflow/react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';

import { AppEdge } from '@/app/workflow/components/edges';
import {
  AppNode,
  AppNodeType,
  createNodeByType,
} from '@/app/workflow/components/nodes';

export type AppState = {
  nodes: AppNode[];
  edges: AppEdge[];
};

export type PotentialConnection = {
  id: string;
  position: XYPosition;
  type?: 'source' | 'target';
  source?: ConnectionHandle;
  target?: ConnectionHandle;
};
export type ConnectionHandle = {
  node: string;
  handle?: string | null;
};

export type AppActions = {
  onNodesChange: OnNodesChange<AppNode>;
  setNodes: (nodes: AppNode[]) => void;
  addNode: (node: AppNode) => void;
  removeNode: (nodeId: string) => void;
  addNodeByType: (type: AppNodeType, position: XYPosition) => null | string;
  getNodes: () => AppNode[];
  setEdges: (edges: AppEdge[]) => void;
  getEdges: () => AppEdge[];
  addEdge: (edge: AppEdge) => void;
  removeEdge: (edgeId: string) => void;
  onConnect: OnConnect;
  onEdgesChange: OnEdgesChange<AppEdge>;
  updateNodeData: (nodeId: string, data: Partial<AppNode['data']>) => void;
};

export type AppStore = AppState & AppActions;

export function createAppStore(
  initialState: Partial<AppState> | undefined = undefined,
) {
  const store = create<AppStore>()(
    subscribeWithSelector((set, get) => ({
      nodes: initialState?.nodes ?? [],
      edges: initialState?.edges ?? [],
      ...initialState,

      onNodesChange: async (changes) => {
        const nextNodes = applyNodeChanges(changes, get().nodes);
        set({ nodes: nextNodes });
      },

      setNodes: (nodes) => set({ nodes }),

      addNode: (node) => {
        const nextNodes = [...get().nodes, node];
        set({ nodes: nextNodes });
      },

      removeNode: (nodeId) => {
        const { nodes, edges } = get();
        const nextNodes = nodes.filter((node) => node.id !== nodeId);
        const nextEdges = edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        );
        return set({ nodes: nextNodes, edges: nextEdges });
      },

      addNodeByType: (type, position) => {
        const newNode = createNodeByType({ type, position });

        if (!newNode) return null;

        get().addNode(newNode);

        return newNode.id;
      },

      getNodes: () => get().nodes,

      setEdges: (edges) => set({ edges }),

      getEdges: () => get().edges,

      addEdge: (edge) => {
        const nextEdges = addEdge(edge, get().edges);
        set({ edges: nextEdges });
      },

      removeEdge: (edgeId) => {
        set({ edges: get().edges.filter((edge) => edge.id !== edgeId) });
      },

      onEdgesChange: (changes) => {
        const nextEdges = applyEdgeChanges(changes, get().edges);
        set({ edges: nextEdges });
      },

      onConnect: (connection) => {
        // Normalize plus-handle IDs to standard handle IDs
        // This ensures edges created via plus handles work with existing logic
        const normalizedSourceHandle = connection.sourceHandle === 'plus-output'
          ? 'output'
          : connection.sourceHandle;
        const normalizedTargetHandle = connection.targetHandle === 'plus-input'
          ? 'input'
          : connection.targetHandle;

        // Use nanoid for unique edge IDs to allow multiple connections between same nodes
        const newEdge: AppEdge = {
          ...connection,
          sourceHandle: normalizedSourceHandle,
          targetHandle: normalizedTargetHandle,
          id: `edge-${nanoid()}`,
        };

        get().addEdge(newEdge);
      },

      updateNodeData: <T extends AppNode>(nodeId: string, data: T['data']) =>
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? ({ ...node, data: { ...node.data, ...data } } as AppNode)
              : node,
          ),
        }),
    })),
  );

  return store;
}
