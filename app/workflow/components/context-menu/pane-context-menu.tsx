'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMutation, useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

import { useAppStore } from '@/app/workflow/store';
import { type AppNodeType } from '@/app/workflow/components/nodes';
import type { GenerateImageNodeType } from '@/app/workflow/components/nodes/generate-image-node';
import {
  validateFile,
  uploadToBunny,
  deleteAssetsFromBunny,
} from '@/app/workflow/services/bunny-upload-service';
import type { ImageSize } from '@/app/workflow/model-data';
import {
  NODE_SHORTCUTS,
  matchesShortcut,
  SHORTCUT_ESCAPE,
} from '@/lib/shortcuts';
import { BlockPicker } from './block-picker';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assetsApi = (api as any).assets;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const usersApi = (api as any).users;

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

interface PaneContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  takeSnapshot: () => void;
}

export function PaneContextMenu({ position, onClose, takeSnapshot }: PaneContextMenuProps) {
  const { screenToFlowPosition } = useReactFlow();
  const addNodeByType = useAppStore((s) => s.addNodeByType);
  const addNode = useAppStore((s) => s.addNode);
  const updateNodeData = useAppStore((s) => s.updateNodeData);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const params = useParams();
  const flowId = params?.flowId as Id<'flows'> | undefined;
  const currentUser = useQuery(usersApi?.viewer);
  const uploadComplete = useMutation(assetsApi?.uploadComplete);

  const onAddNode = useCallback(
    (type: string) => {
      takeSnapshot();
      addNodeByType(type as AppNodeType, screenToFlowPosition(position));
      onClose();
    },
    [position, screenToFlowPosition, addNodeByType, onClose, takeSnapshot],
  );

  const onUploadImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !flowId || !currentUser?._id) return;

      const validation = validateFile(file);
      if (!validation.valid) {
        console.error('Invalid file:', validation.error);
        return;
      }

      let dims: { width: number; height: number };
      try {
        dims = await getImageDimensions(file);
      } catch {
        dims = { width: 1024, height: 1024 };
      }

      const sizeString = `${dims.width}x${dims.height}`;
      const nodeId = nanoid();
      const flowPosition = screenToFlowPosition(position);

      takeSnapshot();
      addNode({
        id: nodeId,
        type: 'generate-image-node',
        position: flowPosition,
        data: {
          title: 'Image Block',
          icon: 'Image',
          status: 'loading',
          label: file.name,
          config: {
            size: sizeString as ImageSize,
          },
        },
      } as GenerateImageNodeType);

      onClose();

      try {
        const uploadResult = await uploadToBunny(file, {
          userId: currentUser._id,
          flowId,
          nodeId,
          type: 'image',
        });

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

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

        if (result.oldAssetsToDelete && result.oldAssetsToDelete.length > 0) {
          await deleteAssetsFromBunny(result.oldAssetsToDelete);
        }

        updateNodeData(nodeId, {
          image: result.url,
          status: 'success',
          error: undefined,
        });
      } catch (error) {
        console.error('Upload failed:', error);
        updateNodeData(nodeId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }

      e.target.value = '';
    },
    [flowId, currentUser, position, screenToFlowPosition, takeSnapshot, addNode, updateNodeData, uploadComplete, onClose],
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
        onClose();
        return;
      }

      // Skip shortcuts when typing in input
      if (e.target instanceof HTMLInputElement) return;

      for (const [nodeType, shortcut] of Object.entries(NODE_SHORTCUTS)) {
        if (matchesShortcut(e, shortcut)) {
          e.preventDefault();
          onAddNode(nodeType);
          return;
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onAddNode]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[220px] rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
      style={{ left: position.x, top: position.y }}
    >
      <BlockPicker
        heading="Add Block"
        onSelectBlock={onAddNode}
        onUploadImage={onUploadImage}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />
    </div>
  );
}
