import type {
  BunnyStreamConfig,
  BunnyVideoUploadResult,
  BunnyVideoStatus,
  BunnyCollection,
} from './types';

const BUNNY_STREAM_API_URL = 'https://video.bunnycdn.com/library';

export class BunnyStreamClient {
  private config: BunnyStreamConfig;

  constructor(config: BunnyStreamConfig) {
    this.config = config;
    console.log('[Bunny Stream] Initialized with library:', config.libraryId);
  }

  /**
   * Get the base URL for API calls
   */
  private get baseUrl(): string {
    return `${BUNNY_STREAM_API_URL}/${this.config.libraryId}`;
  }

  /**
   * Make an authenticated request to Bunny Stream API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'AccessKey': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny Stream API error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  /**
   * Create a new collection
   */
  async createCollection(name: string): Promise<BunnyCollection> {
    return this.request<BunnyCollection>('/collections', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<{ items: BunnyCollection[]; totalItems: number }> {
    return this.request<{ items: BunnyCollection[]; totalItems: number }>(
      '/collections?page=1&itemsPerPage=100'
    );
  }

  /**
   * Get or create a collection by name
   */
  async getOrCreateCollection(name: string): Promise<BunnyCollection> {
    const { items } = await this.listCollections();
    const existing = items.find((c) => c.name === name);

    if (existing) {
      return existing;
    }

    return this.createCollection(name);
  }

  /**
   * Create a video entry (before upload)
   * API: POST https://video.bunnycdn.com/library/{libraryId}/videos
   */
  async createVideo(
    title: string,
    collectionId?: string
  ): Promise<{ guid: string; title: string }> {
    console.log('[Bunny Stream] Creating video entry:', { title, collectionId });

    return this.request<{ guid: string; title: string }>('/videos', {
      method: 'POST',
      body: JSON.stringify({
        title,
        collectionId,
      }),
    });
  }

  /**
   * Upload a video file to a created video entry
   * API: PUT https://video.bunnycdn.com/library/{libraryId}/videos/{videoId}
   * Headers: AccessKey
   * Body: Raw binary video data
   */
  private async uploadVideoFile(
    videoId: string,
    file: Buffer | Blob | ArrayBuffer
  ): Promise<void> {
    const url = `${this.baseUrl}/videos/${videoId}`;

    // Convert to ArrayBuffer for fetch
    let arrayBuffer: ArrayBuffer;
    if (file instanceof Blob) {
      arrayBuffer = await file.arrayBuffer();
    } else if (Buffer.isBuffer(file)) {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    } else {
      arrayBuffer = file;
    }

    console.log('[Bunny Stream] Uploading video file:', {
      videoId,
      size: arrayBuffer.byteLength,
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': this.config.apiKey,
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Bunny Stream] Upload failed:', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Bunny Stream upload failed: ${response.status} - ${errorText}`);
    }

    console.log('[Bunny Stream] Video upload successful');
  }

  /**
   * Full video upload flow:
   * 1. Get or create collection for the user's flow
   * 2. Create video entry
   * 3. Upload the file
   */
  async uploadVideo(
    file: Buffer | Blob | ArrayBuffer,
    title: string,
    userId: string,
    flowId: string
  ): Promise<BunnyVideoUploadResult> {
    // Get or create collection for this user's flow
    const collectionName = `${userId}-${flowId}`;
    const collection = await this.getOrCreateCollection(collectionName);

    // Create video entry
    const video = await this.createVideo(title, collection.guid);

    // Upload the file
    await this.uploadVideoFile(video.guid, file);

    // Construct embed URL (Bunny Stream format)
    const cdnUrl = `https://iframe.mediadelivery.net/embed/${this.config.libraryId}/${video.guid}`;

    return {
      videoId: video.guid,
      libraryId: this.config.libraryId,
      collectionId: collection.guid,
      cdnUrl,
      status: 'processing',
    };
  }

  /**
   * Delete a video
   * API: DELETE https://video.bunnycdn.com/library/{libraryId}/videos/{videoId}
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      await this.request(`/videos/${videoId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      // Log but don't throw - video may already be deleted
      console.error('Error deleting video:', error);
      return false;
    }
  }

  /**
   * Get video status
   * API: GET https://video.bunnycdn.com/library/{libraryId}/videos/{videoId}
   */
  async getVideoStatus(videoId: string): Promise<BunnyVideoStatus> {
    const video = await this.request<{
      guid: string;
      title: string;
      status: number;
      encodeProgress: number;
      availableResolutions: string;
      thumbnailFileName: string;
      length: number;
    }>(`/videos/${videoId}`);

    return {
      videoId: video.guid,
      status: video.status,
      encodeProgress: video.encodeProgress,
      isReady: video.status === 4, // Status 4 = finished
      title: video.title,
      availableResolutions: video.availableResolutions?.split(',') || [],
      thumbnail: video.thumbnailFileName
        ? `https://vz-${this.config.libraryId}.b-cdn.net/${video.guid}/${video.thumbnailFileName}`
        : undefined,
      duration: video.length,
    };
  }

  /**
   * Delete a collection and all its videos
   * API: DELETE https://video.bunnycdn.com/library/{libraryId}/collections/{collectionId}
   */
  async deleteCollection(collectionId: string): Promise<boolean> {
    try {
      await this.request(`/collections/${collectionId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
  }
}
