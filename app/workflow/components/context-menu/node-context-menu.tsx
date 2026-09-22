'use client';

import { useCallback, useRef, useEffect } from 'react';
import { Copy, Play, Trash2 } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';

import { useAppStore } from '@/app/workflow/store';
import { useWorkflowRunner } from '@/app/workflow/hooks/use-workflow-runner';
import { type AppNode } from '@/app/workflow/components/nodes';
import { createEdge } from '@/app/workflow/components/edges';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  matchesShortcut,
  SHORTCUT_ESCAPE,
  SHORTCUT_NODE_RUN,
  SHORTCUT_DUPLICATE,
  SHORTCUT_DELETE,
  SHORTCUT_DELETE_ALT,
} from '@/lib/shortcuts';

interface NodeContextMenuProps {
  position: { x: number; y: number };
  nodeId: string;
  onClose: () => void;
  takeSnapshot: () => void;
}

export function NodeContextMenu({
  position,
  nodeId,
  onClose,
  takeSnapshot,
}: NodeContextMenuProps) {
  const { getNode, getEdges } = useReactFlow();
  const { runWorkflow } = useWorkflowRunner();
  const removeNode = useAppStore((s) => s.removeNode);
  const addNode = useAppStore((s) => s.addNode);
  const addEdge = useAppStore((s) => s.addEdge);
  const ref = useRef<HTMLDivElement>(null);

  const onRun = useCallback(() => {
    runWorkflow(nodeId);
    onClose();
  }, [nodeId, runWorkflow, onClose]);

  const onDuplicate = useCallback(() => {
    const node = getNode(nodeId) as AppNode | undefined;
    if (!node) return;
    takeSnapshot();

    const newId = nanoid();

    // Deep-copy the node with all its data (images, prompts, config, dimensions, etc.)
    const newNode: AppNode = {
      ...node,
      id: newId,
      data: JSON.parse(JSON.stringify(node.data)),
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      selected: false,
      dragging: false,
    };
    addNode(newNode);

    // Duplicate all incoming edges so the new node gets the same source connections
    const edges = getEdges();
    for (const edge of edges) {
      if (edge.target === nodeId) {
        const newEdge = createEdge(
          edge.source,
          newId,
          edge.sourceHandle,
          edge.targetHandle,
        );
        addEdge(newEdge);
      }
    }

    onClose();
  }, [nodeId, getNode, getEdges, addNode, addEdge, onClose, takeSnapshot]);

  const onDelete = useCallback(() => {
    takeSnapshot();
    removeNode(nodeId);
    onClose();
  }, [nodeId, removeNode, onClose, takeSnapshot]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
        onClose();
      } else if (matchesShortcut(e, SHORTCUT_NODE_RUN)) {
        e.preventDefault();
        onRun();
      } else if (matchesShortcut(e, SHORTCUT_DUPLICATE)) {
        e.preventDefault();
        onDuplicate();
      } else if (matchesShortcut(e, SHORTCUT_DELETE) || matchesShortcut(e, SHORTCUT_DELETE_ALT)) {
        e.preventDefault();
        onDelete();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onRun, onDuplicate, onDelete]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[200px] rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
      style={{ left: position.x, top: position.y }}
    >
      <Command className="rounded-md">
        <CommandList>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={onRun}>
              <Play className="size-4 text-muted-foreground" />
              <span>{SHORTCUT_NODE_RUN.label}</span>
              <CommandShortcut>{SHORTCUT_NODE_RUN.display}</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={onDuplicate}>
              <Copy className="size-4 text-muted-foreground" />
              <span>{SHORTCUT_DUPLICATE.label}</span>
              <CommandShortcut>{SHORTCUT_DUPLICATE.display}</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Visibility">
            <CommandItem onSelect={onDelete} className="text-muted-foreground">
              <Trash2 className="size-4" />
              <span>{SHORTCUT_DELETE.label}</span>
              <CommandShortcut>{SHORTCUT_DELETE.display}</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
