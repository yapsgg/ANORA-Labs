'use client';

import { ChevronDown, Crop, Grid2x2, PenTool } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const MAX_GRID_DIMENSION = 12;

interface ToolsActionProps {
  url?: string;
  isCropping?: boolean;
  onToggleCrop?: () => void;
  onSplitIntoGrids?: (rows: number, cols: number) => void;
}

export function ToolsAction({
  url,
  isCropping,
  onToggleCrop,
  onSplitIntoGrids,
}: ToolsActionProps) {
  const [open, setOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);

  if (!url) return null;

  const hasTools = Boolean(onToggleCrop || onSplitIntoGrids);
  if (!hasTools) return null;

  const handleSplitClick = () => {
    setRows(2);
    setCols(2);
    setOpen(false);
    setSplitOpen(true);
  };

  const handleApplySplit = () => {
    onSplitIntoGrids?.(rows, cols);
    setSplitOpen(false);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isCropping ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            title="Image tools"
          >
            <PenTool className="size-3.5" />
            <span>Tools</span>
            <ChevronDown className={cn("size-3 opacity-50", open && "rotate-180")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {onToggleCrop && (
            <DropdownMenuItem onClick={onToggleCrop}>
              <Crop />
              <span>{isCropping ? 'Exit crop' : 'Crop'}</span>
            </DropdownMenuItem>
          )}
          {onSplitIntoGrids && (
            <DropdownMenuItem onClick={handleSplitClick}>
              <Grid2x2 />
              <span>Split into grids</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={splitOpen} onOpenChange={setSplitOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Split into grids</DialogTitle>
            <DialogDescription>
              Split the image into a grid of tiles. Each tile becomes its own image node.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Rows</Label>
                <span className="text-xs font-medium">{rows}</span>
              </div>
              <Slider
                min={1}
                max={MAX_GRID_DIMENSION}
                step={1}
                value={[rows]}
                onValueChange={([v]) => setRows(v)}
                className="[&_[data-slot=slider-track]]:h-0.5 [&_[data-slot=slider-thumb]]:size-2.5"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Columns</Label>
                <span className="text-xs font-medium">{cols}</span>
              </div>
              <Slider
                min={1}
                max={MAX_GRID_DIMENSION}
                step={1}
                value={[cols]}
                onValueChange={([v]) => setCols(v)}
                className="[&_[data-slot=slider-track]]:h-0.5 [&_[data-slot=slider-thumb]]:size-2.5"
              />
            </div>
            <div
              className="grid gap-0.5 rounded-md border bg-border p-0.5 mx-auto aspect-square w-44"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
              }}
            >
              {Array.from({ length: rows * cols }).map((_, i) => (
                <div key={i} className="bg-muted rounded-[2px]" />
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setSplitOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApplySplit}>
              Split into {rows * cols} {rows * cols === 1 ? 'tile' : 'tiles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
