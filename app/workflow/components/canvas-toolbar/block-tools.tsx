'use client';

import { Image, Play, Type } from 'lucide-react';
import { ToolButton } from './tool-button';
import { BlockTool, ToolDefinition, CanvasTool } from './types';
import {
  SHORTCUT_BLOCK_TEXT,
  SHORTCUT_BLOCK_IMAGE,
  SHORTCUT_BLOCK_VIDEO,
} from '@/lib/shortcuts';

const blockTools: ToolDefinition[] = [
  {
    id: 'generate-text-node',
    name: SHORTCUT_BLOCK_TEXT.label,
    icon: Type,
    shortcut: SHORTCUT_BLOCK_TEXT.display,
  },
  {
    id: 'generate-image-node',
    name: SHORTCUT_BLOCK_IMAGE.label,
    icon: Image,
    shortcut: SHORTCUT_BLOCK_IMAGE.display,
  },
  {
    id: 'generate-video-node',
    name: SHORTCUT_BLOCK_VIDEO.label,
    icon: Play,
    shortcut: SHORTCUT_BLOCK_VIDEO.display,
  },
];

interface BlockToolsProps {
  selectedTool: BlockTool;
  activeTool: CanvasTool;
  onSelect: (tool: BlockTool) => void;
}

export function BlockTools({ selectedTool, activeTool, onSelect }: BlockToolsProps) {
  return (
    <ToolButton<BlockTool>
      tools={blockTools}
      selectedTool={selectedTool}
      activeTool={activeTool}
      onSelect={onSelect}
    />
  );
}
