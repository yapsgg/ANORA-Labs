'use client';

import {
  Background,
  ColorMode,
  ReactFlow,
  BackgroundVariant,
  PanOnScrollMode,
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import { useShallow } from 'zustand/react/shallow';

import { nodeTypes } from '@/app/workflow/components/nodes';
import { edgeTypes } from '@/app/workflow/components/edges';
import { useAppStore } from '@/app/workflow/store';
import { AppStore } from '@/app/workflow/store/app-store';
import { PublishPanel } from './publish-panel';
import type { Id } from '@/convex/_generated/dataModel';

const selector = (state: AppStore) => ({
  nodes: state.nodes,
  edges: state.edges,
});

interface WorkflowViewerProps {
  flowId: Id<'flows'>;
}

export default function WorkflowViewer({ flowId }: WorkflowViewerProps) {
  const store = useAppStore(useShallow(selector));
  const { theme } = useTheme();

  return (
    <ReactFlow
      nodes={store.nodes}
      edges={store.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      colorMode={theme as ColorMode}

      // Read-only settings
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      edgesFocusable={false}
      nodesFocusable={false}

      proOptions={{ hideAttribution: true }}

      defaultEdgeOptions={{
        style: {
          stroke: 'var(--connection-line-color)',
          strokeWidth: 2,
        }
      }}
      defaultMarkerColor='var(--connection-line-color)'

      panOnScroll={true}
      panOnScrollMode={PanOnScrollMode.Free}
      panOnScrollSpeed={0.8}
      panOnDrag={true}

      defaultViewport={{
        x: 0,
        y: 0,
        zoom: 0.1
      }}

      minZoom={0.1}
      maxZoom={2}

      zoomOnScroll={false}
      zoomOnPinch={true}
      preventScrolling={true}
      zoomOnDoubleClick={false}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={40}
        size={0.7}
      />
      <PublishPanel flowId={flowId} />
    </ReactFlow>
  );
}
