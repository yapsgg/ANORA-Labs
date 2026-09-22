'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Background,
  ColorMode,
  Connection,
  type Node,
  PanOnScrollMode,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  SelectionMode,
  BackgroundVariant,
  type OnNodeDrag,
  type SelectionDragHandler,
  type OnNodesDelete,
  type OnEdgesDelete,
  type OnConnectEnd,
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import { useShallow } from 'zustand/react/shallow';

import { nodeTypes, type AppNode, type AppNodeType } from '@/app/workflow/components/nodes';
import { edgeTypes } from '@/app/workflow/components/edges';
import { useAppStore } from '@/app/workflow/store';
import { AppStore } from '@/app/workflow/store/app-store';
import { layoutGraph } from '../utils/layout-helper';
import { PaneContextMenu } from './context-menu/pane-context-menu';
import { NodeContextMenu } from './context-menu/node-context-menu';
import { ConnectionContextMenu, type ConnectionDropState } from './context-menu/connection-context-menu';
import { useUndoRedo } from '@/app/workflow/hooks/use-undo-redo';
import { useCopyPaste } from '@/app/workflow/hooks/use-copy-paste';
import { useImageDrop } from '@/app/workflow/hooks/use-image-drop';
import { useProximityConnect } from '@/app/workflow/hooks/use-proximity-connect';
import { CanvasToolbar, useCanvasTools, PlacementCursor, type PlaceableTool } from './canvas-toolbar';
import { GroupConnectionLine } from './group-connection-line';
import { CreditsPanel } from './credits-panel';
import { HeaderPanel } from './header-panel';
import { PublishPanel } from './publish-panel';
import type { Id } from '@/convex/_generated/dataModel';
import '@/components/styles/overrides.css';

const selector = (state: AppStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
  addNodeByType: state.addNodeByType,
  getNodes: state.getNodes,
});

// Allow any connection between any nodes (infinite connections)
const isValidConnection = () => true;

type ContextMenuState =
  | { type: 'pane'; position: { x: number; y: number } }
  | { type: 'node'; position: { x: number; y: number }; nodeId: string }
  | { type: 'connection'; connectionDrop: ConnectionDropState }
  | null;

interface WorkflowProps {
  flowId?: Id<'flows'>;
  flowName?: string;
  projectId?: Id<'projects'>;
  isSaving?: boolean;
}

export default function Workflow({ flowId, flowName, projectId, isSaving = false }: WorkflowProps) {
  const store = useAppStore(useShallow(selector));
  const { theme } = useTheme();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [hasLayouted, setHasLayouted] = useState(false);
  const nodesInitialized = useNodesInitialized();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const { takeSnapshot } = useUndoRedo();
  useCopyPaste();
  const canvasTools = useCanvasTools();
  const { onDrop, onDragOver } = useImageDrop({ takeSnapshot });
  const { getProximityConnection } = useProximityConnect();

  const layoutNodes = useCallback(async () => {
    // Skip layout if no nodes
    if (store.nodes.length === 0) {
      setHasLayouted(true);
      return;
    }
    const layoutedNodes = await layoutGraph(store.nodes, store.edges);
    store.setNodes(layoutedNodes);
    setHasLayouted(true);
    fitView();
  }, [fitView, store]);

  useEffect(() => {
    // Skip auto-layout for saved workflows — their positions are restored from the database.
    // Only apply layout for new/empty workflows (no flowId).
    if (flowId) {
      setHasLayouted(true);
      return;
    }
    if (nodesInitialized && !hasLayouted) {
      layoutNodes();
    }
  }, [nodesInitialized, hasLayouted, layoutNodes, flowId]);

  // Fan out a connection to all selected nodes when source/target is in a multi-selection
  const connectWithFanOut = useCallback(
    (connection: Connection) => {
      // Always read freshest state via getNodes() to avoid stale closures
      const selected = store.getNodes().filter(
        (n) => n.selected && n.type !== 'comment-node',
      );

      if (selected.length >= 2) {
        const isSourceSelected = selected.some((n) => n.id === connection.source);
        const isTargetSelected = selected.some((n) => n.id === connection.target);

        if (isSourceSelected && !isTargetSelected) {
          for (const node of selected) {
            store.onConnect({ ...connection, source: node.id, sourceHandle: 'output' });
          }
          return;
        }

        if (!isSourceSelected && isTargetSelected) {
          for (const node of selected) {
            store.onConnect({ ...connection, target: node.id, targetHandle: 'input' });
          }
          return;
        }
      }

      store.onConnect(connection);
    },
    [store],
  );

  // Wrap onConnect to snapshot before adding edge
  const onConnect = useCallback(
    (connection: Connection) => {
      takeSnapshot();
      connectWithFanOut(connection);
    },
    [takeSnapshot, connectWithFanOut],
  );

  const onNodeDragStart: OnNodeDrag = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onSelectionDragStart: SelectionDragHandler = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodesDelete: OnNodesDelete = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onEdgesDelete: OnEdgesDelete = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  // Handle connection drop — try proximity auto-connect first, then fall back to context menu
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid && connectionState.fromNode) {
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;

        const handleType = connectionState.fromHandle?.type === 'source' ? 'source' : 'target';

        // Proximity auto-connect: if the drop is near another node, connect automatically
        const proximityConnection = getProximityConnection(
          clientX,
          clientY,
          connectionState.fromNode.id,
          handleType,
        );

        if (proximityConnection) {
          takeSnapshot();
          connectWithFanOut(proximityConnection);
          return;
        }

        // Fallback: show context menu to add / pick a node
        const handleId = connectionState.fromHandle?.id;
        const nodeId = connectionState.fromNode.id;
        let fromHandlePosition: { x: number; y: number } | null = null;

        if (handleId) {
          const handleEl = document.querySelector(
            `.react-flow__handle[data-handleid="${handleId}"][data-nodeid="${nodeId}"]`,
          );
          if (handleEl) {
            const rect = handleEl.getBoundingClientRect();
            fromHandlePosition = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
          }
        }

        setContextMenu({
          type: 'connection',
          connectionDrop: {
            position: { x: clientX, y: clientY },
            fromNodeId: nodeId,
            fromHandleId: handleId ?? null,
            handleType,
            fromHandlePosition,
          },
        });
      }
    },
    [getProximityConnection, takeSnapshot, connectWithFanOut],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        type: 'pane',
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        type: 'node',
        position: { x: event.clientX, y: event.clientY },
        nodeId: node.id,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Handle pane click for node/comment placement when a placeable tool is active
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      closeContextMenu();

      if (canvasTools.isPlacing) {
        takeSnapshot();
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        store.addNodeByType(canvasTools.activeTool as AppNodeType, position);
        canvasTools.revertToPointerTool();
      }
    },
    [closeContextMenu, canvasTools, takeSnapshot, screenToFlowPosition, store],
  );

  // Determine ReactFlow props based on active tool
  const isHandTool = canvasTools.activeTool === 'hand';
  const panOnDrag = isHandTool;
  const selectionOnDrag = !isHandTool && !canvasTools.isPlacing;

  return (
    <>
      <PlacementCursor
        activeTool={canvasTools.activeTool as PlaceableTool}
        isActive={canvasTools.isPlacing}
      />
      <ReactFlow
        className={canvasTools.isPlacing ? 'cursor-none' : ''}
        nodes={store.nodes}
        edges={store.edges}
        onNodesChange={store.onNodesChange}
        onEdgesChange={store.onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onSelectionDragStart={onSelectionDragStart}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={theme as ColorMode}
        isValidConnection={isValidConnection}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}

        proOptions={{ hideAttribution: true }}
        fitView={!flowId}

      defaultEdgeOptions={{
          style: {
              stroke: 'var(--color-connection-line-color)',
              strokeWidth: 2,
          }
      }}
      defaultMarkerColor='var(--color-connection-line-color)'
      connectionLineComponent={GroupConnectionLine}
      connectionLineStyle={{
          stroke: 'var(--color-connection-line-color)',
          strokeWidth: 2,
      }}

      snapToGrid={true}
      snapGrid={[30, 30]}

      panOnScroll={true}
      panOnScrollMode={PanOnScrollMode.Free}
      panOnScrollSpeed={0.8}

      // viewport is 0.5 when getting started is shown
      defaultViewport={ {
          x: 0,
          y: 0,
          zoom: 0.1
      } }

      panOnDrag={panOnDrag}
      selectionOnDrag={selectionOnDrag}
      multiSelectionKeyCode={['Shift']}
      selectionMode={SelectionMode.Partial}
      elevateNodesOnSelect={true}

      minZoom={0.1}
      maxZoom={10}

      zoomOnScroll={false}
      zoomOnPinch={true}
      preventScrolling={true}
      zoomOnDoubleClick={false}
      noWheelClassName="nowheel"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={40}
        size={0.7}
      />
      <CanvasToolbar canvasTools={canvasTools} />
      {contextMenu?.type === 'pane' && (
        <PaneContextMenu
          position={contextMenu.position}
          onClose={closeContextMenu}
          takeSnapshot={takeSnapshot}
        />
      )}
      {contextMenu?.type === 'node' && (
        <NodeContextMenu
          position={contextMenu.position}
          nodeId={contextMenu.nodeId}
          onClose={closeContextMenu}
          takeSnapshot={takeSnapshot}
        />
      )}
      {contextMenu?.type === 'connection' && (
        <ConnectionContextMenu
          connectionDrop={contextMenu.connectionDrop}
          onClose={closeContextMenu}
          takeSnapshot={takeSnapshot}
        />
      )}
      <CreditsPanel />
      {flowId && flowName && projectId && (
        <HeaderPanel
          flowId={flowId}
          flowName={flowName}
          projectId={projectId}
          isSaving={isSaving}
        />
      )}
      {flowId && <PublishPanel flowId={flowId} />}
    </ReactFlow>
    </>
  );
}
