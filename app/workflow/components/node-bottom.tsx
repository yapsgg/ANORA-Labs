'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ChatInput } from './node-input';
import {
  ConnectedImagePreviews,
  type ConnectedImage,
} from './nodes/components/connected-image-previews';

interface NodeBottomProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  onStop: () => void;
  placeholders?: string[];
  isVisible: boolean;
  isHovered?: boolean;
  selected?: boolean;
  disabled?: boolean;
  nodeId: string;
  nodeType?: 'text' | 'image' | 'video';
  connectedImages?: ConnectedImage[];
  /** Callback when a connected image preview is clicked */
  onConnectedImageClick?: (nodeId: string) => void;
  generationCount?: number;
  onGenerationCountChange?: (count: number) => void;
}

export function NodeBottom({
  value,
  onValueChange,
  onSubmit,
  isGenerating,
  onStop,
  placeholders = [],
  isVisible,
  isHovered = false,
  selected = false,
  disabled = false,
  nodeId,
  nodeType = 'text',
  connectedImages = [],
  onConnectedImageClick,
  generationCount,
  onGenerationCountChange,
}: NodeBottomProps) {
  const hasConnectedImages = connectedImages.length > 0;

  return (
    <div className="flex-none w-full absolute bottom-0 left-0 overflow-hidden">
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] } }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0 rounded-b-lg pointer-events-none"
            style={{
              backdropFilter:
                nodeType !== 'text' ? 'blur(0px)' : 'blur(2px)',
              background:
                nodeType !== 'text'
                  ? 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))'
                  : 'linear-gradient(to top, hsl(var(--card) / 0.85), hsl(var(--card) / 0.4), transparent)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat input — slides up from behind the node's bottom edge */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.32, ease: [0.55, 0, 1, 0.45] } }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative pb-0 pt-0"
          >
            {/* Connected images preview */}
            {hasConnectedImages && (
              <ConnectedImagePreviews
                images={connectedImages}
                currentNodeId={nodeId}
                className="mb-1"
                onImageClick={onConnectedImageClick}
              />
            )}
            <ChatInput
              value={value}
              onValueChange={onValueChange}
              onSend={onSubmit}
              isSubmitting={isGenerating}
              stop={onStop}
              status={isGenerating ? 'generating' : 'completed'}
              isHovered={isHovered}
              selected={selected}
              readOnly={disabled}
              placeholders={placeholders}
              showDetails={isVisible}
              nodeId={nodeId}
              nodeType={nodeType}
              generationCount={generationCount}
              onGenerationCountChange={onGenerationCountChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
