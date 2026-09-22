'use client';

import { useState } from 'react';
import { ImageUp } from 'lucide-react';

import { nodesConfig } from '@/app/workflow/config';
import { iconMapping } from '@/app/workflow/utils/icon-mapping';
import { type WorkflowNodeType } from '@/app/workflow/components/nodes';
import { NODE_SHORTCUTS } from '@/lib/shortcuts';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

export interface BlockPickerNode {
  id: string;
  label: string;
  type: string;
}

interface BlockPickerProps {
  heading?: string;
  onSelectBlock: (type: string) => void;
  onUploadImage?: () => void;
  autoFocus?: boolean;
  nodes?: BlockPickerNode[];
  onSelectNode?: (nodeId: string) => void;
}

function truncateLabel(label: string, max = 10): string {
  return label.length > max ? label.slice(0, max) + '\u2026' : label;
}

export function BlockPicker({
  heading = 'Add Block',
  onSelectBlock,
  onUploadImage,
  autoFocus = true,
  nodes,
  onSelectNode,
}: BlockPickerProps) {
  const [search, setSearch] = useState('');
  const isNodeSearch = search.startsWith('@');
  const nodeQuery = search.slice(1).trim().toLowerCase();

  // Manually filter existing nodes when in "@" mode
  const filteredNodes = isNodeSearch && nodes
    ? nodes.filter((n) => !nodeQuery || n.label.toLowerCase().includes(nodeQuery))
    : [];

  const hasNodes = nodes && nodes.length > 0;
  const placeholder = hasNodes ? 'Search blocks or @ for nodes\u2026' : 'Search blocks\u2026';

  return (
    <Command className="rounded-md" shouldFilter={!isNodeSearch}>
      <CommandInput
        placeholder={placeholder}
        value={search}
        onValueChange={setSearch}
        autoFocus={autoFocus}
      />
      <CommandList>
        {/* ── Normal mode: block types + upload ── */}
        {!isNodeSearch && (
          <>
            <CommandEmpty>No blocks found.</CommandEmpty>
            <CommandGroup heading={heading}>
              {Object.values(nodesConfig).map((item) => {
                const Icon = item.icon ? iconMapping[item.icon] : null;
                const shortcut = NODE_SHORTCUTS[item.id];
                return (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => onSelectBlock(item.id)}
                  >
                    {Icon && <Icon className="size-4 text-muted-foreground" />}
                    <span>{item.title}</span>
                    {shortcut && <CommandShortcut>{shortcut.display}</CommandShortcut>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {onUploadImage && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Upload">
                  <CommandItem value="Upload Image" onSelect={onUploadImage}>
                    <ImageUp className="size-4 text-muted-foreground" />
                    <span>Upload Image</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
        )}

        {/* ── "@" mode: existing nodes ── */}
        {isNodeSearch && (
          filteredNodes.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No matching nodes.
            </div>
          ) : (
            <CommandGroup heading="Connect to Existing">
              {filteredNodes.map((node) => {
                const config = nodesConfig[node.type as WorkflowNodeType];
                const Icon = config?.icon ? iconMapping[config.icon] : null;
                return (
                  <CommandItem
                    key={node.id}
                    value={node.label}
                    onSelect={() => onSelectNode?.(node.id)}
                  >
                    {Icon && <Icon className="size-4 text-muted-foreground" />}
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                    >
                      {truncateLabel(node.label)}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )
        )}
      </CommandList>
    </Command>
  );
}
