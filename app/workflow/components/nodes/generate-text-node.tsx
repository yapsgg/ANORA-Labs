'use client';

import { type Node, NodeProps, Position, NodeResizer } from '@xyflow/react';
import { memo } from 'react';

import { WorkflowNodeData } from '@/app/workflow/components/nodes';
import { type TextModel } from '../../model-data';
import { DEFAULT_TEXT_NODE_PLACEHOLDER } from '../../settings';
import NodeWrapper from '../node-wrapper';
import { NodeLabel } from '../node-label';
import { NodeModelLabel } from '../node-model-label';
import { TextToolbar } from '../toolbar/text-toolbar';
import { PlusHandle } from '../handles/plus-handle';
import { NodeBottom } from '../node-bottom';
import { CustomHandle } from '@/app/workflow/components/nodes/components/custom-handle';
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';
import { useTextNode } from './hooks/use-text-node';

export type GenerateTextNodeType = Node<
  GenerateTextNodeData,
  'generate-text-node'
>;

export type GenerateTextNodeData = WorkflowNodeData & {
  config?: {
    model?: TextModel;
    temperature?: number;
    /** When true, submits via OpenRouter Auto Router instead of `model`. */
    auto?: boolean;
  };
  text?: string;
  prompt?: string;
  width?: number;
  height?: number;
};

function GenerateTextNode({
  id,
  data,
  selected,
}: NodeProps<GenerateTextNodeType>) {
  const {
    isHovered, setIsHovered,
    prompt, setPrompt,
    bodyText,
    isGenerating,
    model,
    temperature,
    availableModelIds,
    hasConnectedImages,
    connectedImages,
    isMultiSelected,
    nodeWidth, nodeHeight,
    auto,
    onAutoChange,
    onModelChange,
    onTemperatureChange,
    onLabelChange,
    handleBodyChange,
    handleSubmit,
    handleStop,
    onResize,
  } = useTextNode({ id, data });

  const visible = isHovered || !!selected;

  return (
    <NodeWrapper
      selected={selected}
      setIsHovered={setIsHovered}
      width={nodeWidth}
      minHeight={nodeHeight}
      maxHeight={nodeHeight}
    >
      <NodeResizer
        isVisible={true}
        minWidth={320}
        minHeight={320}
        maxWidth={800}
        maxHeight={800}
        onResize={onResize}
        lineStyle={{
          borderWidth: 10,
          borderColor: 'transparent',
        }}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: 'hsl(var(--muted-foreground))',
          border: '2px solid hsl(var(--background))',
        }}
      />
      <NodeLabel value={data?.label} onChange={onLabelChange}>Text</NodeLabel>
      <NodeModelLabel modelId={model} />

      <TextToolbar
        nodeId={id}
        model={model}
        temperature={temperature}
        isVisible={visible && !isMultiSelected}
        onModelChange={onModelChange}
        onTemperatureChange={onTemperatureChange}
        availableModelIds={availableModelIds}
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

      <div className="flex flex-col flex-1 min-h-0 px-2 pb-16 relative">
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-md">
            <TextShimmer className="text-xs text-muted-foreground" duration={1}>
              {hasConnectedImages ? 'Analyzing image...' : 'Generating text...'}
            </TextShimmer>
          </div>
        )}
        <textarea
          value={bodyText}
          onChange={handleBodyChange}
          placeholder={selected ? "Type or paste context here..." : ""}
          className="nodrag nowheel flex-1 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      <NodeBottom
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={handleSubmit}
        isGenerating={isGenerating}
        onStop={handleStop}
        placeholders={DEFAULT_TEXT_NODE_PLACEHOLDER}
        isVisible={true}
        isHovered={isHovered}
        selected={!!selected}
        nodeId={id}
        nodeType="text"
        connectedImages={hasConnectedImages ? connectedImages : undefined}
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

export default memo(GenerateTextNode) as typeof GenerateTextNode;
