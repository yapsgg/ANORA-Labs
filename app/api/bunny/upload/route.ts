import { NextRequest, NextResponse } from 'next/server';
import { getBunnyStorageClient, isStorageConfigured } from '@/lib/bunny';
import type { BunnyUploadOptions } from '@/lib/bunny';

// Next.js App Router config for large file uploads
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const flowId = formData.get('flowId') as string | null;
    const nodeId = formData.get('nodeId') as string | null;
    const type = formData.get('type') as 'image' | 'video' | 'cover' | 'profile' | null;
    const profileType = formData.get('profileType') as 'avatar' | 'banner' | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 },
      );
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }
    if (!type || !['image', 'video', 'cover', 'profile'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be image, video, cover, or profile' },
        { status: 400 },
      );
    }
    if (type !== 'profile' && !flowId) {
      return NextResponse.json(
        { success: false, error: 'flowId is required for non-profile uploads' },
        { status: 400 },
      );
    }
    if ((type === 'image' || type === 'video') && !nodeId) {
      return NextResponse.json(
        { success: false, error: 'nodeId is required for image/video uploads' },
        { status: 400 },
      );
    }

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Bunny Storage is not configured' },
        { status: 500 },
      );
    }

    // All asset types — including video — go through Bunny Storage so the
    // returned URL is the CDN URL (anora.b-cdn.net/...). Bunny Stream's iframe
    // hosting is intentionally not used for workflow generations.
    const storageClient = getBunnyStorageClient();
    const uploadOptions: BunnyUploadOptions = {
      userId,
      flowId: flowId || undefined,
      nodeId: nodeId || undefined,
      type,
      profileType: profileType || undefined,
      filename: file.name,
      mimeType: file.type || undefined,
    };

    const buffer = Buffer.from(await file.arrayBuffer());
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
    console.error('Bunny upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 },
    );
  }
}
