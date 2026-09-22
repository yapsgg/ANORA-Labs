'use client';

import { useState } from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandList, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

import { ModelAction } from './toolbar-actions/model-action';
import { SizeAction } from './toolbar-actions/size-action';
import { FullscreenAction } from './toolbar-actions/fullscreen-action';
import { ToolsAction } from './toolbar-actions/tools-action';
import { ResetOriginalAction } from './toolbar-actions/reset-original-action';
import { DownloadAction } from './toolbar-actions/download-action';
import { ReplaceImageAction } from './toolbar-actions/replace-image-action';
import { NodeMenuAction } from './toolbar-actions/node-menu-action';

/** Lightweight resolution picker for image models (0.5K / 1K / 2K / 4K) */
function ImageResolutionAction({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" title="Select resolution">
          {value}
          <ChevronDown className={cn("size-3 opacity-50", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup heading="Resolution">
              {options.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => { onChange(opt); setOpen(false); }}
                >
                  <span className="text-sm">{opt}</span>
                  {opt === value && <Check className="size-3.5 ml-auto text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ImageToolbarProps {
  nodeId: string;
  model: string;
  size: string;
  sizeOptions: string[];
  resolution?: string;
  resolutionOptions?: string[];
  onResolutionChange?: (resolution: string) => void;
  imageUrl?: string;
  isVisible?: boolean;
  isCropping?: boolean;
  hasOriginalImage?: boolean;
  onModelChange: (model: string) => void;
  onSizeChange: (size: string) => void;
  onToggleCrop?: () => void;
  onSplitIntoGrids?: (rows: number, cols: number) => void;
  onResetToOriginal?: () => void;
  /** Optional list of model IDs to filter the model selector */
  availableModelIds?: string[];
  hasUploadedImage?: boolean;
  onReplaceImage?: (file: File) => void;
  isReplacingImage?: boolean;
  auto?: boolean;
  onAutoChange?: (auto: boolean) => void;
}

export function ImageToolbar({
  nodeId,
  model,
  size,
  sizeOptions,
  resolution,
  resolutionOptions,
  onResolutionChange,
  imageUrl,
  isVisible = false,
  isCropping = false,
  hasOriginalImage = false,
  onModelChange,
  onSizeChange,
  onToggleCrop,
  onSplitIntoGrids,
  onResetToOriginal,
  availableModelIds,
  hasUploadedImage = false,
  onReplaceImage,
  isReplacingImage,
  auto,
  onAutoChange,
}: ImageToolbarProps) {
  return (
    <NodeToolbar isVisible={isVisible} position={Position.Top} offset={30}>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              key={nodeId}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', transition: { duration: 0.32, ease: [0.55, 0, 1, 0.45] } }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-0.5 rounded-xl border bg-card p-1 shadow-lg backdrop-blur-sm"
            >
            {!hasUploadedImage && (
              <>
                <ModelAction
                  value={model}
                  onChange={onModelChange}
                  type="image"
                  availableModelIds={availableModelIds}
                  auto={auto}
                  onAutoChange={onAutoChange}
                />
                <div className="h-4 w-px bg-border" />
              </>
            )}
            {sizeOptions.length > 1 && (
              <>
                <SizeAction value={size} onChange={onSizeChange} options={sizeOptions} />
                <div className="h-4 w-px bg-border" />
              </>
            )}
            {resolutionOptions && resolutionOptions.length > 1 && resolution && onResolutionChange && (
              <>
                <ImageResolutionAction value={resolution} onChange={onResolutionChange} options={resolutionOptions} />
                <div className="h-4 w-px bg-border" />
              </>
            )}
            {imageUrl && onReplaceImage && (
              <ReplaceImageAction onReplace={onReplaceImage} isUploading={isReplacingImage} />
            )}
            <FullscreenAction url={imageUrl} alt="Generated image" />
            {(onToggleCrop || onSplitIntoGrids) && (
              <ToolsAction
                url={imageUrl}
                isCropping={isCropping}
                onToggleCrop={onToggleCrop}
                onSplitIntoGrids={onSplitIntoGrids}
              />
            )}
            {hasOriginalImage && onResetToOriginal && (
              <ResetOriginalAction onReset={onResetToOriginal} />
            )}
            <DownloadAction url={imageUrl} filename="image.png" type="image" />
            <NodeMenuAction nodeId={nodeId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NodeToolbar>
  );
}
