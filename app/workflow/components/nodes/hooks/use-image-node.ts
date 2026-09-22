'use client';

import { useReactFlow, useNodeConnections, useNodesData } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { actualImageCost } from '@/lib/openrouter/pricing';
import type { ChatUsage } from '@/lib/openrouter/types';

import {
  uploadToBunny,
  uploadToBunnyFromUrl,
  deleteAssetsFromBunny,
  getImageDimensions,
} from '../../../services/bunny-upload-service';
import {
  AUTO_ROUTER_MODEL_ID,
  DEFAULT_IMAGE_MODEL,
  getImageSizes,
  getImageResolutions,
  buildSourceContext,
  resolveImageModel,
  getCompatibleModels,
  detectImageGenerationMode,
  type ImageSize,
  type SizeOption,
  type ImageModelConfig,
} from '../../../model-data';
import { useConnectedImages } from '../../../hooks/use-connected-images';
import { useBalance } from '../../../hooks/use-balance';
import { useIsMultiSelected } from '../../../hooks/use-multi-selection';
import { useAppStore } from '../../../store';
import { focusAndSelectNode } from '../../../utils/viewport-utils';
import { openSubscriptionModal } from '../../credits-panel';
import type { AppEdge } from '../../edges';
import { createNodeByType } from '../index';
import { calculateImageNodeDimensions } from '../utils/node-dimensions';
import type { GenerateImageNodeData } from '../generate-image-node';

export function useImageNode({
  id,
  data,
}: {
  id: string;
  data: GenerateImageNodeData | undefined;
}) {
  const reactFlowInstance = useReactFlow();
  const { updateNodeData } = reactFlowInstance;
  const [isHovered, setIsHovered] = useState(false);
  const [prompt, setPrompt] = useState(data?.prompt ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [generationCount, setGenerationCount] = useState(1);

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

  const connectedImages = useConnectedImages();

  const { canAfford, debit } = useBalance({ flowId });
  const isMultiSelected = useIsMultiSelected();

  const sourceContext = useMemo(() => {
    const sourceTypes = sourceNodesData
      .filter((nd) => nd?.data)
      .map((nd) => {
        if ('image' in nd.data && nd.data.image) return 'image' as const;
        if ('video' in nd.data && nd.data.video) return 'video' as const;
        return 'text' as const;
      });

    return buildSourceContext(sourceTypes, {
      hasTextContent: sourceNodesData.some(
        (nd) => nd?.data && 'text' in nd.data && nd.data.text,
      ),
      hasImageContent: connectedImages.length > 0,
      hasVideoContent: false,
    });
  }, [sourceNodesData, connectedImages.length]);

  const compatibleModels = useMemo(
    () => (getCompatibleModels('image', sourceContext) as ImageModelConfig[]),
    [sourceContext],
  );

  const upstreamContext = useMemo(() => {
    const parts: string[] = [];
    for (const nd of sourceNodesData) {
      if (nd?.data && 'text' in nd.data && nd.data.text) {
        parts.push(String(nd.data.text));
      }
    }
    return parts.join('\n\n');
  }, [sourceNodesData]);

  const generationMode = useMemo(
    () => detectImageGenerationMode(sourceContext),
    [sourceContext],
  );

  // Auto mode defaults to ON for new image nodes; the resolver picks a model
  // based on connected upstream media (text-to-image vs image-to-image).
  const auto = data?.config?.auto ?? true;

  const currentModel = data?.config?.model ?? DEFAULT_IMAGE_MODEL;
  const isCurrentModelCompatible = compatibleModels.some((m) => m.id === currentModel);

  const resolvedModel = useMemo(
    () => resolveImageModel(generationMode, sourceContext.imageCount),
    [generationMode, sourceContext.imageCount],
  );

  // In Auto mode we delegate to OpenRouter's Auto Router (same as text nodes).
  // Otherwise the user's pick is respected (and the effect below corrects
  // truly-incompatible picks).
  const model = auto
    ? AUTO_ROUTER_MODEL_ID
    : isCurrentModelCompatible
      ? currentModel
      : resolvedModel.id;

  const prevImageCountRef = useRef(sourceContext.imageCount);

  useEffect(() => {
    const imageCountChanged = prevImageCountRef.current !== sourceContext.imageCount;
    prevImageCountRef.current = sourceContext.imageCount;
    // In Auto mode we don't persist a model — the resolver runs each render.
    if (auto) return;

    if (imageCountChanged && !isCurrentModelCompatible) {
      const newSizes = getImageSizes(resolvedModel.id);
      const newResolutions = getImageResolutions(resolvedModel.id);
      const currentSize = data?.config?.size;
      const currentResolution = data?.config?.resolution;

      const bestSize = (currentSize && newSizes.includes(currentSize))
        ? currentSize
        : newSizes[0] as SizeOption;
      const bestResolution = (currentResolution && newResolutions.includes(currentResolution))
        ? currentResolution
        : (newResolutions.length > 0 ? newResolutions[1] ?? newResolutions[0] : undefined);

      updateNodeData(id, {
        config: { ...data?.config, model: resolvedModel.id, size: bestSize, resolution: bestResolution },
      });
    }
  }, [auto, sourceContext.imageCount, isCurrentModelCompatible, resolvedModel.id, id, updateNodeData, data?.config]);

  const sizes = getImageSizes(model);
  const size = data?.config?.size ?? sizes[0];
  const imageResolutions = getImageResolutions(model);
  const resolution = data?.config?.resolution
    ?? (imageResolutions.length > 0 ? imageResolutions[1] ?? imageResolutions[0] : undefined);

  const nodeDimensions = useMemo(() => calculateImageNodeDimensions(size), [size]);

  const useEditingMode = generationMode === 'image-to-image';

  const onModelChange = useCallback(
    (newModel: string) => {
      const newSizes = getImageSizes(newModel);
      const newResolutions = getImageResolutions(newModel);
      const currentSize = data?.config?.size;
      const currentResolution = data?.config?.resolution;

      const bestSize = (currentSize && newSizes.includes(currentSize))
        ? currentSize
        : newSizes[0] as SizeOption;
      const bestResolution = (currentResolution && newResolutions.includes(currentResolution))
        ? currentResolution
        : (newResolutions.length > 0 ? newResolutions[1] ?? newResolutions[0] : undefined);

      updateNodeData(id, {
        config: { ...data?.config, model: newModel, size: bestSize, resolution: bestResolution },
      });
    },
    [id, updateNodeData, data?.config],
  );

  const onAutoChange = useCallback(
    (newAuto: boolean) =>
      updateNodeData(id, { config: { ...data?.config, auto: newAuto } }),
    [updateNodeData, id, data?.config],
  );

  const onLabelChange = useCallback(
    (newLabel: string) => updateNodeData(id, { label: newLabel }),
    [updateNodeData, id],
  );

  const onSizeChange = useCallback(
    (newSize: string) => {
      const isValid = /^\d+x\d+$/.test(newSize) || /^\d+:\d+$/.test(newSize);
      updateNodeData(id, {
        config: {
          ...data?.config,
          size: isValid ? (newSize as SizeOption) : undefined,
        },
      });
    },
    [id, data?.config, updateNodeData],
  );

  const onResolutionChange = useCallback(
    (newResolution: string) =>
      updateNodeData(id, { config: { ...data?.config, resolution: newResolution } }),
    [id, data?.config, updateNodeData],
  );

  const isUrl = data?.image?.startsWith('http');
  const imageSrc = isUrl
    ? data?.image
    : data?.image
      ? `data:image/png;base64,${data.image}`
      : undefined;

  const cropSourceUrl = data?.originalImage || imageSrc;

  const effectivePrompt = upstreamContext || prompt;
  const isPromptFromUpstream = !!upstreamContext;

  const buildFormData = useCallback(async () => {
    const formData = new FormData();
    formData.append('prompt', effectivePrompt);
    formData.append('model', model);
    formData.append('aspect_ratio', size);
    if (resolution) formData.append('image_size', resolution);
    formData.append('n', '1');

    if (useEditingMode && connectedImages.length > 0) {
      for (let i = 0; i < connectedImages.length; i++) {
        const img = connectedImages[i];
        try {
          const isExternalUrl = img.url.startsWith('http') && !img.url.startsWith(window.location.origin);
          const fetchUrl = isExternalUrl
            ? `/api/proxy-image?url=${encodeURIComponent(img.url)}`
            : img.url;
          const imageResponse = await fetch(fetchUrl);
          const blob = await imageResponse.blob();
          formData.append(`image${i}`, blob, `image${i}.png`);
        } catch (fetchError) {
          console.warn(`Failed to fetch connected image ${i}:`, fetchError);
        }
      }
    }

    return formData;
  }, [model, effectivePrompt, size, resolution, useEditingMode, connectedImages]);

  const runSingleGeneration = useCallback(
    async (): Promise<{ url: string; usage?: ChatUsage }> => {
      const formData = await buildFormData();

      const response = await fetch('/api/images/generations', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = (await response.json()) as {
        data?: { url: string }[];
        usage?: ChatUsage;
      };

      if (result.data && result.data.length > 0 && result.data[0].url) {
        return { url: result.data[0].url, usage: result.usage };
      }
      throw new Error('No image returned');
    },
    [buildFormData],
  );

  const reuploadToBunny = useCallback(
    async (sourceUrl: string, nodeId: string) => {
      if (!flowId || !currentUser?._id) return sourceUrl;
      try {
        const bunnyResult = await uploadToBunnyFromUrl(sourceUrl, {
          userId: currentUser._id,
          flowId,
          nodeId,
          type: 'image',
        });

        if (bunnyResult.success && bunnyResult.url) {
          const convexResult = await uploadComplete({
            flowId,
            nodeId,
            url: bunnyResult.url,
            storagePath: bunnyResult.storagePath,
            type: 'image' as const,
            filename: bunnyResult.filename,
            mimeType: bunnyResult.mimeType,
            size: bunnyResult.size,
          });

          if (convexResult.oldAssetsToDelete?.length > 0) {
            await deleteAssetsFromBunny(convexResult.oldAssetsToDelete);
          }

          return bunnyResult.url;
        }
      } catch (reuploadError) {
        console.warn('Bunny re-upload failed, keeping source URL:', reuploadError);
      }
      return sourceUrl;
    },
    [flowId, currentUser, uploadComplete],
  );

  const handleSubmit = useCallback(async () => {
    if (!effectivePrompt.trim()) return;

    if (!canAfford({ type: 'image', modelId: model, prompt: effectivePrompt, imageCount: 1 })) {
      toast.error('Insufficient balance. Top up to continue.', {
        action: { label: 'Top Up', onClick: openSubscriptionModal },
      });
      openSubscriptionModal();
      return;
    }

    setIsGenerating(true);
    updateNodeData(id, { status: 'loading', error: undefined, prompt: effectivePrompt });

    try {
      if (generationCount <= 1) {
        const single = await runSingleGeneration();
        updateNodeData(id, { status: 'success', image: single.url, error: undefined });
        const cost = actualImageCost(model, single.usage).billedMicros;
        if (cost > 0) await debit('image', cost, { nodeId: id, modelId: model });

        setIsUploading(true);
        const finalUrl = await reuploadToBunny(single.url, id);
        if (finalUrl !== single.url) {
          updateNodeData(id, { image: finalUrl, originalImage: undefined });
        }
        setIsUploading(false);
      } else {
        const promises = Array.from({ length: generationCount }, () => runSingleGeneration());
        const results = await Promise.allSettled(promises);

        const successes: { url: string; usage?: ChatUsage }[] = [];
        for (const r of results) {
          if (r.status === 'fulfilled') successes.push(r.value);
        }
        if (successes.length === 0) throw new Error('All generations failed');

        const first = successes[0];
        updateNodeData(id, { status: 'success', image: first.url, error: undefined });
        const firstCost = actualImageCost(model, first.usage).billedMicros;
        if (firstCost > 0) await debit('image', firstCost, { nodeId: id, modelId: model });

        setIsUploading(true);
        const finalFirst = await reuploadToBunny(first.url, id);
        if (finalFirst !== first.url) {
          updateNodeData(id, { image: finalFirst, originalImage: undefined });
        }
        setIsUploading(false);

        const currentNode = reactFlowInstance.getNode(id);
        const baseX = currentNode?.position.x ?? 0;
        const baseY = currentNode?.position.y ?? 0;

        for (let i = 1; i < successes.length; i++) {
          const { url, usage } = successes[i];
          const newNodeId = nanoid();
          const newNode = createNodeByType({
            type: 'generate-image-node',
            id: newNodeId,
            position: {
              x: baseX + nodeDimensions.width + 80 + nodeDimensions.width * 0.5,
              y: baseY + i * (nodeDimensions.height + 40) + nodeDimensions.height * 0.5,
            },
            data: {
              status: 'success',
              image: url,
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

          const cost = actualImageCost(model, usage).billedMicros;
          if (cost > 0) await debit('image', cost, { nodeId: newNodeId, modelId: model });

          reuploadToBunny(url, newNodeId).then((finalUrl) => {
            if (finalUrl !== url) {
              updateNodeData(newNodeId, { image: finalUrl, originalImage: undefined });
            }
          });
        }
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
    id, effectivePrompt, model, data?.config, updateNodeData,
    canAfford, debit, generationCount, runSingleGeneration, reuploadToBunny,
    reactFlowInstance, nodeDimensions, addNode, addEdge,
  ]);

  const handleStop = useCallback(() => {
    setIsGenerating(false);
    updateNodeData(id, { status: 'error', error: 'Generation stopped' });
  }, [id, updateNodeData]);

  const handleConnectedImageClick = useCallback(
    (nodeId: string) =>
      focusAndSelectNode(reactFlowInstance, nodeId, { zoom: 2, duration: 500 }),
    [reactFlowInstance],
  );

  const handleToggleCrop = useCallback(() => setIsCropping((prev) => !prev), []);

  const handleCropComplete = useCallback(
    async (result: { blob: Blob; width: number; height: number }) => {
      if (!flowId || !currentUser?._id) {
        console.error('Missing flowId or user');
        setIsCropping(false);
        return;
      }

      setIsUploading(true);
      const newSize = `${result.width}x${result.height}` as ImageSize;

      try {
        const uploadResult = await uploadToBunny(result.blob, {
          userId: currentUser._id,
          flowId,
          nodeId: id,
          type: 'image',
        });

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        const convexResult = await uploadComplete({
          flowId,
          nodeId: id,
          url: uploadResult.url,
          storagePath: uploadResult.storagePath,
          type: 'image' as const,
          filename: 'cropped-image.png',
          mimeType: 'image/png',
          size: result.blob.size,
        });

        // Delete previously cropped assets, but never the source original.
        if (convexResult.oldAssetsToDelete && convexResult.oldAssetsToDelete.length > 0) {
          const assetsToDelete = convexResult.oldAssetsToDelete.filter(
            (asset: { url?: string }) => asset.url !== data?.originalImage,
          );
          if (assetsToDelete.length > 0) {
            await deleteAssetsFromBunny(assetsToDelete);
          }
        }

        // First crop captures `originalImage`; later crops keep the existing reference.
        const originalImage = data?.originalImage || data?.image;

        updateNodeData(id, {
          image: convexResult.url,
          originalImage,
          config: { ...data?.config, size: newSize },
        });
      } catch (error) {
        console.error('Failed to upload cropped image:', error);
      } finally {
        setIsUploading(false);
        setIsCropping(false);
      }
    },
    [id, data?.config, data?.originalImage, data?.image, updateNodeData, flowId, currentUser, uploadComplete],
  );

  const handleCropCancel = useCallback(() => setIsCropping(false), []);

  const handleSplitIntoGrids = useCallback(
    async (rows: number, cols: number) => {
      if (!imageSrc || !flowId || !currentUser?._id) {
        toast.error('Cannot split: missing image or context');
        return;
      }
      if (rows < 1 || cols < 1 || rows > 12 || cols > 12) return;
      if (rows === 1 && cols === 1) return;

      setIsUploading(true);

      let objectUrl: string | undefined;
      try {
        const isExternalUrl =
          imageSrc.startsWith('http') && !imageSrc.startsWith(window.location.origin);
        const fetchUrl = isExternalUrl
          ? `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`
          : imageSrc;

        const response = await fetch(fetchUrl);
        const sourceBlob = await response.blob();
        objectUrl = URL.createObjectURL(sourceBlob);

        const img = new window.Image();
        img.src = objectUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
        });

        const sourceW = img.naturalWidth;
        const sourceH = img.naturalHeight;
        const tileW = Math.floor(sourceW / cols);
        const tileH = Math.floor(sourceH / rows);

        if (tileW < 1 || tileH < 1) {
          throw new Error('Image too small to split into that many tiles');
        }

        type Tile = { blob: Blob; row: number; col: number };
        const tiles: Tile[] = [];

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = tileW;
            canvas.height = tileH;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            ctx.drawImage(
              img,
              c * tileW, r * tileH,
              tileW, tileH,
              0, 0,
              tileW, tileH,
            );

            const tileBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
            });
            if (tileBlob) tiles.push({ blob: tileBlob, row: r, col: c });
          }
        }

        if (tiles.length === 0) {
          throw new Error('Failed to create tiles');
        }

        const currentNode = reactFlowInstance.getNode(id);
        const baseX = currentNode?.position.x ?? 0;
        const baseY = currentNode?.position.y ?? 0;
        const tileSize = `${tileW}x${tileH}` as ImageSize;
        const tileNodeDims = calculateImageNodeDimensions(tileSize);
        const gap = 40;

        for (const tile of tiles) {
          const newNodeId = nanoid();
          const x =
            baseX +
            nodeDimensions.width +
            gap +
            tile.col * (tileNodeDims.width + gap) +
            tileNodeDims.width * 0.5;
          const y =
            baseY +
            tile.row * (tileNodeDims.height + gap) +
            tileNodeDims.height * 0.5;

          const newNode = createNodeByType({
            type: 'generate-image-node',
            id: newNodeId,
            position: { x, y },
            data: {
              status: 'loading',
              isUploaded: true,
              label: `Tile ${tile.row + 1}-${tile.col + 1}`,
              config: { ...data?.config, size: tileSize },
            },
          });
          addNode(newNode);

          uploadToBunny(tile.blob, {
            userId: currentUser._id,
            flowId,
            nodeId: newNodeId,
            type: 'image',
          })
            .then(async (uploadResult) => {
              if (!uploadResult.success || !uploadResult.url) {
                updateNodeData(newNodeId, {
                  status: 'error',
                  error: uploadResult.error || 'Upload failed',
                });
                return;
              }
              const convexResult = await uploadComplete({
                flowId,
                nodeId: newNodeId,
                url: uploadResult.url,
                storagePath: uploadResult.storagePath,
                type: 'image' as const,
                filename: `tile-${tile.row + 1}-${tile.col + 1}.png`,
                mimeType: 'image/png',
                size: tile.blob.size,
              });
              updateNodeData(newNodeId, { status: 'success', image: convexResult.url });
              if (convexResult.oldAssetsToDelete?.length > 0) {
                await deleteAssetsFromBunny(convexResult.oldAssetsToDelete);
              }
            })
            .catch((err) => {
              updateNodeData(newNodeId, {
                status: 'error',
                error: err instanceof Error ? err.message : 'Upload failed',
              });
            });
        }
      } catch (err) {
        console.error('Split into grids failed:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to split image');
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setIsUploading(false);
      }
    },
    [
      imageSrc, flowId, currentUser, id, data?.config, nodeDimensions,
      reactFlowInstance, addNode, updateNodeData, uploadComplete,
    ],
  );

  const handleResetToOriginal = useCallback(() => {
    if (data?.originalImage) {
      updateNodeData(id, {
        image: data.originalImage,
        originalImage: undefined,
      });
    }
  }, [id, data?.originalImage, updateNodeData]);

  const handleReplaceImage = useCallback(
    async (file: File) => {
      if (!flowId || !currentUser?._id) {
        toast.error('Cannot replace image: missing flow or user context');
        return;
      }

      setIsReplacing(true);

      try {
        const dims = await getImageDimensions(file);
        const newSize = `${dims.width}x${dims.height}` as ImageSize;

        const uploadResult = await uploadToBunny(file, {
          userId: currentUser._id,
          flowId,
          nodeId: id,
          type: 'image',
        });

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        const convexResult = await uploadComplete({
          flowId,
          nodeId: id,
          url: uploadResult.url,
          storagePath: uploadResult.storagePath,
          type: 'image' as const,
          filename: file.name,
          mimeType: file.type || 'image/png',
          size: file.size,
        });

        if (convexResult.oldAssetsToDelete?.length > 0) {
          await deleteAssetsFromBunny(convexResult.oldAssetsToDelete);
        }

        updateNodeData(id, {
          image: uploadResult.url,
          originalImage: undefined,
          label: file.name,
          isUploaded: true,
          config: { ...data?.config, size: newSize },
        });
      } catch (error) {
        console.error('Failed to replace image:', error);
        toast.error('Failed to replace image');
      } finally {
        setIsReplacing(false);
      }
    },
    [id, flowId, currentUser, uploadComplete, updateNodeData, data?.config],
  );

  const hasUploadedImage = !!data?.isUploaded;

  return {
    isHovered, setIsHovered,
    prompt, setPrompt,
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
  };
}
