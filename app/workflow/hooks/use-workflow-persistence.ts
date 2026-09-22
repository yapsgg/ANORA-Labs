import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useReactFlow, type Viewport } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAppStore } from '../store';
import type { AppStore } from '../store/app-store';
import type { AppNode } from '../components/nodes';
import type { AppEdge } from '../components/edges';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workflowsApi = (api as any).workflows;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flowsApi = (api as any).flows;

const selector = (state: AppStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
});

interface UseWorkflowPersistenceOptions {
  flowId: Id<'flows'> | null;
  /** Auto-save interval in milliseconds (default: 5000) */
  autoSaveInterval?: number;
  /** Enable auto-save (default: true) */
  autoSave?: boolean;
}

interface UseWorkflowPersistenceReturn {
  /** Whether the workflow is currently loading */
  isLoading: boolean;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether a save is in progress */
  isSaving: boolean;
  /** Last save timestamp */
  lastSaved: number | null;
  /** Error message if any */
  error: string | null;
  /** Manually trigger a save */
  save: () => Promise<void>;
  /** Flow data from database */
  flowData: {
    flow: {
      _id: Id<'flows'>;
      name: string;
      projectId: Id<'projects'>;
    };
    project: {
      _id: Id<'projects'>;
      name: string;
    };
    isOwner?: boolean;
    isPublished?: boolean;
  } | null;
  /** Whether the current user is the owner of this flow */
  isOwner: boolean;
  /** Whether this is a read-only view (published flow, non-owner) */
  isReadOnly: boolean;
}

export function useWorkflowPersistence({
  flowId,
  autoSaveInterval = 5000,
  autoSave = true,
}: UseWorkflowPersistenceOptions): UseWorkflowPersistenceReturn {
  const { nodes, edges, setNodes, setEdges } = useAppStore(useShallow(selector));
  const { getViewport, setViewport } = useReactFlow();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(true);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);

  // Query workflow data
  const workflowData = useQuery(
    workflowsApi?.load,
    flowId ? { flowId } : 'skip'
  );

  // Query flow with project info
  const flowWithProject = useQuery(
    flowsApi?.getWithProject,
    flowId ? { flowId } : 'skip'
  );

  // Save mutation
  const saveWorkflow = useMutation(workflowsApi?.save);

  // Transform nodes and edges to database format
  const transformToDbFormat = useCallback((
    nodes: AppNode[],
    edges: AppEdge[],
    viewport: Viewport
  ) => {
    const dbNodes = nodes.map((node) => {
      const data = node.data as Record<string, unknown>;
      return {
        nodeId: node.id,
        type: node.type as 'generate-text-node' | 'generate-image-node' | 'generate-video-node' | 'comment-node',
        position: node.position,
        data: {
          title: data.title as string | undefined,
          label: data.label as string | undefined,
          icon: data.icon as string | undefined,
          status: data.status as 'loading' | 'success' | 'error' | 'initial' | undefined,
          error: data.error as string | undefined,
          config: data.config as Record<string, unknown> | undefined,
          text: data.text as string | undefined,
          prompt: data.prompt as string | undefined,
          image: data.image as string | undefined,
          video: data.video as string | undefined,
          author: data.author as string | undefined,
          createdAt: data.createdAt as string | undefined,
          resolved: data.resolved as boolean | undefined,
          width: data.width as number | undefined,
          height: data.height as number | undefined,
          isUploaded: data.isUploaded as boolean | undefined,
        },
        measured: node.measured ? {
          width: node.measured.width,
          height: node.measured.height,
        } : undefined,
      };
    });

    const dbEdges = edges.map((edge) => ({
      edgeId: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
      type: edge.type,
    }));

    return { nodes: dbNodes, edges: dbEdges, viewport };
  }, []);

  // Save function
  const save = useCallback(async () => {
    if (!flowId || isSaving || !isOwner) return;

    const viewport = getViewport();
    const currentData = transformToDbFormat(nodes, edges, viewport);
    const dataString = JSON.stringify(currentData);

    // Skip if no changes
    if (dataString === lastSavedDataRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveWorkflow({
        flowId,
        nodes: currentData.nodes,
        edges: currentData.edges,
        viewport: currentData.viewport,
      });

      lastSavedDataRef.current = dataString;
      setLastSaved(Date.now());
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
      console.error('Failed to save workflow:', err);
    } finally {
      setIsSaving(false);
    }
  }, [flowId, nodes, edges, getViewport, transformToDbFormat, saveWorkflow, isSaving]);

  // Load workflow data when available
  useEffect(() => {
    if (!workflowData || !isInitialLoadRef.current) return;

    // Set ownership status
    setIsOwner(workflowData.isOwner !== false);

    // Set nodes and edges from database
    const loadedNodes = workflowData.nodes.map((node: {
      id: string;
      type: string;
      position: { x: number; y: number };
      data: Record<string, unknown>;
      measured?: { width?: number; height?: number };
      selected?: boolean;
      dragging?: boolean;
    }) => ({
      ...node,
      data: node.data,
    })) as AppNode[];

    const loadedEdges = workflowData.edges as AppEdge[];

    setNodes(loadedNodes);
    setEdges(loadedEdges);

    // Restore viewport
    if (workflowData.viewport) {
      setTimeout(() => {
        setViewport(workflowData.viewport!, { duration: 0 });
      }, 100);
    }

    // Store initial data hash (only for owners)
    if (workflowData.isOwner !== false) {
      const viewport = workflowData.viewport || { x: 0, y: 0, zoom: 1 };
      const dataString = JSON.stringify(
        transformToDbFormat(loadedNodes, loadedEdges, viewport)
      );
      lastSavedDataRef.current = dataString;
    }

    setIsLoading(false);
    isInitialLoadRef.current = false;
  }, [workflowData, setNodes, setEdges, setViewport, transformToDbFormat]);

  // Track changes
  useEffect(() => {
    if (isInitialLoadRef.current || isLoading) return;

    const viewport = getViewport();
    const currentData = JSON.stringify(
      transformToDbFormat(nodes, edges, viewport)
    );

    if (currentData !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges, isLoading, getViewport, transformToDbFormat]);

  // Auto-save effect (only for owners)
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges || isLoading || !isOwner) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, autoSaveInterval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, save, isLoading]);

  // Save on unmount if there are unsaved changes (only for owners)
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && flowId && isOwner) {
        // Fire and forget save on unmount
        save();
      }
    };
  }, []);

  // Handle query loading state
  useEffect(() => {
    if (workflowData === undefined && flowId) {
      setIsLoading(true);
    }
  }, [workflowData, flowId]);

  const isReadOnly = !isOwner;

  return {
    isLoading: isLoading && flowId !== null,
    hasUnsavedChanges,
    isSaving,
    lastSaved,
    error,
    save,
    flowData: flowWithProject ?? null,
    isOwner,
    isReadOnly,
  };
}
