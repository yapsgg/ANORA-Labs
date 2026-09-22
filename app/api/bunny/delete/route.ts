import { NextRequest, NextResponse } from 'next/server';
import {
  getBunnyStorageClient,
  getBunnyStreamClient,
  isStorageConfigured,
  isStreamConfigured,
} from '@/lib/bunny';

interface DeleteRequest {
  type: 'storage' | 'video';
  storagePath?: string;
  videoId?: string;
  // For batch deletion of a flow
  userId?: string;
  flowId?: string;
  deleteFlow?: boolean;
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteRequest = await request.json();
    const { type, storagePath, videoId, userId, flowId, deleteFlow } = body;

    // Handle full flow deletion
    if (deleteFlow && userId && flowId) {
      const results = {
        storageFilesDeleted: 0,
        videoCollectionDeleted: false,
      };

      // Delete storage files
      if (isStorageConfigured()) {
        const storageClient = getBunnyStorageClient();
        results.storageFilesDeleted = await storageClient.deleteFlow(userId, flowId);
      }

      // Delete video collection if stream is configured
      if (isStreamConfigured()) {
        try {
          const streamClient = getBunnyStreamClient();
          const collections = await streamClient.listCollections();
          const collectionName = `${userId}-${flowId}`;
          const collection = collections.items.find(c => c.name === collectionName);
          if (collection) {
            results.videoCollectionDeleted = await streamClient.deleteCollection(collection.guid);
          }
        } catch (error) {
          console.error('Error deleting video collection:', error);
        }
      }

      return NextResponse.json({
        success: true,
        ...results,
      });
    }

    // Handle single file/video deletion
    if (type === 'storage') {
      if (!storagePath) {
        return NextResponse.json(
          { success: false, error: 'storagePath is required for storage deletion' },
          { status: 400 }
        );
      }

      if (!isStorageConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Bunny Storage is not configured' },
          { status: 500 }
        );
      }

      const storageClient = getBunnyStorageClient();
      await storageClient.delete(storagePath);

      return NextResponse.json({ success: true });
    }

    if (type === 'video') {
      if (!videoId) {
        return NextResponse.json(
          { success: false, error: 'videoId is required for video deletion' },
          { status: 400 }
        );
      }

      if (!isStreamConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Bunny Stream is not configured' },
          { status: 500 }
        );
      }

      const streamClient = getBunnyStreamClient();
      await streamClient.deleteVideo(videoId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type. Must be "storage" or "video"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Bunny delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 }
    );
  }
}
