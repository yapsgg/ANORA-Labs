'use client';

import { memo, useCallback, type DragEvent, type MouseEvent } from 'react';
import { X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAppStore } from '@/app/workflow/store';
import type { AppStore } from '@/app/workflow/store/app-store';
import { cn } from '@/lib/utils';

export interface ConnectedImage {
  id: string;
  url: string;
  label?: string;
}

interface ConnectedImagePreviewsProps {
  images: ConnectedImage[];
  /** ID of the node owning these previews (target side of the connection) */
  currentNodeId: string;
  className?: string;
  /** Callback when an image preview is clicked */
  onImageClick?: (nodeId: string) => void;
}

const storeSelector = (s: AppStore) => ({
  edges: s.edges,
  removeEdge: s.removeEdge,
});

const DRAG_MIME = 'application/x-anora-image-source';

function ConnectedImagePreviewsComponent({
  images,
  currentNodeId,
  className,
  onImageClick,
}: ConnectedImagePreviewsProps) {
  const { edges, removeEdge } = useAppStore(useShallow(storeSelector));

  const handleClick = useCallback(
    (e: MouseEvent, nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      onImageClick?.(nodeId);
    },
    [onImageClick],
  );

  const handleRemove = useCallback(
    (e: MouseEvent, sourceNodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const matching = edges.filter(
        (edge) =>
          edge.source === sourceNodeId &&
          edge.target === currentNodeId &&
          (edge.targetHandle ?? 'input') === 'input',
      );
      for (const edge of matching) removeEdge(edge.id);
    },
    [edges, removeEdge, currentNodeId],
  );

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLImageElement>, image: ConnectedImage) => {
      e.stopPropagation();
      try {
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/uri-list', image.url);
        e.dataTransfer.setData('text/plain', image.url);
        e.dataTransfer.setData(
          DRAG_MIME,
          JSON.stringify({ nodeId: image.id, url: image.url, label: image.label }),
        );
      } catch {
        // Some browsers throw on unknown MIME types — ignore
      }
    },
    [],
  );

  if (images.length === 0) return null;

  return (
    <div className={cn('w-full px-2 nopan nodrag', className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-1 pb-1">
          {images.map((image) => (
            <div
              key={image.id}
              role="button"
              tabIndex={0}
              onClick={(e) => handleClick(e, image.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onImageClick?.(image.id);
                }
              }}
              className="relative flex-shrink-0 group focus:outline-none nopan nodrag cursor-pointer"
              title={image.label || 'Click to focus on image node'}
            >
              <div
                className={cn(
                  'h-10 w-10 rounded-md overflow-hidden border border-border/50 bg-muted/30',
                  'transition-transform duration-200',
                  'group-hover:scale-90',
                  'hover:border-primary/50',
                  'focus-visible:border-primary',
                )}
              >
                <img
                  src={image.url}
                  alt={image.label || 'Connected image'}
                  className="h-full w-full object-cover"
                  draggable
                  onDragStart={(e) => handleDragStart(e, image)}
                />
              </div>

              {/* Remove icon — top-left, hover-only */}
              <button
                type="button"
                aria-label="Disconnect source"
                onClick={(e) => handleRemove(e, image.id)}
                className={cn(
                  'absolute -left-1 -top-1 z-10 flex size-4 items-center justify-center',
                  'rounded-full border border-border bg-background text-foreground shadow',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                  'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive',
                  'focus:outline-none focus-visible:opacity-100',
                )}
              >
                <X className="size-2.5" strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
}

export const ConnectedImagePreviews = memo(ConnectedImagePreviewsComponent);
