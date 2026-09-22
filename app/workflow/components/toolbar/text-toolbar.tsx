'use client';

import { NodeToolbar, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';

import { ModelAction } from './toolbar-actions/model-action';
import { TemperatureAction } from './toolbar-actions/temperature-action';
import { NodeMenuAction } from './toolbar-actions/node-menu-action';

interface TextToolbarProps {
  nodeId: string;
  model: string;
  temperature: number;
  isVisible?: boolean;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  /** Optional list of model IDs to filter to (e.g., vision-capable models) */
  availableModelIds?: string[];
  auto?: boolean;
  onAutoChange?: (auto: boolean) => void;
}

export function TextToolbar({
  nodeId,
  model,
  temperature,
  isVisible = false,
  onModelChange,
  onTemperatureChange,
  availableModelIds,
  auto,
  onAutoChange,
}: TextToolbarProps) {
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
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-0.5 rounded-xl border bg-card p-1 shadow-lg backdrop-blur-sm"
            >
              <ModelAction
                value={model}
                onChange={onModelChange}
                type="text"
                availableModelIds={availableModelIds}
                auto={auto}
                onAutoChange={onAutoChange}
              />
              <div className="h-4 w-px bg-border" />
              <TemperatureAction
                value={temperature}
                onChange={onTemperatureChange}
              />
              <div className="h-4 w-px bg-border" />
              <NodeMenuAction nodeId={nodeId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NodeToolbar>
  );
}
