'use client';

import { type Node, NodeProps, useReactFlow } from '@xyflow/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, SquarePen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  matchesShortcut,
  SHORTCUT_ENTER,
  SHORTCUT_ENTER_NEWLINE,
  SHORTCUT_ESCAPE,
} from '@/lib/shortcuts';

export type CommentNodeType = Node<CommentNodeData, 'comment-node'>;

export type CommentNodeData = {
  text?: string;
  author?: string;
  createdAt?: string;
  resolved?: boolean;
};

type CommentState = 'editing' | 'icon' | 'preview' | 'expanded';

function CommentNode({ id, data, selected }: NodeProps<CommentNodeType>) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const [state, setState] = useState<CommentState>(!data?.text ? 'editing' : 'icon');
  const [inputValue, setInputValue] = useState(data?.text ?? '');
  const [lineCount, setLineCount] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus when editing starts
  useEffect(() => {
    if (state === 'editing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  // Sync input value when data changes externally
  useEffect(() => {
    if (data?.text && data.text !== inputValue) {
      setInputValue(data.text);
    }
  }, [data?.text]);

  // Calculate line count for smooth height animation
  useEffect(() => {
    const lines = inputValue.split('\n').length;
    setLineCount(Math.min(lines, 5)); // Max 5 lines visible
  }, [inputValue]);

  // Cleanup hover timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;

    updateNodeData(id, {
      text: inputValue.trim(),
      createdAt: data?.createdAt ?? new Date().toISOString(),
    });
    setState('icon');
  }, [id, inputValue, updateNodeData, data?.createdAt]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUT_ENTER_NEWLINE)) {
        // Shift+Enter: add new line (default textarea behavior)
        return;
      } else if (matchesShortcut(e, SHORTCUT_ENTER)) {
        // Enter only: submit
        e.preventDefault();
        handleSubmit();
      } else if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
        if (data?.text) {
          setInputValue(data.text);
          setState('icon');
        }
      }
    },
    [handleSubmit, data?.text],
  );

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const handleIconClick = useCallback(() => {
    setState('expanded');
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (state === 'icon') {
      // Small delay before showing preview
      hoverTimeoutRef.current = setTimeout(() => {
        setState('preview');
      }, 150);
    }
  }, [state]);

  const handleMouseLeave = useCallback(() => {
    // Clear pending hover
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (state === 'preview') {
      setState('icon');
    }
  }, [state]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setState('editing');
  }, []);

  // Click outside to close expanded view
  useEffect(() => {
    if (state !== 'expanded') return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        setState('icon');
      }
    };

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [state]);

  // Get preview text (first ~25 chars, cut at word boundary if possible)
  const getPreviewText = useCallback((text: string) => {
    if (text.length <= 25) return text;
    const truncated = text.slice(0, 25);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 15 ? truncated.slice(0, lastSpace) : truncated) + '...';
  }, []);

  const previewText = data?.text ? getPreviewText(data.text) : '';

  // Editing state - compact single line by default, expands with Shift+Enter
  if (state === 'editing') {
    const inputHeight = Math.max(24, lineCount * 22);

    return (
      <div ref={containerRef} className="flex flex-col gap-1.5">
        {/* Comment indicator */}
        <div
          className={cn(
            'flex items-center justify-center size-7 rounded-t-full rounded-br-full bg-primary shadow-md',
            'transition-transform duration-200'
          )}
        >
          <MessageCircle className="size-5 text-primary-foreground" />
        </div>

        {/* Input bubble - compact by default */}
        <div
          className={cn(
            'rounded-lg bg-card border shadow-lg overflow-hidden',
            'w-[280px]',
            'transition-all duration-200 ease-out',
            selected && 'ring-1 ring-muted-foreground dark:ring-muted-foreground border-muted-foreground dark:border-muted-foreground transition-all ease-in-out duration-300'
          )}
        >
          <div className="flex items-end gap-2 p-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              className={cn(
                'nodrag nowheel flex-1 resize-none bg-transparent text-sm outline-none',
                'placeholder:text-muted-foreground leading-[22px]',
                'transition-[height] duration-200 ease-out'
              )}
              style={{ height: `${inputHeight}px` }}
              rows={1}
            />
            <Button
              size="icon"
              className="size-6 rounded-full shrink-0 mb-px"
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
            >
              <ArrowUp className="size-3" strokeWidth={4} />
            </Button>
          </div>

          {/* Hint text - only show when multiline */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-200 ease-out',
              lineCount > 1 ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="flex justify-end px-2 pb-1.5 gap-5">
              <p className="text-[9px] text-muted-foreground">
                ↵ Send
              </p>
              <p className="text-[9px] text-muted-foreground">
                ⇧↵ New line
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Icon only state (default after submission)
  if (state === 'icon') {
    return (
      <div
        ref={containerRef}
        className="relative cursor-pointer"
        onClick={handleIconClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn(
            'flex items-center justify-center size-7 rounded-t-full rounded-br-full bg-primary shadow-md',
            'transition-all duration-200 ease-out',
            'hover:scale-110 hover:shadow-lg',
            selected && 'ring-1 ring-muted-foreground dark:ring-muted-foreground border-muted-foreground dark:border-muted-foreground transition-all ease-in-out duration-300'
          )}
        >
          <MessageCircle className="size-5 text-primary-foreground" />
        </div>
      </div>
    );
  }

  // Preview state (on hover) - shows brief text
  if (state === 'preview') {
    return (
      <div
        ref={containerRef}
        className="cursor-pointer"
        onClick={handleIconClick}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center size-7 rounded-t-full rounded-br-full bg-primary shadow-md shrink-0',
              'transition-all duration-200 ease-out'
            )}
          >
            <MessageCircle className="size-5 text-primary-foreground" />
          </div>

          {/* Preview bubble */}
          <div
            className={cn(
              'rounded-lg bg-card border shadow-lg px-3 py-2',
              'animate-in fade-in-0 slide-in-from-left-2 duration-150',
              'max-w-[180px]'
            )}
          >
            <p className="text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
              {previewText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state (on click) - full comment view
  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      {/* Comment indicator */}
      <div
        className={cn(
          'flex items-center justify-center size-7 rounded-t-full rounded-br-full bg-primary shadow-md',
          'transition-all duration-200 ease-out'
        )}
      >
        <MessageCircle className="size-5 text-primary-foreground" />
      </div>

      {/* Expanded comment bubble */}
      <div
        className={cn(
          'rounded-lg bg-card border shadow-lg',
          'min-w-[200px] max-w-[280px]',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200',
          selected && 'ring-1 ring-muted-foreground dark:ring-muted-foreground border-muted-foreground dark:border-muted-foreground transition-all ease-in-out duration-300'
        )}
      >
        <div className="p-3">
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {data?.text}
          </p>

          {/* Date and actions row */}
          <div className="flex items-center justify-between mt-2">
            {data?.createdAt && (
              <p className="text-[10px] text-muted-foreground">
                {new Date(data.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleEditClick}
                className={cn(
                  'text-muted-foreground hover:text-primary transition-colors'
                )}
              >
                <SquarePen className="size-3" />
              </button>
              <button
                onClick={handleDelete}
                className={cn(
                  'text-muted-foreground hover:text-destructive transition-colors'
                )}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CommentNode) as typeof CommentNode;
