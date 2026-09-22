'use client';

import type { Id } from '@/convex/_generated/dataModel';

export interface UploadOptions {
  flowId: Id<'flows'>;
  nodeId: string;
  type: 'image' | 'video';
}

export interface UploadResult {
  url: string | null;
  assetId: Id<'workflowAssets'>;
  storagePath?: string;
  videoId?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
  mimeType?: string;
}

// Supported image MIME types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate a file for upload
 */
export function validateFile(file: File): FileValidationResult {
  // Check if it's an image
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: JPEG, PNG, GIF, WebP, SVG, BMP`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large: ${sizeMB}MB. Maximum size is 10MB`,
    };
  }

  return {
    valid: true,
    file,
    mimeType: file.type,
  };
}

/**
 * Validate multiple files for upload
 */
export function validateFiles(files: FileList | File[]): FileValidationResult[] {
  const fileArray = Array.from(files);
  return fileArray.map(validateFile);
}

/**
 * Extract files from a drag event
 */
export function extractFilesFromDragEvent(event: React.DragEvent): File[] {
  const files: File[] = [];

  if (event.dataTransfer.items) {
    // Use DataTransferItemList interface
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const item = event.dataTransfer.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
  } else {
    // Use DataTransfer interface
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      files.push(event.dataTransfer.files[i]);
    }
  }

  return files;
}

/**
 * Convert a file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a file to a data URL for preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Create an object URL for a file (for preview)
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke an object URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = createPreviewUrl(file);

    img.onload = () => {
      revokePreviewUrl(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      revokePreviewUrl(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Asset upload service class for managing uploads via Bunny CDN
 */
export class AssetUploadService {
  private userId: string;
  private uploadComplete: (args: {
    flowId: Id<'flows'>;
    nodeId: string;
    url: string;
    storagePath?: string;
    videoId?: string;
    type: 'image' | 'video';
    filename?: string;
    mimeType?: string;
    size?: number;
  }) => Promise<{ assetId: Id<'workflowAssets'>; url: string | null; oldAssetsToDelete?: Array<{ type: 'image' | 'video'; storagePath?: string; videoId?: string }> }>;

  constructor(
    userId: string,
    uploadComplete: (args: {
      flowId: Id<'flows'>;
      nodeId: string;
      url: string;
      storagePath?: string;
      videoId?: string;
      type: 'image' | 'video';
      filename?: string;
      mimeType?: string;
      size?: number;
    }) => Promise<{ assetId: Id<'workflowAssets'>; url: string | null; oldAssetsToDelete?: Array<{ type: 'image' | 'video'; storagePath?: string; videoId?: string }> }>
  ) {
    this.userId = userId;
    this.uploadComplete = uploadComplete;
  }

  /**
   * Upload a single file to Bunny storage
   */
  async uploadFile(
    file: File,
    options: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult | null> {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      onProgress?.(10);

      // Prepare form data for Bunny upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', this.userId);
      formData.append('flowId', options.flowId);
      formData.append('nodeId', options.nodeId);
      formData.append('type', options.type);

      onProgress?.(20);

      // Upload to Bunny via API route
      const uploadResponse = await fetch('/api/bunny/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload file to Bunny');
      }

      onProgress?.(70);
      const bunnyResult = await uploadResponse.json();

      if (!bunnyResult.success || !bunnyResult.url) {
        throw new Error('Upload failed - no URL returned');
      }

      // Save asset reference in Convex
      onProgress?.(90);
      const result = await this.uploadComplete({
        flowId: options.flowId,
        nodeId: options.nodeId,
        url: bunnyResult.url,
        storagePath: bunnyResult.storagePath,
        videoId: bunnyResult.videoId,
        type: options.type,
        filename: file.name,
        mimeType: bunnyResult.mimeType || file.type,
        size: bunnyResult.size || file.size,
      });

      onProgress?.(100);

      // Clean up old assets from Bunny if any
      if (result.oldAssetsToDelete && result.oldAssetsToDelete.length > 0) {
        // Fire and forget - don't block on cleanup
        Promise.all(
          result.oldAssetsToDelete.map(async (asset) => {
            try {
              await fetch('/api/bunny/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: asset.type === 'video' ? 'video' : 'storage',
                  storagePath: asset.storagePath,
                  videoId: asset.videoId,
                }),
              });
            } catch (e) {
              console.error('Failed to delete old asset:', e);
            }
          })
        );
      }

      return {
        url: result.url,
        assetId: result.assetId,
        storagePath: bunnyResult.storagePath,
        videoId: bunnyResult.videoId,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options: Omit<UploadOptions, 'nodeId'> & { nodeIdPrefix: string },
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<(UploadResult | null)[]> {
    const results: (UploadResult | null)[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadFile(
          file,
          { ...options, nodeId: `${options.nodeIdPrefix}_${i}` },
          (progress) => onProgress?.(i, progress)
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${i}:`, error);
        results.push(null);
      }
    }

    return results;
  }
}
