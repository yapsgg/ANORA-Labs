import { useCallback, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assetsApi = (api as any).assets;

interface UploadOptions {
  flowId: Id<'flows'>;
  nodeId: string;
  type: 'image' | 'video';
}

interface UploadResult {
  url: string | null;
  assetId: Id<'workflowAssets'>;
}

interface UseAssetUploadReturn {
  /** Upload a file from URL (downloads and stores in Convex) */
  uploadFromUrl: (url: string, options: UploadOptions) => Promise<UploadResult | null>;
  /** Upload a file from Blob/File */
  uploadFile: (file: Blob, options: UploadOptions & { filename?: string }) => Promise<UploadResult | null>;
  /** Upload a base64 string */
  uploadBase64: (base64: string, options: UploadOptions & { mimeType?: string }) => Promise<UploadResult | null>;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Upload progress (0-100) */
  progress: number;
  /** Error message if any */
  error: string | null;
}

export function useAssetUpload(): UseAssetUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(assetsApi?.generateUploadUrl);
  const uploadComplete = useMutation(assetsApi?.uploadComplete);

  const uploadFile = useCallback(async (
    file: Blob,
    options: UploadOptions & { filename?: string }
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get upload URL
      setProgress(10);
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to Convex storage
      setProgress(30);
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      setProgress(70);
      const { storageId } = await response.json();

      // Step 3: Save asset reference
      setProgress(90);
      const result = await uploadComplete({
        flowId: options.flowId,
        nodeId: options.nodeId,
        storageId,
        type: options.type,
        filename: options.filename,
        mimeType: file.type,
        size: file.size,
      });

      setProgress(100);
      return {
        url: result.url ?? null,
        assetId: result.assetId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      console.error('Asset upload failed:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, uploadComplete]);

  const uploadFromUrl = useCallback(async (
    url: string,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Fetch the file from URL
      setProgress(10);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch file from URL');
      }

      setProgress(30);
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'file';

      // Step 2: Upload using the file upload method
      return await uploadFile(blob, { ...options, filename });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download file';
      setError(message);
      console.error('Asset upload from URL failed:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  const uploadBase64 = useCallback(async (
    base64: string,
    options: UploadOptions & { mimeType?: string }
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Detect mime type from base64 prefix or use provided
      let mimeType = options.mimeType || 'image/png';
      let cleanBase64 = base64;

      if (base64.startsWith('data:')) {
        const match = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          cleanBase64 = match[2];
        }
      }

      // Convert base64 to Blob
      setProgress(10);
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      setProgress(20);

      // Upload using the file upload method
      const extension = mimeType.split('/')[1] || 'png';
      return await uploadFile(blob, {
        ...options,
        filename: `upload.${extension}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process base64';
      setError(message);
      console.error('Asset upload from base64 failed:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  return {
    uploadFromUrl,
    uploadFile,
    uploadBase64,
    isUploading,
    progress,
    error,
  };
}
