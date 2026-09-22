'use client';

import { useCallback, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMutation, useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAppStore } from '../store';
import type { GenerateImageNodeType } from '../components/nodes/generate-image-node';
import type { ImageSize } from '@/app/workflow/model-data';
import {
  extractFilesFromDragEvent,
  validateFile,
  uploadToBunny,
  deleteAssetsFromBunny,
} from '../services/bunny-upload-service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assetsApi = (api as any).assets;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const usersApi = (api as any).users;

interface UseImageDropOptions {
  takeSnapshot: () => void;
}

/**
 * Get image dimensions from a File
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function useImageDrop({ takeSnapshot }: UseImageDropOptions) {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useAppStore((state) => state.addNode);
  const updateNodeData = useAppStore((state) => state.updateNodeData);
  const params = useParams();
  const flowId = params?.flowId as Id<'flows'> | undefined;

  // Get current user for userId
  const currentUser = useQuery(usersApi?.viewer);
  const uploadComplete = useMutation(assetsApi?.uploadComplete);

  const uploadAndCreateNode = useCallback(
    async (file: File, position: { x: number; y: number }) => {
      if (!flowId || !currentUser?._id) return;

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        console.error('Invalid file:', validation.error);
        return;
      }

      // Get actual image dimensions
      let imageDimensions: { width: number; height: number };
      try {
        imageDimensions = await getImageDimensions(file);
      } catch {
        console.error('Failed to get image dimensions');
        imageDimensions = { width: 1024, height: 1024 }; // Fallback to square
      }

      // Generate node ID
      const nodeId = nanoid();

      // Create size string from actual dimensions (e.g., "1920x1080")
      const sizeString = `${imageDimensions.width}x${imageDimensions.height}`;

      // Create node immediately with loading state and correct dimensions
      takeSnapshot();
      addNode({
        id: nodeId,
        type: 'generate-image-node',
        position,
        data: {
          title: 'Image Block',
          icon: 'Image',
          status: 'loading',
          config: {
            size: sizeString as ImageSize,
          },
        },
      } as GenerateImageNodeType);

      try {
        // Upload to Bunny
        const uploadResult = await uploadToBunny(file, {
          userId: currentUser._id,
          flowId,
          nodeId,
          type: 'image',
        });

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        // Save asset reference in Convex and get old assets to delete
        const result = await uploadComplete({
          flowId,
          nodeId,
          url: uploadResult.url,
          storagePath: uploadResult.storagePath,
          type: 'image' as const,
          filename: file.name,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
        });

        // Delete old assets from Bunny if any
        if (result.oldAssetsToDelete && result.oldAssetsToDelete.length > 0) {
          await deleteAssetsFromBunny(result.oldAssetsToDelete);
        }

        // Update node with the image URL (dimensions already set)
        updateNodeData(nodeId, {
          image: result.url,
          status: 'success',
          error: undefined,
          isUploaded: true,
        });
      } catch (error) {
        console.error('Upload failed:', error);
        updateNodeData(nodeId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    },
    [flowId, currentUser, uploadComplete, addNode, updateNodeData, takeSnapshot]
  );

  // Handle drop event
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const files = extractFilesFromDragEvent(event);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length === 0) return;

      // Get drop position
      const basePosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create nodes for each image, offset them if multiple
      imageFiles.forEach((file, index) => {
        const position = {
          x: basePosition.x + index * 350,
          y: basePosition.y,
        };
        uploadAndCreateNode(file, position);
      });
    },
    [screenToFlowPosition, uploadAndCreateNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle paste event
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Don't handle paste if focused on input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length === 0) return;

      event.preventDefault();

      // Get center of viewport for paste position
      const viewportCenter = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      // Create nodes for each image
      imageFiles.forEach((file, index) => {
        const position = {
          x: viewportCenter.x + index * 350,
          y: viewportCenter.y,
        };
        uploadAndCreateNode(file, position);
      });
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [screenToFlowPosition, uploadAndCreateNode]);

  return {
    onDrop,
    onDragOver,
  };
}
