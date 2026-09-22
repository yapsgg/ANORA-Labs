'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Panel } from '@xyflow/react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { matchesShortcut, SHORTCUT_ENTER, SHORTCUT_ESCAPE } from '@/lib/shortcuts';
import { Button } from '@/components/ui/button';

interface HeaderPanelProps {
  flowId: Id<'flows'>;
  flowName: string;
  projectId: Id<'projects'>;
  isSaving: boolean;
}

export function HeaderPanel({ flowId, flowName, projectId, isSaving }: HeaderPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(flowName);
  const [showSaving, setShowSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateFlow = useMutation(api.flows.update);

  // Sync name with flowName prop
  useEffect(() => {
    if (!isEditing) {
      setName(flowName);
    }
  }, [flowName, isEditing]);

  // Show saving indicator with animation
  useEffect(() => {
    if (isSaving) {
      setShowSaving(true);
    } else if (showSaving) {
      // Keep showing for a brief moment after save completes
      const timeout = setTimeout(() => setShowSaving(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [isSaving, showSaving]);

  const handleTitleClick = useCallback(() => {
    setIsEditing(true);
    // Focus and select all on next tick
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  }, []);

  const handleBlur = useCallback(async () => {
    setIsEditing(false);
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== flowName) {
      await updateFlow({ flowId, name: trimmedName });
    } else {
      setName(flowName);
    }
  }, [name, flowName, flowId, updateFlow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (matchesShortcut(e, SHORTCUT_ENTER)) {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
      setName(flowName);
      setIsEditing(false);
    }
  }, [flowName]);

  return (
    <>
      <Panel position="top-left" className="!m-4">
        <div className="flex items-center gap-1 rounded-lg backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 p-0 rounded-md"
            asChild
          >
            <Link href={`/project/${projectId}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>

          <div className="h-4 w-px bg-border" />

          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-sm font-medium outline-none min-w-[100px] py-1"
            />
          ) : (
            <button
              onClick={handleTitleClick}
              className="text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-text rounded px-2 py-1"
            >
              {name}
            </button>
          )}
        </div>
      </Panel>

      {/* Saving indicator with slide animation from top center */}
      <Panel position="top-center" className="!m-4">
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            showSaving
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          )}
        >
          <div className="rounded-md bg-background/95 border px-3 py-1 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-3 w-3 border border-muted-foreground border-t-transparent rounded-full" />
              <span className="text-xs text-muted-foreground">saving changes</span>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}
