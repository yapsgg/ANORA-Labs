'use client';

import { MousePointer2, Hand } from 'lucide-react';
import { ToolButton } from './tool-button';
import { PointerTool, ToolDefinition, CanvasTool } from './types';
import {
  SHORTCUT_POINTER_CURSOR,
  SHORTCUT_POINTER_HAND,
} from '@/lib/shortcuts';

const pointerTools: ToolDefinition[] = [
  {
    id: 'cursor',
    name: SHORTCUT_POINTER_CURSOR.label,
    icon: MousePointer2,
    shortcut: SHORTCUT_POINTER_CURSOR.display,
  },
  {
    id: 'hand',
    name: SHORTCUT_POINTER_HAND.label,
    icon: Hand,
    shortcut: SHORTCUT_POINTER_HAND.display,
  },
];

interface PointerToolsProps {
  selectedTool: PointerTool;
  activeTool: CanvasTool;
  onSelect: (tool: PointerTool) => void;
}

export function PointerTools({ selectedTool, activeTool, onSelect }: PointerToolsProps) {
  return (
    <ToolButton<PointerTool>
      tools={pointerTools}
      selectedTool={selectedTool}
      activeTool={activeTool}
      onSelect={onSelect}
    />
  );
}
