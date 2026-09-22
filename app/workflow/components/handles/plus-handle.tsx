'use client';

import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Magnetic } from '@/components/motion-primitives/magnetic';
import { useAppStore } from '@/app/workflow/store';

interface PlusHandleProps {
  nodeId: string;
  position: Position;
  isVisible?: boolean;
}

/**
 * Selector that returns:
 *  null   – not in multi-select → use default behaviour
 *  false  – in multi-select but NOT the boundary node → hide
 *  number – boundary node → show at this Y-offset (px) relative to node top
 */
function useGroupHandle(nodeId: string, position: Position): null | false | number {
  return useAppStore((s) => {
    const selected = s.nodes.filter(
      (n) => n.selected && n.type !== 'comment-node',
    );
    if (selected.length < 2) return null;

    const me = selected.find((n) => n.id === nodeId);
    if (!me) return null;

    // Right handle → only on rightmost node
    if (position === Position.Right) {
      const myRight = (me.position?.x ?? 0) + (me.measured?.width ?? 320);
      const isRightmost = !selected.some((n) => {
        const nRight = (n.position?.x ?? 0) + (n.measured?.width ?? 320);
        return nRight > myRight;
      });
      if (!isRightmost) return false;
    }

    // Left handle → only on leftmost node
    if (position === Position.Left) {
      const myLeft = me.position?.x ?? 0;
      const isLeftmost = !selected.some(
        (n) => (n.position?.x ?? 0) < myLeft,
      );
      if (!isLeftmost) return false;
    }

    // Compute group bounding-box vertical center relative to this node
    const minY = Math.min(...selected.map((n) => n.position?.y ?? 0));
    const maxY = Math.max(
      ...selected.map(
        (n) => (n.position?.y ?? 0) + (n.measured?.height ?? 320),
      ),
    );
    const groupCenterY = (minY + maxY) / 2;
    const nodeY = me.position?.y ?? 0;

    return groupCenterY - nodeY;
  });
}

export function PlusHandle({
  nodeId,
  position,
  isVisible = false,
}: PlusHandleProps) {
  const groupHandle = useGroupHandle(nodeId, position);

  const isGroupMode = groupHandle !== null;
  const hideForGroup = groupHandle === false;
  const effectiveVisible = hideForGroup ? false : isVisible;

  // In group mode, position at the group's vertical center; otherwise node center
  const topValue =
    isGroupMode && typeof groupHandle === 'number'
      ? `${groupHandle}px`
      : '50%';

  const positionStyles: React.CSSProperties =
    position === Position.Left
      ? { left: '-40px', top: topValue }
      : { right: '-40px', top: topValue };

  const handleId = position === Position.Right ? 'plus-output' : 'plus-input';
  const handleType = position === Position.Right ? 'source' : 'target';

  return (
    <div
      className={cn(
        'absolute z-10 transition-all duration-300 ease-out',
        effectiveVisible
          ? 'opacity-100 translate-y-[-50%] translate-x-0'
          : position === Position.Left
            ? 'opacity-0 pointer-events-none translate-y-[-50%] translate-x-5'
            : 'opacity-0 pointer-events-none translate-y-[-50%] -translate-x-5',
      )}
      style={positionStyles}
    >
      <Magnetic
        intensity={0.5}
        range={200}
        actionArea="parent"
        springOptions={{ stiffness: 200, damping: 10, mass: 0.1 }}
      >
        <Handle
          type={handleType}
          position={position}
          id={handleId}
          isConnectable={true}
          className={cn(
            'nopan nodrag group',
            '!relative !transform-none !inset-auto',
            '!w-5 !h-5 !rounded-full',
            '!bg-transparent !border-2 !border-muted-foreground',
            '!flex !items-center !justify-center',
            'hover:!border-foreground hover:!scale-110',
            'active:!scale-95',
            '!transition-all !duration-200 !ease-out',
            '!backdrop-blur-sm',
            '!cursor-plus active:!cursor-grabbing',
            'focus:!outline-none',
          )}
        >
          <Plus
            className={cn(
              'size-3 text-muted-foreground',
              'group-hover:text-foreground',
              'transition-colors duration-300',
              'pointer-events-none',
            )}
            strokeWidth={3}
          />
          <div
            className={cn(
              'absolute inset-0 w-5 h-5 rounded-full',
              'bg-muted/20 blur-sm',
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-300',
              '-z-10',
            )}
          />
        </Handle>
      </Magnetic>
    </div>
  );
}
