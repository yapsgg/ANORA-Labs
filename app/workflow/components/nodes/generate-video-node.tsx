'use client';

import { type Node, NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';

import { WorkflowNodeData } from '@/app/workflow/components/nodes';
import { type VideoModel } from '../../model-data';
import { DEFAULT_VIDEO_NODE_PLACEHOLDER } from '../../settings';
import NodeWrapper from '../node-wrapper';
import { NodeLabel } from '../node-label';
import { NodeModelLabel } from '../node-model-label';
import { VideoToolbar } from '../toolbar/video-toolbar';
import { PlusHandle } from '../handles/plus-handle';
import { NodeBottom } from '../node-bottom';
import { CustomHandle } from '@/app/workflow/components/nodes/components/custom-handle';
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';
import {
  useVideoPlayback,
  VideoPreview,
  VideoControllerBar,
} from './components/video-controller';
import { useVideoNode } from './hooks/use-video-node';

export type GenerateVideoNodeType = Node<
  GenerateVideoNodeData,
  'generate-video-node'
>;

export type GenerateVideoNodeData = WorkflowNodeData & {
  config?: {
    model?: VideoModel;
    duration?: number;
    ratio?: string;
    resolution?: string;
  };
  video?: string;
  prompt?: string;
};

function GenerateVideoNode({
  id,
  data,
  selected,
}: NodeProps<GenerateVideoNodeType>) {
  const {
    isHovered, setIsHovered,
    setPrompt,
    isGenerating,
    isSaving,
    generationCount, setGenerationCount,
    model,
    duration, durations,
    ratio, ratios,
    resolution, resolutions,
    compatibleModels,
    nodeDimensions,
    effectivePrompt,
    isPromptFromUpstream,
    connectedImages,
    isMultiSelected,
    onModelChange,
    onDurationChange,
    onRatioChange,
    onResolutionChange,
    onLabelChange,
    handleSubmit,
    handleStop,
    handleConnectedImageClick,
  } = useVideoNode({ id, data });

  const {
    videoRef,
    isMuted,
    isPlaying,
    currentTime,
    videoDuration,
    handleSeek,
    togglePlayback,
    toggleMuted,
  } = useVideoPlayback(data?.video, isHovered);

  const visible = isHovered || !!selected;
  const bottomVisible = visible || !data?.video;

  return (
    <NodeWrapper
      selected={selected}
      setIsHovered={setIsHovered}
      width={nodeDimensions.width}
      minHeight={nodeDimensions.height}
      maxHeight={nodeDimensions.height}
    >
      <NodeLabel value={data?.label} onChange={onLabelChange}>Video</NodeLabel>
      <NodeModelLabel modelId={model} />

      <VideoToolbar
        nodeId={id}
        model={model}
        duration={duration}
        durationOptions={durations}
        ratio={ratio}
        ratioOptions={ratios}
        resolution={resolution}
        resolutionOptions={resolutions}
        videoUrl={data?.video}
        isVisible={visible && !isMultiSelected}
        onModelChange={onModelChange}
        onDurationChange={onDurationChange}
        onRatioChange={onRatioChange}
        onResolutionChange={onResolutionChange}
        availableModelIds={compatibleModels.map((m) => m.id)}
      />

      {data?.error && (
        <div className="px-2 pt-2 flex items-center justify-center">
          <div className="text-xs text-destructive">
            Model in peak time. Upgrade your plan to continue.
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 items-center justify-center min-h-0 overflow-hidden relative">
        {data?.video ? (
          <VideoPreview
            videoRef={videoRef}
            src={data.video}
            isMuted={isMuted}
            isVisible={visible}
            isSaving={isSaving}
            onToggleMuted={toggleMuted}
            savingOverlay={
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <TextShimmer className="text-xs text-white" duration={1}>
                  Saving...
                </TextShimmer>
              </div>
            }
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            {isGenerating ? (
              <TextShimmer className="text-xs text-muted-foreground" duration={1}>
                Generating video...
              </TextShimmer>
            ) : null}
          </div>
        )}
      </div>

      {data?.video && (
        <VideoControllerBar
          isVisible={visible && !isMultiSelected}
          width={nodeDimensions.width}
          isPlaying={isPlaying}
          currentTime={currentTime}
          videoDuration={videoDuration}
          onTogglePlayback={togglePlayback}
          onSeek={handleSeek}
        />
      )}

      <NodeBottom
        value={effectivePrompt}
        onValueChange={setPrompt}
        onSubmit={handleSubmit}
        isGenerating={isGenerating}
        onStop={handleStop}
        placeholders={DEFAULT_VIDEO_NODE_PLACEHOLDER}
        isVisible={bottomVisible}
        isHovered={isHovered}
        selected={!!selected}
        disabled={isPromptFromUpstream}
        nodeId={id}
        nodeType="video"
        connectedImages={connectedImages}
        onConnectedImageClick={handleConnectedImageClick}
        generationCount={generationCount}
        onGenerationCountChange={setGenerationCount}
      />

      <CustomHandle
        id="input"
        type="target"
        position={Position.Left}
        isVisible={isHovered || selected}
      />
      <CustomHandle
        id="output"
        type="source"
        position={Position.Right}
        isVisible={isHovered || selected}
      />

      <PlusHandle nodeId={id} position={Position.Left} isVisible={visible} />
      <PlusHandle nodeId={id} position={Position.Right} isVisible={visible} />
    </NodeWrapper>
  );
}

export default memo(GenerateVideoNode) as typeof GenerateVideoNode;
