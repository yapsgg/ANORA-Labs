'use client';

import { useCallback } from 'react';
import { Ellipsis, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/app/workflow/store';
import { type AppStore } from '@/app/workflow/store/app-store';

const selector = (state: AppStore) => state.removeNode;

interface NodeMenuActionProps {
  nodeId: string;
}

export function NodeMenuAction({ nodeId }: NodeMenuActionProps) {
  const removeNode = useAppStore(useShallow(selector));
  const onDelete = useCallback(() => removeNode(nodeId), [nodeId, removeNode]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          title="More actions"
        >
          <Ellipsis className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem variant="default" onClick={onDelete}>
          <Trash2 />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
