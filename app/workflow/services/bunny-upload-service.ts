'use client';

// Re-export validation utilities from asset-upload-service
export {
  validateFile,
  validateFiles,
  extractFilesFromDragEvent,
  fileToBase64,
  fileToDataUrl,
  createPreviewUrl,
  revokePreviewUrl,
  getImageDimensions,
  formatFileSize,
} from './asset-upload-service';

export interface BunnyUploadOptions {
  userId: string;
  flowId: string;
  nodeId?: string;
  type: 'image' | 'video' | 'cover';
}

export interface BunnyUploadResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  videoId?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

export interface BunnyDeleteOptions {
  type: 'storage' | 'video';
  storagePath?: string;
  videoId?: string;
}

export interface BunnyDeleteFlowOptions {
  userId: string;
  flowId: string;
}

/**
 * Upload a file to Bunny.net via the API route
 */
export async function uploadToBunny(
  file: File | Blob,
  options: BunnyUploadOptions,
  onProgress?: (progress: number) => void
): Promise<BunnyUploadResult> {
  try {
    onProgress?.(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', options.userId);
    formData.append('flowId', options.flowId);
    formData.append('type', options.type);
    if (options.nodeId) {
      formData.append('nodeId', options.nodeId);
    }

    onProgress?.(30);

    const response = await fetch('/api/bunny/upload', {
      method: 'POST',
      body: formData,
    });

    onProgress?.(80);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    onProgress?.(100);

    return {
      success: true,
      url: result.url,
      storagePath: result.storagePath,
      videoId: result.videoId,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    };
  } catch (error) {
    console.error('Bunny upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Re-upload generated content from an external URL to Bunny.net
 * Used to persist ephemeral provider CDN URLs to our own CDN.
 */
export async function uploadToBunnyFromUrl(
  sourceUrl: string,
  options: BunnyUploadOptions
): Promise<BunnyUploadResult> {
  try {
    const response = await fetch('/api/bunny/upload-from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl,
        userId: options.userId,
        flowId: options.flowId,
        nodeId: options.nodeId,
        type: options.type,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload from URL failed');
    }

    return {
      success: true,
      url: result.url,
      storagePath: result.storagePath,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    };
  } catch (error) {
    console.error('Bunny upload-from-url error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload from URL failed',
    };
  }
}

/**
 * Delete a file from Bunny.net via the API route
 */
export async function deleteFromBunny(
  options: BunnyDeleteOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/bunny/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Delete failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Bunny delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Delete all files for a flow from Bunny.net
 */
export async function deleteFlowFromBunny(
  options: BunnyDeleteFlowOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/bunny/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deleteFlow: true,
        userId: options.userId,
        flowId: options.flowId,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Flow deletion failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Bunny flow delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Flow deletion failed',
    };
  }
}

/**
 * Delete multiple assets from Bunny (used after Convex mutations return deletion info)
 */
export async function deleteAssetsFromBunny(
  assets: Array<{
    type: 'image' | 'video';
    storagePath?: string;
    videoId?: string;
  }>
): Promise<void> {
  const deletePromises = assets.map(async (asset) => {
    if (asset.type === 'video' && asset.videoId) {
      await deleteFromBunny({ type: 'video', videoId: asset.videoId });
    } else if (asset.storagePath) {
      await deleteFromBunny({ type: 'storage', storagePath: asset.storagePath });
    }
  });

  // Delete in parallel, ignore individual failures
  await Promise.allSettled(deletePromises);
}
