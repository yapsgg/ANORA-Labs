'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

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

interface RatioActionProps {
  value: string;
  onChange: (ratio: string) => void;
  options: string[];
}

export function RatioAction({ value, onChange, options }: RatioActionProps) {
  const [open, setOpen] = useState(false);

  if (options.length <= 1) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          title="Select ratio"
        >
          <span>{value}</span>
          <ChevronDown className={cn("size-3 opacity-50", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-32 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup heading="Aspect ratio">
              {options.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <span className="text-sm">{opt}</span>
                  {opt === value && (
                    <Check className="size-3.5 ml-auto text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
