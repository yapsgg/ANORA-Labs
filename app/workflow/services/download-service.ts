'use client';

export interface DownloadOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface DownloadResult {
  success: boolean;
  error?: string;
}

/**
 * Download an image from a URL
 */
export async function downloadImage(
  url: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const { filename = 'image.png', onProgress, onError } = options;

  try {
    onProgress?.(10);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    onProgress?.(50);

    const blob = await response.blob();

    onProgress?.(80);

    // Determine file extension from content type or URL
    const contentType = response.headers.get('content-type');
    let extension = 'png';
    if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
      extension = 'jpg';
    } else if (contentType?.includes('webp')) {
      extension = 'webp';
    } else if (contentType?.includes('gif')) {
      extension = 'gif';
    } else if (contentType?.includes('svg')) {
      extension = 'svg';
    }

    // Ensure filename has correct extension
    const finalFilename = filename.includes('.')
      ? filename
      : `${filename}.${extension}`;

    // Create blob URL and trigger download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);

    onProgress?.(100);

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Download failed');
    onError?.(err);
    return { success: false, error: err.message };
  }
}

/**
 * Download a video from a URL
 */
export async function downloadVideo(
  url: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const { filename = 'video.mp4', onProgress, onError } = options;

  try {
    onProgress?.(10);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    // Get content length for progress tracking
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error('No response body');
    }

    // Read the stream with progress tracking
    const reader = response.body.getReader();
    const chunks: BlobPart[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      received += value.length;

      if (total > 0) {
        const progress = Math.round((received / total) * 70) + 20; // 20-90%
        onProgress?.(Math.min(progress, 90));
      }
    }

    // Combine chunks into a single blob
    const blob = new Blob(chunks);

    // Determine file extension from content type
    const contentType = response.headers.get('content-type');
    let extension = 'mp4';
    if (contentType?.includes('webm')) {
      extension = 'webm';
    } else if (contentType?.includes('quicktime') || contentType?.includes('mov')) {
      extension = 'mov';
    } else if (contentType?.includes('avi')) {
      extension = 'avi';
    }

    // Ensure filename has correct extension
    const finalFilename = filename.includes('.')
      ? filename
      : `${filename}.${extension}`;

    // Create blob URL and trigger download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);

    onProgress?.(100);

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Download failed');
    onError?.(err);
    return { success: false, error: err.message };
  }
}

/**
 * Generic download function that auto-detects file type
 */
export async function downloadFile(
  url: string,
  type: 'image' | 'video',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  if (type === 'image') {
    return downloadImage(url, options);
  } else {
    return downloadVideo(url, options);
  }
}
