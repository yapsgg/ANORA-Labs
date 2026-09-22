'use client';

import { useState } from 'react';
import { Thermometer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

interface TemperatureActionProps {
  value: number;
  onChange: (temperature: number) => void;
}

export function TemperatureAction({ value, onChange }: TemperatureActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          title="Temperature"
        >
          <Thermometer className="size-3.5" />
          <span>{value.toFixed(1)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Temperature</span>
            <span className="text-xs text-muted-foreground">{value.toFixed(1)}</span>
          </div>
          <Slider
            value={[value]}
            max={2}
            step={0.1}
            onValueChange={(v) => onChange(v[0])}
            className="w-full [&_[data-slot=slider-track]]:h-0.5 [&_[data-slot=slider-thumb]]:size-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
