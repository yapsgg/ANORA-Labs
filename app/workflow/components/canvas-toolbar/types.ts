import { LucideIcon } from 'lucide-react';

export type PointerTool = 'cursor' | 'hand';
export type BlockTool = 'generate-text-node' | 'generate-image-node' | 'generate-video-node';
export type CommentTool = 'comment-node';
export type CanvasTool = PointerTool | BlockTool | CommentTool;
export type PlaceableTool = BlockTool | CommentTool;

export interface ToolDefinition {
  id: CanvasTool;
  name: string;
  icon: LucideIcon;
  shortcut: string;
}

export interface ToolGroup<T extends CanvasTool> {
  tools: ToolDefinition[];
  selectedTool: T;
  onSelect: (tool: T) => void;
}
