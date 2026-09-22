import { NextRequest, NextResponse } from 'next/server';
import {
  getBunnyStorageClient,
  isStorageConfigured,
} from '@/lib/bunny';
import type { BunnyUploadOptions } from '@/lib/bunny';

export const maxDuration = 60;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

function getExtFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(\w{2,5})$/);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, userId, flowId, nodeId, type } = body;

    if (!sourceUrl || !userId || !flowId || !type) {
      return NextResponse.json(
        { success: false, error: 'sourceUrl, userId, flowId, and type are required' },
        { status: 400 },
      );
    }

    if (!['image', 'video'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be image or video' },
        { status: 400 },
      );
    }

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Bunny Storage is not configured' },
        { status: 500 },
      );
    }

    // Fetch the content from the source URL
    const fetchResponse = await fetch(sourceUrl);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch source: ${fetchResponse.status}`);
    }

    const contentType = fetchResponse.headers.get('content-type') || '';
    const buffer = Buffer.from(await fetchResponse.arrayBuffer());

    // Determine file extension from URL path first, then Content-Type
    let ext = getExtFromUrl(sourceUrl);
    if (!ext) {
      const baseMime = contentType.split(';')[0].trim();
      ext = MIME_TO_EXT[baseMime] || (type === 'video' ? 'mp4' : 'png');
    }

    const filename = `generated.${ext}`;

    const storageClient = getBunnyStorageClient();
    const uploadOptions: BunnyUploadOptions = {
      userId,
      flowId,
      nodeId: nodeId || undefined,
      type,
      filename,
    };

    const result = await storageClient.upload(buffer, uploadOptions);

    return NextResponse.json({
      success: true,
      url: result.cdnUrl,
      storagePath: result.storagePath,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error('Bunny upload-from-url error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload from URL failed',
      },
      { status: 500 },
    );
  }
}
