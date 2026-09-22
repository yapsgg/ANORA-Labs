'use client';

import { type Node, NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';

import { WorkflowNodeData } from '@/app/workflow/components/nodes';
import { type ImageModel, type SizeOption } from '../../model-data';
import { DEFAULT_IMAGE_NODE_PLACEHOLDER } from '../../settings';
import NodeWrapper from '../node-wrapper';
import { NodeLabel } from '../node-label';
import { NodeModelLabel } from '../node-model-label';
import { ImageToolbar } from '../toolbar/image-toolbar';
import { InlineCropOverlay } from './components/inline-crop-overlay';
import { PlusHandle } from '../handles/plus-handle';
import { NodeBottom } from '../node-bottom';
import { CustomHandle } from '@/app/workflow/components/nodes/components/custom-handle';
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';
import { cn } from '@/lib/utils';
import { useImageNode } from './hooks/use-image-node';

export type GenerateImageNodeType = Node<
  GenerateImageNodeData,
  'generate-image-node'
>;

export type GenerateImageNodeData = WorkflowNodeData & {
  config?: {
    model?: ImageModel;
    size?: SizeOption;
    resolution?: string;
    /** When true, the resolver picks a model based on connected upstream media. */
    auto?: boolean;
  };
  image?: string;
  /** Original image URL before any cropping - used as reference for re-cropping */
  originalImage?: string;
  prompt?: string;
  /** True when image was uploaded/dropped/pasted (not generated) */
  isUploaded?: boolean;
};

function GenerateImageNode({
  id,
  data,
  selected,
}: NodeProps<GenerateImageNodeType>) {
  const {
    isHovered, setIsHovered,
    setPrompt,
    isGenerating,
    isCropping,
    isUploading,
    isReplacing,
    generationCount, setGenerationCount,
    model,
    size, sizes,
    resolution, imageResolutions,
    compatibleModels,
    nodeDimensions,
    imageSrc,
    cropSourceUrl,
    effectivePrompt,
    isPromptFromUpstream,
    connectedImages,
    isMultiSelected,
    hasUploadedImage,
    auto,
    onAutoChange,
    onModelChange,
    onSizeChange,
    onResolutionChange,
    onLabelChange,
    handleSubmit,
    handleStop,
    handleConnectedImageClick,
    handleToggleCrop,
    handleCropComplete,
    handleCropCancel,
    handleSplitIntoGrids,
    handleResetToOriginal,
    handleReplaceImage,
  } = useImageNode({ id, data });

  const visible = isHovered || !!selected;
  const bottomVisible = visible || !data?.image;

  return (
    <NodeWrapper
      selected={selected}
      setIsHovered={setIsHovered}
      width={nodeDimensions.width}
      minHeight={nodeDimensions.height}
      maxHeight={nodeDimensions.height}
    >
      <NodeLabel value={data?.label} onChange={onLabelChange}>Image</NodeLabel>
      <NodeModelLabel modelId={model} />

      <ImageToolbar
        nodeId={id}
        model={model}
        size={size}
        sizeOptions={sizes}
        imageUrl={imageSrc}
        isVisible={visible && !isCropping && !isMultiSelected}
        isCropping={isCropping}
        hasOriginalImage={!!data?.originalImage}
        onModelChange={onModelChange}
        onSizeChange={onSizeChange}
        resolution={resolution}
        resolutionOptions={imageResolutions}
        onResolutionChange={onResolutionChange}
        onToggleCrop={imageSrc ? handleToggleCrop : undefined}
        onSplitIntoGrids={imageSrc ? handleSplitIntoGrids : undefined}
        onResetToOriginal={data?.originalImage ? handleResetToOriginal : undefined}
        availableModelIds={compatibleModels.map((m) => m.id)}
        hasUploadedImage={hasUploadedImage}
        onReplaceImage={handleReplaceImage}
        isReplacingImage={isReplacing}
        auto={auto}
        onAutoChange={onAutoChange}
      />

      {data?.error && (
        <div className="px-2 pt-2 flex items-center justify-center">
          <div className="text-xs text-destructive">
            Model in peak time. Upgrade your plan to continue.
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex flex-col flex-1 items-center justify-center min-h-0 overflow-hidden relative rounded-md',
          isCropping && 'nodrag',
        )}
      >
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt="Generated image"
              className="w-full h-full object-cover"
            />
            {isCropping && cropSourceUrl && (
              <InlineCropOverlay
                imageUrl={cropSourceUrl}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
              />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                <TextShimmer className="text-xs text-white" duration={1}>
                  Saving...
                </TextShimmer>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            {data?.status === 'loading' && !effectivePrompt ? (
              <TextShimmer className="text-xs text-muted-foreground" duration={1}>
                Uploading...
              </TextShimmer>
            ) : isGenerating ? (
              <TextShimmer className="text-xs text-muted-foreground" duration={1}>
                Generating image...
              </TextShimmer>
            ) : null}
          </div>
        )}
      </div>

      {!hasUploadedImage && (
        <NodeBottom
          value={effectivePrompt}
          onValueChange={setPrompt}
          onSubmit={handleSubmit}
          isGenerating={isGenerating}
          onStop={handleStop}
          placeholders={DEFAULT_IMAGE_NODE_PLACEHOLDER}
          isVisible={bottomVisible && !isCropping}
          isHovered={isHovered}
          selected={!!selected}
          disabled={isPromptFromUpstream}
          nodeId={id}
          nodeType="image"
          connectedImages={connectedImages}
          onConnectedImageClick={handleConnectedImageClick}
          generationCount={generationCount}
          onGenerationCountChange={setGenerationCount}
        />
      )}

      {!hasUploadedImage && (
        <CustomHandle
          id="input"
          type="target"
          position={Position.Left}
          isVisible={(isHovered || selected) && !isCropping}
        />
      )}
      <CustomHandle
        id="output"
        type="source"
        position={Position.Right}
        isVisible={(isHovered || selected) && !isCropping}
      />

      {!hasUploadedImage && (
        <PlusHandle nodeId={id} position={Position.Left} isVisible={visible && !isCropping} />
      )}
      <PlusHandle nodeId={id} position={Position.Right} isVisible={visible && !isCropping} />
    </NodeWrapper>
  );
}

export default memo(GenerateImageNode) as typeof GenerateImageNode;
