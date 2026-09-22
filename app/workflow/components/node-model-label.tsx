'use client';

import { NodeToolbar as INodeToolbar, Position, useStore } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { Label } from '@/components/ui/label';
import { getBaseModelConfig } from '../model-data';

interface NodeModelLabelProps {
  modelId: string;
}

const ZOOM_LABEL_THRESHOLD = 0.5;

/** Strip the registry's "Provider: Model" prefix so the chip just says "Model". */
function stripProviderPrefix(name: string, provider: string): string {
  const prefix = `${provider}: `;
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

export function NodeModelLabel({ modelId }: NodeModelLabelProps) {
  const zoom = useStore((s) => s.transform[2]);
  // getBaseModelConfig resolves `:nitro` variants back to the base entry.
  const modelConfig = getBaseModelConfig(modelId);
  const displayName = modelConfig
    ? stripProviderPrefix(modelConfig.name, modelConfig.provider)
    : modelId;

  const isLabelVisible = zoom >= ZOOM_LABEL_THRESHOLD;

  return (
    <INodeToolbar isVisible={isLabelVisible} position={Position.Top} align="end" offset={2}>
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
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {displayName}
                </Label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </INodeToolbar>
  );
}
