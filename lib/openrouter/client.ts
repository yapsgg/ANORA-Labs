import { OpenRouterError } from './types';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new OpenRouterError(
      'OPENROUTER_API_KEY is not set. Add it to .env.local.',
      500,
    );
  }
  return key;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  path: string;
  body?: unknown;
  // Some endpoints (e.g. /videos/{id}/content) return raw bytes.
  raw?: boolean;
  // Allow overriding the base URL for absolute polling URLs.
  absoluteUrl?: string;
  signal?: AbortSignal;
}

export async function openrouterRequest<T>(opts: RequestOptions): Promise<T> {
  const url = opts.absoluteUrl ?? `${OPENROUTER_BASE_URL}${opts.path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
  };
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => undefined);
    }
    const message =
      (typeof body === 'object' && body && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : undefined) ?? `OpenRouter ${response.status} ${response.statusText}`;
    throw new OpenRouterError(message, response.status, body);
  }

  if (opts.raw) {
    return response as unknown as T;
  }
  return (await response.json()) as T;
}

// For video MP4 download — needs auth header but returns bytes.
export async function openrouterDownload(absoluteUrl: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(absoluteUrl, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
    signal,
  });
  if (!response.ok) {
    throw new OpenRouterError(
      `Download failed: ${response.status} ${response.statusText}`,
      response.status,
    );
  }
  return response.arrayBuffer();
}
