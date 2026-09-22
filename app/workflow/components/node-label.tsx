'use client';

import { useState, useRef, useEffect } from 'react';
import { NodeToolbar as INodeToolbar, Position, useStore } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { matchesShortcut, SHORTCUT_ENTER, SHORTCUT_ESCAPE } from '@/lib/shortcuts';

interface NodeLabelProps {
  children: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
}

const ZOOM_LABEL_THRESHOLD = 0.5;

export function NodeLabel({ children, value, onChange }: NodeLabelProps) {
  const zoom = useStore((s) => s.transform[2]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = value || children;
  const isEditable = !!onChange;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!isEditable) return;
    setEditValue(String(displayValue));
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onChange && editValue.trim() !== String(displayValue)) {
      onChange(editValue.trim() || String(children));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (matchesShortcut(e, SHORTCUT_ENTER)) {
      handleSave();
    } else if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
      setEditValue(String(displayValue));
      setIsEditing(false);
    }
  };

  const isLabelVisible = zoom >= ZOOM_LABEL_THRESHOLD;

  return (
    <INodeToolbar isVisible={isLabelVisible} position={Position.Top} align="start" offset={2}>
      <div className="overflow-hidden relative z-10">
        <AnimatePresence>
          {isLabelVisible && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', transition: { duration: 0.32, ease: [0.55, 0, 1, 0.45] } }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                placeholder="Enter title..."
                className="text-xs h-5 w-48 min-w-0 focus-visible:ring-0 border-none rounded-sm bg-none dark:bg-none"
              />
            ) : (
              <Label
                className={`text-xs text-muted-foreground truncate max-w-[120px] ${
                  isEditable ? 'cursor-pointer hover:text-foreground transition-colors' : ''
                }`}
                onDoubleClick={handleDoubleClick}
                title={isEditable ? 'Double-click to edit' : undefined}
              >
                {displayValue}
              </Label>
            )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </INodeToolbar>
  );
}
