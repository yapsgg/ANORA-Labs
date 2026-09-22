'use client';

import { useCallback, useEffect, useState } from 'react';
import { PointerTool, BlockTool, CanvasTool, CommentTool } from './types';
import {
  matchesShortcut,
  isInputElement,
  SHORTCUT_POINTER_CURSOR,
  SHORTCUT_POINTER_HAND,
  SHORTCUT_BLOCK_TEXT,
  SHORTCUT_BLOCK_IMAGE,
  SHORTCUT_BLOCK_VIDEO,
  SHORTCUT_BLOCK_COMMENT,
} from '@/lib/shortcuts';

export interface UseCanvasToolsReturn {
  activeTool: CanvasTool;
  pointerTool: PointerTool;
  blockTool: BlockTool;
  isPlacingNode: boolean;
  isPlacingComment: boolean;
  isPlacing: boolean;
  setActiveTool: (tool: CanvasTool) => void;
  setPointerTool: (tool: PointerTool) => void;
  setBlockTool: (tool: BlockTool) => void;
  setCommentTool: () => void;
  revertToPointerTool: () => void;
}

export function useCanvasTools(): UseCanvasToolsReturn {
  const [activeTool, setActiveToolState] = useState<CanvasTool>('cursor');
  const [pointerTool, setPointerToolState] = useState<PointerTool>('cursor');
  const [blockTool, setBlockToolState] = useState<BlockTool>('generate-text-node');

  const isPlacingNode = activeTool === 'generate-text-node' ||
    activeTool === 'generate-image-node' ||
    activeTool === 'generate-video-node';

  const isPlacingComment = activeTool === 'comment-node';
  const isPlacing = isPlacingNode || isPlacingComment;

  const setActiveTool = useCallback((tool: CanvasTool) => {
    setActiveToolState(tool);
  }, []);

  const setPointerTool = useCallback((tool: PointerTool) => {
    setPointerToolState(tool);
    setActiveToolState(tool);
  }, []);

  const setBlockTool = useCallback((tool: BlockTool) => {
    setBlockToolState(tool);
    setActiveToolState(tool);
  }, []);

  const setCommentTool = useCallback(() => {
    setActiveToolState('comment-node');
  }, []);

  const revertToPointerTool = useCallback(() => {
    setActiveToolState(pointerTool);
  }, [pointerTool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (isInputElement(e.target)) {
        return;
      }

      // Block tools (check Shift+V first since it's more specific)
      if (matchesShortcut(e, SHORTCUT_BLOCK_VIDEO)) {
        setBlockTool('generate-video-node');
      } else if (matchesShortcut(e, SHORTCUT_BLOCK_TEXT)) {
        setBlockTool('generate-text-node');
      } else if (matchesShortcut(e, SHORTCUT_BLOCK_IMAGE)) {
        setBlockTool('generate-image-node');
      } else if (matchesShortcut(e, SHORTCUT_BLOCK_COMMENT)) {
        setCommentTool();
      }
      // Pointer tools
      else if (matchesShortcut(e, SHORTCUT_POINTER_CURSOR)) {
        setPointerTool('cursor');
      } else if (matchesShortcut(e, SHORTCUT_POINTER_HAND)) {
        setPointerTool('hand');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setPointerTool, setBlockTool, setCommentTool]);

  return {
    activeTool,
    pointerTool,
    blockTool,
    isPlacingNode,
    isPlacingComment,
    isPlacing,
    setActiveTool,
    setPointerTool,
    setBlockTool,
    setCommentTool,
    revertToPointerTool,
  };
}
