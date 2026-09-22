'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Image as ImageIcon, Type, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MentionItem, MentionNodeType } from '../hooks/use-mention';
import { cn } from '@/lib/utils';

interface MentionDropdownProps {
  items: MentionItem[];
  selectedIndex: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  caretPosition: { top: number; left: number };
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
}

const NODE_TYPE_ICON: Record<MentionNodeType, LucideIcon> = {
  text: Type,
  image: ImageIcon,
  video: Video,
};

export function MentionDropdown({
  items,
  selectedIndex,
  textareaRef,
  caretPosition,
  onSelect,
  onClose,
}: MentionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const textarea = textareaRef.current;

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  if (!textarea) return null;

  const rect = textarea.getBoundingClientRect();
  const left = rect.left + caretPosition.left;
  const top = rect.top + caretPosition.top;

  const dropdown = (
    <div
      ref={dropdownRef}
      className="nopan nodrag nowheel fixed z-[9999] min-w-[220px] max-w-[280px] bg-popover border border-border shadow-md rounded-md overflow-hidden"
      style={{
        left: `${left}px`,
        bottom: `${window.innerHeight - top}px`,
      }}
    >
      <div className="max-h-[240px] overflow-y-auto py-1">
        {items.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            No nodes available
          </div>
        ) : (
          items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const TypeIcon = item.nodeType
              ? NODE_TYPE_ICON[item.nodeType]
              : null;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50',
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(item);
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    className="w-5 h-5 rounded-sm object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                    {TypeIcon ? (
                      <TypeIcon className="w-3 h-3 text-muted-foreground" />
                    ) : null}
                  </div>
                )}
                <span className="truncate flex-1">{item.label}</span>
                {item.alreadyConnected && (
                  <Check className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return createPortal(dropdown, document.body);
}
