import type {
  BunnyStorageConfig,
  BunnyUploadOptions,
  BunnyUploadResult,
  BunnyStorageFile,
} from './types';

// Region to storage hostname mapping per Bunny.net docs
const STORAGE_ENDPOINTS: Record<string, string> = {
  'de': 'storage.bunnycdn.com',        // Falkenstein (default)
  'ny': 'ny.storage.bunnycdn.com',     // New York
  'la': 'la.storage.bunnycdn.com',     // Los Angeles
  'sg': 'sg.storage.bunnycdn.com',     // Singapore
  'syd': 'syd.storage.bunnycdn.com',   // Sydney
  'uk': 'uk.storage.bunnycdn.com',     // London
  'se': 'se.storage.bunnycdn.com',     // Stockholm
  'br': 'br.storage.bunnycdn.com',     // Sao Paulo
  'jh': 'jh.storage.bunnycdn.com',     // Johannesburg
};

export class BunnyStorageClient {
  private config: BunnyStorageConfig;
  private storageUrl: string;
  private pullZoneUrl: string;

  constructor(config: BunnyStorageConfig) {
    this.config = config;

    // Get the correct regional storage endpoint
    const hostname = STORAGE_ENDPOINTS[config.region] || STORAGE_ENDPOINTS['de'];
    this.storageUrl = `https://${hostname}`;

    // Normalize pull zone URL to include https://
    let pullZone = config.pullZoneUrl;
    if (!pullZone.startsWith('http://') && !pullZone.startsWith('https://')) {
      pullZone = `https://${pullZone}`;
    }
    this.pullZoneUrl = pullZone;

    console.log('[Bunny Storage] Initialized:', {
      region: config.region,
      storageUrl: this.storageUrl,
      zoneName: config.zoneName,
      pullZoneUrl: this.pullZoneUrl,
    });
  }

  /**
   * Generate a unique filename with timestamp and random suffix
   */
  private generateFilename(originalFilename: string, mimeType?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const parts = originalFilename.split('.');
    let ext = parts.length > 1 ? parts.pop()! : '';

    // If extension looks invalid (e.g. "blob"), derive from mime type
    const validExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'mp4', 'webm', 'mov']);
    if (!ext || !validExtensions.has(ext.toLowerCase())) {
      const mimeToExt: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'image/bmp': 'bmp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
      };
      ext = (mimeType && mimeToExt[mimeType]) || 'png';
    }

    return `${timestamp}-${random}.${ext}`;
  }

  /**
   * Generate the storage path based on upload options
   * Format: users/{userId}/flows/{flowId}/{type}/{nodeId?}/{filename}
   */
  private generatePath(options: BunnyUploadOptions, filename: string): string {
    const { userId, flowId, nodeId, type, profileType } = options;

    if (type === 'profile') {
      const folder = profileType === 'banner' ? 'banners' : 'avatars';
      return `users/${userId}/profile/${folder}/${filename}`;
    }

    if (type === 'cover') {
      return `users/${userId}/flows/${flowId}/covers/${filename}`;
    }

    const typeFolder = type === 'image' ? 'images' : 'videos';
    if (nodeId) {
      return `users/${userId}/flows/${flowId}/${typeFolder}/${nodeId}/${filename}`;
    }

    return `users/${userId}/flows/${flowId}/${typeFolder}/${filename}`;
  }

  /**
   * Upload a file to Bunny Storage
   * API: PUT https://{storageEndpoint}/{storageZoneName}/{path}/{fileName}
   * Headers: AccessKey (storage zone password)
   * Body: Raw binary data
   */
  async upload(
    file: Buffer | Blob | ArrayBuffer,
    options: BunnyUploadOptions
  ): Promise<BunnyUploadResult> {
    const filename = this.generateFilename(options.filename, options.mimeType);
    const storagePath = this.generatePath(options, filename);

    // Construct URL per Bunny.net API spec
    const url = `${this.storageUrl}/${this.config.zoneName}/${storagePath}`;

    // Convert to ArrayBuffer for fetch
    let arrayBuffer: ArrayBuffer;
    let size: number;

    if (file instanceof Blob) {
      arrayBuffer = await file.arrayBuffer();
      size = file.size;
    } else if (Buffer.isBuffer(file)) {
      // Create a proper ArrayBuffer from Buffer
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
      size = file.length;
    } else {
      arrayBuffer = file;
      size = file.byteLength;
    }

    console.log('[Bunny Storage] Uploading:', {
      url,
      size,
      filename,
      storagePath,
    });

    // Make PUT request per Bunny.net Storage API
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': this.config.accessKey,
        'Content-Type': 'application/octet-stream',
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Bunny Storage] Upload failed:', {
        status: response.status,
        error: errorText,
        url,
      });
      throw new Error(`Bunny Storage upload failed: ${response.status} - ${errorText}`);
    }

    console.log('[Bunny Storage] Upload successful:', { storagePath });

    // Determine mime type from extension
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Construct CDN URL
    const cdnUrl = `${this.pullZoneUrl}/${storagePath}`;

    return {
      cdnUrl,
      storagePath,
      filename,
      size,
      mimeType,
    };
  }

  /**
   * Delete a file from Bunny Storage
   * API: DELETE https://{storageEndpoint}/{storageZoneName}/{path}
   */
  async delete(storagePath: string): Promise<boolean> {
    const url = `${this.storageUrl}/${this.config.zoneName}/${storagePath}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'AccessKey': this.config.accessKey,
      },
    });

    // 404 is acceptable - file may already be deleted
    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Bunny Storage delete failed: ${response.status} - ${errorText}`);
    }

    return true;
  }

  /**
   * List files in a directory
   * API: GET https://{storageEndpoint}/{storageZoneName}/{path}/
   */
  async list(path: string): Promise<BunnyStorageFile[]> {
    const url = `${this.storageUrl}/${this.config.zoneName}/${path}/`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessKey': this.config.accessKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // Directory doesn't exist, return empty
      }
      const errorText = await response.text();
      throw new Error(`Bunny Storage list failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Delete all files for a flow
   */
  async deleteFlow(userId: string, flowId: string): Promise<number> {
    const basePath = `users/${userId}/flows/${flowId}`;
    let deletedCount = 0;

    // List and delete all files recursively
    const deleteRecursive = async (path: string): Promise<void> => {
      const files = await this.list(path);

      for (const file of files) {
        if (file.IsDirectory) {
          // Recursively delete directory contents
          await deleteRecursive(`${path}/${file.ObjectName}`);
        } else {
          // Delete file
          const filePath = `${path}/${file.ObjectName}`;
          await this.delete(filePath);
          deletedCount++;
        }
      }
    };

    try {
      await deleteRecursive(basePath);
    } catch (error) {
      // Log but don't throw - some files may not exist
      console.error('Error deleting flow files:', error);
    }

    return deletedCount;
  }
}
