'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SHORTCUT_POINTER_CURSOR,
  SHORTCUT_POINTER_HAND,
  SHORTCUT_BLOCK_TEXT,
  SHORTCUT_BLOCK_IMAGE,
  SHORTCUT_BLOCK_VIDEO,
  SHORTCUT_BLOCK_COMMENT,
  SHORTCUT_UNDO,
  SHORTCUT_REDO,
  SHORTCUT_CUT,
  SHORTCUT_COPY,
  SHORTCUT_PASTE,
  SHORTCUT_DELETE,
  SHORTCUT_DUPLICATE,
  SHORTCUT_NODE_RUN,
  SHORTCUT_ESCAPE,
  SHORTCUT_ENTER,
  SHORTCUT_ENTER_NEWLINE,
  SHORTCUT_SAVE,
  SHORTCUT_SPOTLIGHT_SEARCH,
  type ShortcutDefinition,
} from '@/lib/shortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutDefinition[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: 'Tools',
    shortcuts: [
      SHORTCUT_POINTER_CURSOR,
      SHORTCUT_POINTER_HAND,
      SHORTCUT_BLOCK_TEXT,
      SHORTCUT_BLOCK_IMAGE,
      SHORTCUT_BLOCK_VIDEO,
      SHORTCUT_BLOCK_COMMENT,
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      SHORTCUT_UNDO,
      SHORTCUT_REDO,
      SHORTCUT_CUT,
      SHORTCUT_COPY,
      SHORTCUT_PASTE,
      SHORTCUT_DUPLICATE,
      SHORTCUT_DELETE,
    ],
  },
  {
    title: 'Node Actions',
    shortcuts: [
      SHORTCUT_NODE_RUN,
    ],
  },
  {
    title: 'General',
    shortcuts: [
      SHORTCUT_SAVE,
      SHORTCUT_SPOTLIGHT_SEARCH,
      SHORTCUT_ESCAPE,
      SHORTCUT_ENTER,
      SHORTCUT_ENTER_NEWLINE,
    ],
  },
];

function ShortcutKey({ shortcut }: { shortcut: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted border rounded shadow-sm">
      {shortcut}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDefinition }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{shortcut.label}</span>
      <ShortcutKey shortcut={shortcut.display} />
    </div>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {shortcutCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category.title}
                </h3>
                <div className="divide-y divide-border">
                  {category.shortcuts.map((shortcut, index) => (
                    <ShortcutRow key={`${category.title}-${index}`} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
