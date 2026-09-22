// Bunny.net Storage Configuration
export interface BunnyStorageConfig {
  zoneName: string;
  accessKey: string;
  region: string;
  pullZoneUrl: string;
}

// Bunny.net Stream Configuration
export interface BunnyStreamConfig {
  libraryId: string;
  apiKey: string;
}

// Upload options for Bunny storage
export interface BunnyUploadOptions {
  userId: string;
  flowId?: string;
  nodeId?: string;
  type: 'image' | 'video' | 'cover' | 'profile';
  /** Sub-type for profile uploads: 'avatar' or 'banner' */
  profileType?: 'avatar' | 'banner';
  filename: string;
  /** Original mime type of the file (used to derive extension when filename has none) */
  mimeType?: string;
}

// Result of a storage upload
export interface BunnyUploadResult {
  cdnUrl: string;
  storagePath: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Result of a video upload through Bunny Stream
export interface BunnyVideoUploadResult {
  videoId: string;
  libraryId: string;
  collectionId?: string;
  cdnUrl: string;
  status: 'processing' | 'ready' | 'failed';
}

// Video status response from Bunny Stream
export interface BunnyVideoStatus {
  videoId: string;
  status: number;
  encodeProgress: number;
  isReady: boolean;
  title: string;
  availableResolutions: string[];
  thumbnail?: string;
  preview?: string;
  duration?: number;
}

// Collection from Bunny Stream
export interface BunnyCollection {
  guid: string;
  name: string;
  videoCount: number;
  totalSize: number;
  previewVideoIds?: string;
}

// File listing from Bunny Storage
export interface BunnyStorageFile {
  Guid: string;
  StorageZoneName: string;
  Path: string;
  ObjectName: string;
  Length: number;
  LastChanged: string;
  ServerId: number;
  ArrayNumber: number;
  IsDirectory: boolean;
  UserId: string;
  ContentType: string;
  DateCreated: string;
  StorageZoneId: number;
  Checksum: string;
  ReplicatedZones: string;
}

// Delete options
export interface BunnyDeleteOptions {
  type: 'storage' | 'video';
  storagePath?: string;
  videoId?: string;
}

// API response types
export interface BunnyApiResponse {
  success: boolean;
  message?: string;
  statusCode?: number;
}
