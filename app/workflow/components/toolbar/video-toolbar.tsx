'use client';

import { NodeToolbar, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';

import { ModelAction } from './toolbar-actions/model-action';
import { DurationAction } from './toolbar-actions/duration-action';
import { RatioAction } from './toolbar-actions/ratio-action';
import { ResolutionAction } from './toolbar-actions/resolution-action';
import { DownloadAction } from './toolbar-actions/download-action';
import { NodeMenuAction } from './toolbar-actions/node-menu-action';

interface VideoToolbarProps {
  nodeId: string;
  model: string;
  duration: number;
  durationOptions: number[];
  ratio: string;
  ratioOptions: string[];
  resolution: string;
  resolutionOptions: string[];
  videoUrl?: string;
  isVisible?: boolean;
  onModelChange: (model: string) => void;
  onDurationChange: (duration: string) => void;
  onRatioChange: (ratio: string) => void;
  onResolutionChange: (resolution: string) => void;
  availableModelIds?: string[];
}

export function VideoToolbar({
  nodeId,
  model,
  duration,
  durationOptions,
  ratio,
  ratioOptions,
  resolution,
  resolutionOptions,
  videoUrl,
  isVisible = false,
  onModelChange,
  onDurationChange,
  onRatioChange,
  onResolutionChange,
  availableModelIds,
}: VideoToolbarProps) {
  return (
    <NodeToolbar isVisible={isVisible} position={Position.Top} offset={40}>
      <div className="overflow-hidden">
        <AnimatePresence>
          {isVisible && (
            <motion.div
              key={nodeId}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', transition: { duration: 0.32, ease: [0.55, 0, 1, 0.45] } }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-0.5 rounded-xl border bg-card p-1 shadow-lg backdrop-blur-sm"
            >
              <ModelAction value={model} onChange={onModelChange} type="video" availableModelIds={availableModelIds} />
              <div className="h-4 w-px bg-border" />
              <DurationAction value={duration} onChange={onDurationChange} options={durationOptions} />
              <RatioAction value={ratio} onChange={onRatioChange} options={ratioOptions} />
              <ResolutionAction value={resolution} onChange={onResolutionChange} options={resolutionOptions} />
              <div className="h-4 w-px bg-border" />
              <DownloadAction url={videoUrl} filename="video.mp4" type="video" />
              <NodeMenuAction nodeId={nodeId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NodeToolbar>
  );
}
