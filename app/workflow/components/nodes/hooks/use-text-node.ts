'use client';

import { useReactFlow, useNodeConnections, useNodesData } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  AUTO_ROUTER_MODEL_ID,
  DEFAULT_TEMPERATURE,
  DEFAULT_TEXT_MODEL,
  TEXT_MODELS,
  getModelConfig,
} from '../../../model-data';
import { useConnectedImages } from '../../../hooks/use-connected-images';
import { useConnectedVideos } from '../../../hooks/use-connected-videos';
import { useBalance } from '../../../hooks/use-balance';
import { useIsMultiSelected } from '../../../hooks/use-multi-selection';
import { actualChatCost } from '@/lib/openrouter/pricing';
import { openSubscriptionModal } from '../../credits-panel';
import type { GenerateTextNodeData } from '../generate-text-node';

function isVisionCapable(modelId: string): boolean {
  const input = getModelConfig(modelId)?.input;
  return Array.isArray(input) && input.includes('text') && input.includes('image');
}

function isVideoCapable(modelId: string): boolean {
  const input = getModelConfig(modelId)?.input;
  return Array.isArray(input) && input.includes('video');
}

const VISION_CAPABLE_MODEL_IDS = TEXT_MODELS.filter((m) => isVisionCapable(m.id)).map((m) => m.id);
const VIDEO_CAPABLE_MODEL_IDS = TEXT_MODELS.filter((m) => isVideoCapable(m.id)).map((m) => m.id);

function pickDefaultModel(ids: string[]): string {
  return ids[0] ?? DEFAULT_TEXT_MODEL;
}

export function useTextNode({ id, data }: { id: string; data: GenerateTextNodeData | undefined }) {
  const { updateNodeData } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [prompt, setPrompt] = useState(data?.prompt ?? '');
  const [bodyText, setBodyText] = useState(data?.text ?? '');
  const [isGenerating, setIsGenerating] = useState(false);

  const connectedImages = useConnectedImages();
  const hasConnectedImages = connectedImages.length > 0;
  const connectedVideos = useConnectedVideos();
  const hasConnectedVideos = connectedVideos.length > 0;

  const { canAfford, debit } = useBalance();
  const isMultiSelected = useIsMultiSelected();

  const connections = useNodeConnections({ handleType: 'target', handleId: 'input' });
  const sourceNodeIds = useMemo(() => connections.map((c) => c.source), [connections]);
  const sourceNodesData = useNodesData(sourceNodeIds);

  useEffect(() => {
    if (data?.text !== undefined && data.text !== bodyText) {
      setBodyText(data.text);
    }
  }, [data?.text]);

  const model = data?.config?.model ?? DEFAULT_TEXT_MODEL;
  const temperature = data?.config?.temperature ?? DEFAULT_TEMPERATURE;
  // Auto mode defaults to ON for fresh text nodes; persisted nodes keep their flag.
  const auto = data?.config?.auto ?? true;

  const currentModelSupportsVision = useMemo(() => isVisionCapable(model), [model]);
  const currentModelSupportsVideo = useMemo(() => isVideoCapable(model), [model]);

  const availableModelIds = useMemo(() => {
    if (hasConnectedVideos) return VIDEO_CAPABLE_MODEL_IDS;
    if (hasConnectedImages) return VISION_CAPABLE_MODEL_IDS;
    return undefined;
  }, [hasConnectedVideos, hasConnectedImages]);

  const prevMediaKeyRef = useRef(`${connectedImages.length}:${connectedVideos.length}`);
  useEffect(() => {
    const key = `${connectedImages.length}:${connectedVideos.length}`;
    const changed = prevMediaKeyRef.current !== key;
    prevMediaKeyRef.current = key;
    if (!changed) return;
    // Auto mode delegates compatibility to OpenRouter; no local swap needed.
    if (auto) return;

    if (hasConnectedVideos && !currentModelSupportsVideo) {
      updateNodeData(id, {
        config: { ...data?.config, model: pickDefaultModel(VIDEO_CAPABLE_MODEL_IDS) },
      });
    } else if (hasConnectedImages && !currentModelSupportsVision) {
      updateNodeData(id, {
        config: { ...data?.config, model: pickDefaultModel(VISION_CAPABLE_MODEL_IDS) },
      });
    }
  }, [
    auto,
    connectedImages.length,
    connectedVideos.length,
    hasConnectedImages,
    hasConnectedVideos,
    currentModelSupportsVision,
    currentModelSupportsVideo,
    id,
    updateNodeData,
    data?.config,
  ]);

  const onModelChange = useCallback(
    (newModel: string) =>
      updateNodeData(id, { config: { ...data?.config, model: newModel } }),
    [updateNodeData, id, data?.config],
  );

  const onAutoChange = useCallback(
    (newAuto: boolean) =>
      updateNodeData(id, { config: { ...data?.config, auto: newAuto } }),
    [updateNodeData, id, data?.config],
  );

  const onTemperatureChange = useCallback(
    (newTemperature: number) =>
      updateNodeData(id, { config: { ...data?.config, temperature: newTemperature } }),
    [updateNodeData, id, data?.config],
  );

  const onLabelChange = useCallback(
    (newLabel: string) => updateNodeData(id, { label: newLabel }),
    [updateNodeData, id],
  );

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setBodyText(newText);
      updateNodeData(id, { text: newText });
    },
    [updateNodeData, id],
  );

  const gatherUpstreamContext = useCallback((): string => {
    const contextParts: string[] = [];
    for (const nd of sourceNodesData) {
      if (nd?.data && 'text' in nd.data && nd.data.text) {
        contextParts.push(nd.data.text as string);
      }
    }
    return contextParts.join('\n\n---\n\n');
  }, [sourceNodesData]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    // Pre-flight cost estimate uses the user's stored fallback when in Auto —
    // we can't know which model the router will pick.
    if (!canAfford({ type: 'text', modelId: model, prompt })) {
      toast.error('Insufficient balance. Top up to continue.', {
        action: { label: 'Top Up', onClick: openSubscriptionModal },
      });
      openSubscriptionModal();
      return;
    }

    setIsGenerating(true);
    updateNodeData(id, { status: 'loading', error: undefined, prompt });

    try {
      const upstreamContext = gatherUpstreamContext();

      // Auto mode delegates to OpenRouter Auto Router; otherwise send the
      // user's explicit pick (which may carry a `:nitro`/`:free` suffix).
      const submitModel = auto ? AUTO_ROUTER_MODEL_ID : model;

      const formData = new FormData();
      formData.append('text', prompt);
      formData.append('prompt', upstreamContext);
      formData.append('model', submitModel);

      // Vision/video attachments only flow through when the explicit model
      // declares support — in Auto mode the router accepts everything.
      const attachImages = auto || (hasConnectedImages && currentModelSupportsVision);
      const attachVideos = auto || (hasConnectedVideos && currentModelSupportsVideo);

      if (hasConnectedImages && attachImages) {
        for (let i = 0; i < connectedImages.length; i++) {
          const img = connectedImages[i];
          try {
            const imageResponse = await fetch(img.url);
            const blob = await imageResponse.blob();
            formData.append(`image${i}`, blob, `image${i}.png`);
          } catch (fetchError) {
            console.warn(`Failed to fetch connected image ${i}:`, fetchError);
          }
        }
      }

      if (hasConnectedVideos && attachVideos) {
        for (let i = 0; i < connectedVideos.length; i++) {
          const vid = connectedVideos[i];
          if (vid.url.startsWith('http') || vid.url.startsWith('data:')) {
            formData.append(`video${i}`, vid.url);
          } else if (vid.url.startsWith('blob:')) {
            try {
              const videoResponse = await fetch(vid.url);
              const blob = await videoResponse.blob();
              formData.append(`video${i}`, blob, `video${i}.mp4`);
            } catch (fetchError) {
              console.warn(`Failed to fetch connected video ${i}:`, fetchError);
            }
          }
        }
      }

      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.text) {
        updateNodeData(id, { status: 'success', text: result.text, error: undefined });
        // In Auto mode, OpenRouter echoes the *actual* model it routed to —
        // bill against that so pricing is accurate.
        const billingModel = (typeof result.model === 'string' && result.model) || submitModel;
        const cost = actualChatCost(billingModel, result.usage).billedMicros;
        if (cost > 0) await debit('text', cost, { nodeId: id, modelId: billingModel });
      } else {
        throw new Error('No text returned');
      }
    } catch (error) {
      updateNodeData(id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    id, prompt, model, auto, updateNodeData, gatherUpstreamContext,
    hasConnectedImages, currentModelSupportsVision, connectedImages,
    hasConnectedVideos, currentModelSupportsVideo, connectedVideos,
    canAfford, debit,
  ]);

  const handleStop = useCallback(() => {
    setIsGenerating(false);
    updateNodeData(id, { status: 'error', error: 'Generation stopped' });
  }, [id, updateNodeData]);

  const nodeWidth = data?.width ?? 320;
  const nodeHeight = data?.height ?? 320;

  const onResize = useCallback(
    (_event: unknown, params: { width: number; height: number }) => {
      updateNodeData(id, { width: params.width, height: params.height });
    },
    [id, updateNodeData],
  );

  return {
    isHovered, setIsHovered,
    prompt, setPrompt,
    auto,
    onAutoChange,
    bodyText,
    isGenerating,
    model,
    temperature,
    availableModelIds,
    hasConnectedImages,
    connectedImages,
    isMultiSelected,
    nodeWidth, nodeHeight,
    onModelChange,
    onTemperatureChange,
    onLabelChange,
    handleBodyChange,
    handleSubmit,
    handleStop,
    onResize,
  };
}
