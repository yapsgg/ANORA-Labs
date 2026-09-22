'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CanvasTool } from './types';
import { SHORTCUT_BLOCK_COMMENT } from '@/lib/shortcuts';

interface CommentToolProps {
  activeTool: CanvasTool;
  onSelect: () => void;
}

export function CommentTool({ activeTool, onSelect }: CommentToolProps) {
  const isActive = activeTool === 'comment-node';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSelect}
      className={cn(
        'h-8 px-2',
        isActive && 'bg-accent text-accent-foreground'
      )}
      title={`${SHORTCUT_BLOCK_COMMENT.label} (${SHORTCUT_BLOCK_COMMENT.display})`}
    >
      <MessageCircle className="size-4" />
    </Button>
  );
}
