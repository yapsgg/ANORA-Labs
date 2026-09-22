'use client';

import { useState, useMemo } from 'react';
import { Square, RectangleHorizontal, RectangleVertical, Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface SizeActionProps {
  value: string;
  onChange: (size: string) => void;
  options: string[];
}

type Orientation = 'square' | 'landscape' | 'portrait';

function getSizeOrientation(size: string): Orientation {
  const ratioParts = size.split(':');
  if (ratioParts.length === 2) {
    const [w, h] = ratioParts.map(Number);
    if (!isNaN(w) && !isNaN(h)) {
      if (w === h) return 'square';
      return w > h ? 'landscape' : 'portrait';
    }
  }
  const parts = size.split('x');
  if (parts.length !== 2) return 'square';
  const [w, h] = parts.map(Number);
  if (w === h) return 'square';
  return w > h ? 'landscape' : 'portrait';
}

const orientationIcons: Record<Orientation, LucideIcon> = {
  square: Square,
  landscape: RectangleHorizontal,
  portrait: RectangleVertical,
};

export function SizeAction({ value, onChange, options }: SizeActionProps) {
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => {
    const square: string[] = [];
    const horizontal: string[] = [];
    const vertical: string[] = [];

    for (const opt of options) {
      const o = getSizeOrientation(opt);
      if (o === 'square') square.push(opt);
      else if (o === 'landscape') horizontal.push(opt);
      else vertical.push(opt);
    }

    return { square, horizontal, vertical };
  }, [options]);

  if (options.length <= 1) return null;

  const currentOrientation = getSizeOrientation(value);
  const CurrentIcon = orientationIcons[currentOrientation];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          title={value}
        >
          <span>{value}</span>
          <ChevronDown className={cn("size-3 opacity-50", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
        <Command>
          <CommandList>
            {groups.square.length > 0 && (
              <CommandGroup heading="Square">
                {groups.square.map((opt) => (
                  <SizeItem
                    key={opt}
                    id={opt}
                    orientation="square"
                    selected={opt === value}
                    onSelect={() => { onChange(opt); setOpen(false); }}
                  />
                ))}
              </CommandGroup>
            )}
            {groups.horizontal.length > 0 && (
              <CommandGroup heading="Horizontal">
                {groups.horizontal.map((opt) => (
                  <SizeItem
                    key={opt}
                    id={opt}
                    orientation="landscape"
                    selected={opt === value}
                    onSelect={() => { onChange(opt); setOpen(false); }}
                  />
                ))}
              </CommandGroup>
            )}
            {groups.vertical.length > 0 && (
              <CommandGroup heading="Vertical">
                {groups.vertical.map((opt) => (
                  <SizeItem
                    key={opt}
                    id={opt}
                    orientation="portrait"
                    selected={opt === value}
                    onSelect={() => { onChange(opt); setOpen(false); }}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SizeItem({
  id,
  orientation,
  selected,
  onSelect,
}: {
  id: string;
  orientation: Orientation;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = orientationIcons[orientation];
  return (
    <CommandItem value={id} onSelect={onSelect}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="text-sm">{id}</span>
      {selected && <Check className="size-3.5 ml-auto text-primary shrink-0" />}
    </CommandItem>
  );
}
