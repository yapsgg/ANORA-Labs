'use client';

import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ToolDefinition, CanvasTool } from './types';
import { useState } from 'react';

interface ToolButtonProps<T extends CanvasTool> {
  tools: ToolDefinition[];
  selectedTool: T;
  activeTool: CanvasTool;
  onSelect: (tool: T) => void;
}

export function ToolButton<T extends CanvasTool>({
  tools,
  selectedTool,
  activeTool,
  onSelect,
}: ToolButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const currentTool = tools.find((t) => t.id === selectedTool);
  const isActive = tools.some((t) => t.id === activeTool);

  if (!currentTool) return null;

  const Icon = currentTool.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-2 gap-1.5',
            isActive && 'bg-accent text-accent-foreground'
          )}
        >
          <Icon className="size-4" />
          <ChevronDown className={cn("size-3 opacity-50", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start" side="top" sideOffset={8}>
        {tools.map((tool) => {
          const ToolIcon = tool.icon;
          const isSelected = tool.id === selectedTool;
          return (
            <button
              key={tool.id}
              onClick={() => {
                onSelect(tool.id as T);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground cursor-default select-none'
              )}
            >
              <span className="size-4 flex items-center justify-center">
                {isSelected && <Check className="size-4 text-primary" />}
              </span>
              <ToolIcon className="size-4" />
              <span className="flex-1 text-left">{tool.name}</span>
              <span className="text-xs text-muted-foreground">{tool.shortcut}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
