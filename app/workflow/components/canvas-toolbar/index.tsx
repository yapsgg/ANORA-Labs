'use client';

import { Panel } from '@xyflow/react';
import { PointerTools } from './pointer-tools';
import { BlockTools } from './block-tools';
import { CommentTool } from './comment-tool';
import { UseCanvasToolsReturn } from './use-canvas-tools';

interface CanvasToolbarProps {
  canvasTools: UseCanvasToolsReturn;
}

export function CanvasToolbar({ canvasTools }: CanvasToolbarProps) {
  const {
    activeTool,
    pointerTool,
    blockTool,
    setPointerTool,
    setBlockTool,
    setCommentTool,
  } = canvasTools;

  return (
    <Panel position="bottom-center">
      <div className="flex items-center gap-1 rounded-xl border bg-card p-1 shadow-lg backdrop-blur-sm">
        <PointerTools
          selectedTool={pointerTool}
          activeTool={activeTool}
          onSelect={setPointerTool}
        />
        <div className="h-6 w-px bg-border" />
        <BlockTools
          selectedTool={blockTool}
          activeTool={activeTool}
          onSelect={setBlockTool}
        />
        <div className="h-6 w-px bg-border" />
        <CommentTool
          activeTool={activeTool}
          onSelect={setCommentTool}
        />
      </div>
    </Panel>
  );
}

export { useCanvasTools } from './use-canvas-tools';
export { PlacementCursor } from './placement-cursor';
export type { CanvasTool, PointerTool, BlockTool, PlaceableTool } from './types';
