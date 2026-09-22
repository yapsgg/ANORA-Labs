'use client';

import { useReactFlow, useNodeConnections, useNodesData } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { estimateVideoCost } from '@/lib/openrouter/pricing';
import { getVideoModel } from '@/lib/openrouter/models/registry';

import { uploadToBunny, deleteAssetsFromBunny } from '../../../services/bunny-upload-service';
import {
  DEFAULT_VIDEO_MODEL,
  getVideoDurations,
  getVideoRatios,
  getVideoResolutions,
  buildSourceContext,
  resolveVideoModel,
  getCompatibleModels,
  detectVideoGenerationMode,
  type VideoModelConfig,
  type VideoGenerationMode,
} from '../../../model-data';
import { useConnectedImages } from '../../../hooks/use-connected-images';
import { useBalance } from '../../../hooks/use-balance';
import { useIsMultiSelected } from '../../../hooks/use-multi-selection';
import { useAppStore } from '../../../store';
import { focusAndSelectNode } from '../../../utils/viewport-utils';
import { openSubscriptionModal } from '../../credits-panel';
import type { AppEdge } from '../../edges';
import { createNodeByType } from '../index';
import { calculateVideoNodeDimensions } from '../utils/node-dimensions';
import type { GenerateVideoNodeData } from '../generate-video-node';

const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 120;

export function useVideoNode({
  id,
  data,
}: {
  id: string;
  data: GenerateVideoNodeData | undefined;
}) {
  const reactFlowInstance = useReactFlow();
  const { updateNodeData } = reactFlowInstance;
  const [isHovered, setIsHovered] = useState(false);
  const [prompt, setPrompt] = useState(data?.prompt ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationCount, setGenerationCount] = useState(1);
  const abortRef = useRef(false);

  const addNode = useAppStore((s) => s.addNode);
  const addEdge = useAppStore((s) => s.addEdge);

  const params = useParams();
  const flowId = params?.flowId as Id<'flows'> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = useQuery((api as any).users?.viewer);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadComplete = useMutation((api as any).assets?.uploadComplete);

  const connections = useNodeConnections({ handleType: 'target', handleId: 'input' });
  const sourceNodeIds = useMemo(() => connections.map((c) => c.source), [connections]);
  const sourceNodesData = useNodesData(sourceNodeIds);

  const upstreamContext = useMemo(() => {
    const parts: string[] = [];
    for (const nd of sourceNodesData) {
      if (nd?.data && 'text' in nd.data && nd.data.text) {
        parts.push(String(nd.data.text));
      }
    }
    return parts.join('\n\n');
  }, [sourceNodesData]);

  const upstreamImageUrls = useMemo(() => {
    const urls: string[] = [];
    for (const nd of sourceNodesData) {
      if (nd?.data && 'image' in nd.data && nd.data.image) {
        urls.push(String(nd.data.image));
      }
    }
    return urls;
  }, [sourceNodesData]);

  const connectedImages = useConnectedImages();

  const { canAfford, debit } = useBalance({ flowId });
  const isMultiSelected = useIsMultiSelected();

  const sourceContext = useMemo(() => {
    const sourceTypes = sourceNodesData
      .filter((nd) => nd?.data)
      .map((nd) => {
        if ('video' in nd.data && nd.data.video) return 'video' as const;
        if ('image' in nd.data && nd.data.image) return 'image' as const;
        return 'text' as const;
      });

    return buildSourceContext(sourceTypes, {
      hasTextContent: sourceNodesData.some(
        (nd) => nd?.data && 'text' in nd.data && nd.data.text,
      ),
      hasImageContent: upstreamImageUrls.length > 0,
      hasVideoContent: false, // TODO: Add video connection support
    });
  }, [sourceNodesData, upstreamImageUrls.length]);

  const generationMode: VideoGenerationMode = useMemo(
    () => detectVideoGenerationMode(sourceContext),
    [sourceContext],
  );

  const compatibleModels = useMemo(
    () => getCompatibleModels('video', sourceContext) as VideoModelConfig[],
    [sourceContext],
  );

  const currentModel = data?.config?.model ?? DEFAULT_VIDEO_MODEL;
  const isCurrentModelCompatible = compatibleModels.some((m) => m.id === currentModel);

  const resolvedModel = useMemo(
    () => resolveVideoModel(generationMode),
    [generationMode],
  );

  const model = isCurrentModelCompatible ? currentModel : resolvedModel.id;

  const prevImageCountRef = useRef(sourceContext.imageCount);

  useEffect(() => {
    const imageCountChanged = prevImageCountRef.current !== sourceContext.imageCount;
    prevImageCountRef.current = sourceContext.imageCount;

    if (imageCountChanged && !isCurrentModelCompatible) {
      const newDurations = getVideoDurations(resolvedModel.id);
      const newRatios = getVideoRatios(resolvedModel.id);
      const newResolutions = getVideoResolutions(resolvedModel.id);
      updateNodeData(id, {
        config: {
          model: resolvedModel.id,
          duration: newDurations[0],
          ratio: newRatios[0],
          resolution: newResolutions[0],
        },
      });
    }
  }, [sourceContext.imageCount, isCurrentModelCompatible, resolvedModel.id, id, updateNodeData]);

  const durations = getVideoDurations(model);
  const ratios = getVideoRatios(model);
  const resolutions = getVideoResolutions(model);

  const duration = data?.config?.duration ?? durations[0];
  const ratio = data?.config?.ratio ?? ratios[0];
  const resolution = data?.config?.resolution ?? resolutions[0];

  const nodeDimensions = useMemo(() => calculateVideoNodeDimensions(ratio), [ratio]);

  const onModelChange = useCallback(
    (newModel: string) => {
      const newDurations = getVideoDurations(newModel);
      const newRatios = getVideoRatios(newModel);
      const newResolutions = getVideoResolutions(newModel);
      updateNodeData(id, {
        config: {
          model: newModel,
          duration: newDurations[0],
          ratio: newRatios[0],
          resolution: newResolutions[0],
        },
      });
    },
    [id, updateNodeData],
  );

  const onLabelChange = useCallback(
    (newLabel: string) => updateNodeData(id, { label: newLabel }),
    [updateNodeData, id],
  );

  const onDurationChange = useCallback(
    (val: string) =>
      updateNodeData(id, { config: { ...data?.config, duration: parseInt(val, 10) } }),
    [id, data?.config, updateNodeData],
  );

  const onRatioChange = useCallback(
    (val: string) => updateNodeData(id, { config: { ...data?.config, ratio: val } }),
    [id, data?.config, updateNodeData],
  );

  const onResolutionChange = useCallback(
    (val: string) => updateNodeData(id, { config: { ...data?.config, resolution: val } }),
    [id, data?.config, updateNodeData],
  );

  const effectivePrompt = upstreamContext || prompt;
  const isPromptFromUpstream = !!upstreamContext;

  const buildRequestBody = useCallback(() => {
    const body: Record<string, unknown> = { model, prompt: effectivePrompt };

    if (duration) body.duration = duration;
    if (ratio) body.aspect_ratio = ratio;
    if (resolution) body.resolution = resolution;

    if (generationMode === 'image-to-video' && upstreamImageUrls.length > 0) {
      const frames: { url: string; frame_type: 'first_frame' | 'last_frame' }[] = [
        { url: upstreamImageUrls[0], frame_type: 'first_frame' },
      ];
      if (upstreamImageUrls.length >= 2) {
        frames.push({ url: upstreamImageUrls[1], frame_type: 'last_frame' });
      }
      body.frame_images = frames;
    }

    return body;
  }, [model, effectivePrompt, upstreamImageUrls, generationMode, duration, ratio, resolution]);

  const runSingleVideoGeneration = useCallback(
    async (localAbortRef: { current: boolean }): Promise<Blob> => {
      const requestBody = buildRequestBody();

      const initResponse = await fetch('/api/video/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${initResponse.status}`);
      }

      const { polling_url, id: jobId } = (await initResponse.json()) as {
        id: string;
        polling_url: string;
      };
      if (!polling_url) throw new Error('No polling_url returned');

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (localAbortRef.current) throw new Error('Generation stopped');
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (localAbortRef.current) throw new Error('Generation stopped');

        const pollResponse = await fetch(
          `/api/video/generations?polling_url=${encodeURIComponent(polling_url)}`,
        );
        if (!pollResponse.ok) continue;

        const pollResult = await pollResponse.json();
        if (pollResult.status === 'completed') {
          // Download MP4 bytes through our backend (handles auth) and hand
          // back an in-memory blob for immediate UI playback while Bunny
          // re-upload swaps in the CDN URL.
          const contentResponse = await fetch(
            `/api/video/generations/content?id=${encodeURIComponent(jobId)}`,
          );
          if (!contentResponse.ok) throw new Error('Failed to download video');
          return contentResponse.blob();
        }
        if (['failed', 'cancelled', 'expired'].includes(pollResult.status)) {
          throw new Error(pollResult.error || `Video generation ${pollResult.status}`);
        }
      }

      throw new Error('Video generation timed out');
    },
    [buildRequestBody],
  );

  const uploadVideoToBunny = useCallback(
    async (blob: Blob, nodeId: string): Promise<string | undefined> => {
      if (!flowId || !currentUser?._id) return undefined;
      try {
        const bunnyResult = await uploadToBunny(blob, {
          userId: currentUser._id,
          flowId,
          nodeId,
          type: 'video',
        });
        if (!bunnyResult.success || !bunnyResult.url) return undefined;

        const convexResult = await uploadComplete({
          flowId,
          nodeId,
          url: bunnyResult.url,
          storagePath: bunnyResult.storagePath,
          type: 'video' as const,
          filename: bunnyResult.filename,
          mimeType: bunnyResult.mimeType,
          size: bunnyResult.size,
        });

        if (convexResult.oldAssetsToDelete?.length > 0) {
          await deleteAssetsFromBunny(convexResult.oldAssetsToDelete);
        }
        return bunnyResult.url;
      } catch (uploadError) {
        console.warn('Bunny upload failed:', uploadError);
        return undefined;
      }
    },
    [flowId, currentUser, uploadComplete],
  );

  const handleSubmit = useCallback(async () => {
    if (!effectivePrompt.trim()) return;

    const videoModelMeta = getVideoModel(model);
    const withAudio = videoModelMeta?.generate_audio ?? false;
    if (
      !canAfford({
        type: 'video',
        modelId: model,
        durationSeconds: duration,
        resolution,
        withAudio,
        videoMode: generationMode,
      })
    ) {
      toast.error('Insufficient balance. Top up to continue.', {
        action: { label: 'Top Up', onClick: openSubscriptionModal },
      });
      openSubscriptionModal();
      return;
    }
    const perVideoCost = estimateVideoCost(
      model,
      duration,
      resolution,
      withAudio,
      generationMode,
    ).billedMicros;

    setIsGenerating(true);
    abortRef.current = false;
    updateNodeData(id, { status: 'loading', error: undefined, prompt: effectivePrompt });

    try {
      if (generationCount <= 1) {
        const blob = await runSingleVideoGeneration(abortRef);
        const localUrl = URL.createObjectURL(blob);
        updateNodeData(id, { status: 'success', video: localUrl, error: undefined });
        if (perVideoCost > 0) await debit('video', perVideoCost, { nodeId: id, modelId: model });

        setIsSaving(true);
        const cdnUrl = await uploadVideoToBunny(blob, id);
        if (cdnUrl) {
          updateNodeData(id, { video: cdnUrl });
          URL.revokeObjectURL(localUrl);
        }
        setIsSaving(false);
      } else {
        const promises = Array.from({ length: generationCount }, () =>
          runSingleVideoGeneration(abortRef),
        );
        const results = await Promise.allSettled(promises);

        const blobs: Blob[] = [];
        for (const r of results) if (r.status === 'fulfilled') blobs.push(r.value);
        if (blobs.length === 0) throw new Error('All generations failed');

        const localUrls = blobs.map((b) => URL.createObjectURL(b));
        updateNodeData(id, { status: 'success', video: localUrls[0], error: undefined });
        if (perVideoCost > 0) await debit('video', perVideoCost, { nodeId: id, modelId: model });

        setIsSaving(true);
        uploadVideoToBunny(blobs[0], id).then((cdnUrl) => {
          if (cdnUrl) {
            updateNodeData(id, { video: cdnUrl });
            URL.revokeObjectURL(localUrls[0]);
          }
          setIsSaving(false);
        });

        const currentNode = reactFlowInstance.getNode(id);
        const baseX = currentNode?.position.x ?? 0;
        const baseY = currentNode?.position.y ?? 0;

        for (let i = 1; i < blobs.length; i++) {
          const newNodeId = nanoid();
          const newNode = createNodeByType({
            type: 'generate-video-node',
            id: newNodeId,
            position: {
              x: baseX + nodeDimensions.width + 80 + nodeDimensions.width * 0.5,
              y: baseY + i * (nodeDimensions.height + 40) + nodeDimensions.height * 0.5,
            },
            data: {
              status: 'success',
              video: localUrls[i],
              prompt: effectivePrompt,
              config: data?.config,
            },
          });
          addNode(newNode);

          const newEdge: AppEdge = {
            id: `edge-${nanoid()}`,
            source: id,
            sourceHandle: 'output',
            target: newNodeId,
            targetHandle: 'input',
          };
          addEdge(newEdge);

          if (perVideoCost > 0) await debit('video', perVideoCost, { nodeId: newNodeId, modelId: model });

          uploadVideoToBunny(blobs[i], newNodeId).then((cdnUrl) => {
            if (cdnUrl) {
              updateNodeData(newNodeId, { video: cdnUrl });
              URL.revokeObjectURL(localUrls[i]);
            }
          });
        }
      }
    } catch (error) {
      if (!abortRef.current) {
        updateNodeData(id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [
    id, effectivePrompt, generationMode, model, duration, resolution,
    data?.config, updateNodeData, canAfford, debit, generationCount,
    runSingleVideoGeneration, uploadVideoToBunny, reactFlowInstance,
    nodeDimensions, addNode, addEdge,
  ]);

  const handleStop = useCallback(() => {
    abortRef.current = true;
    setIsGenerating(false);
    updateNodeData(id, { status: 'error', error: 'Generation stopped' });
  }, [id, updateNodeData]);

  const handleConnectedImageClick = useCallback(
    (nodeId: string) =>
      focusAndSelectNode(reactFlowInstance, nodeId, { zoom: 2, duration: 500 }),
    [reactFlowInstance],
  );

  return {
    isHovered, setIsHovered,
    prompt, setPrompt,
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
  };
}
