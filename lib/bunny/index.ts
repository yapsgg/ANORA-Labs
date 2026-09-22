// Export all types
export * from './types';

// Export client classes
export { BunnyStorageClient } from './storage';
export { BunnyStreamClient } from './stream';

import { BunnyStorageClient } from './storage';
import { BunnyStreamClient } from './stream';
import type { BunnyStorageConfig, BunnyStreamConfig } from './types';

// Client instances (recreated each time in dev to pick up env changes)
let storageClient: BunnyStorageClient | null = null;
let streamClient: BunnyStreamClient | null = null;
let lastStorageConfig: string | null = null;

/**
 * Get storage configuration from environment variables
 */
function getStorageConfig(): BunnyStorageConfig {
  const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
  const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
  const region = process.env.BUNNY_STORAGE_REGION || 'ny';
  const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;

  if (!zoneName || !accessKey || !pullZoneUrl) {
    throw new Error(
      'Missing Bunny.net storage configuration. Required env vars: ' +
      'BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_ACCESS_KEY, BUNNY_PULL_ZONE_URL'
    );
  }

  return {
    zoneName,
    accessKey,
    region,
    pullZoneUrl,
  };
}

/**
 * Get stream configuration from environment variables
 */
function getStreamConfig(): BunnyStreamConfig {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;

  if (!libraryId || !apiKey) {
    throw new Error(
      'Missing Bunny.net stream configuration. Required env vars: ' +
      'BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY'
    );
  }

  return {
    libraryId,
    apiKey,
  };
}

/**
 * Get Bunny Storage client (recreates if config changed)
 */
export function getBunnyStorageClient(): BunnyStorageClient {
  const config = getStorageConfig();
  const configKey = JSON.stringify(config);

  // Recreate client if config changed (helps during development)
  if (!storageClient || lastStorageConfig !== configKey) {
    console.log('[Bunny] Creating storage client with config:', {
      zoneName: config.zoneName,
      region: config.region,
      pullZoneUrl: config.pullZoneUrl,
      accessKeyLength: config.accessKey?.length,
    });
    storageClient = new BunnyStorageClient(config);
    lastStorageConfig = configKey;
  }
  return storageClient;
}

/**
 * Get singleton Bunny Stream client
 */
export function getBunnyStreamClient(): BunnyStreamClient {
  if (!streamClient) {
    streamClient = new BunnyStreamClient(getStreamConfig());
  }
  return streamClient;
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.BUNNY_STORAGE_ZONE_NAME &&
    process.env.BUNNY_STORAGE_ACCESS_KEY &&
    process.env.BUNNY_PULL_ZONE_URL
  );
}

/**
 * Check if stream is configured
 */
export function isStreamConfigured(): boolean {
  return !!(
    process.env.BUNNY_STREAM_LIBRARY_ID &&
    process.env.BUNNY_STREAM_API_KEY
  );
}
