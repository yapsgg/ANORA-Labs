import type { GenerateVideoNodeType } from '../generate-video-node';
import type { IncomingNodeData } from '@/app/workflow/hooks/use-workflow-runner';
import { DEFAULT_VIDEO_MODEL } from '@/app/workflow/model-data';

const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 120;

function gatherText(incoming: IncomingNodeData): string {
  const parts: string[] = [];
  for (const handleNodes of Object.values(incoming)) {
    for (const node of handleNodes) {
      const text = (node?.data as { text?: string } | undefined)?.text;
      if (text) parts.push(text);
    }
  }
  return parts.join('\n\n');
}

function gatherImages(incoming: IncomingNodeData): string[] {
  const urls: string[] = [];
  for (const handleNodes of Object.values(incoming)) {
    for (const node of handleNodes) {
      const image = (node?.data as { image?: string } | undefined)?.image;
      if (image) urls.push(image);
    }
  }
  return urls;
}

export async function processGenerateVideoNode(
  incoming: IncomingNodeData,
  node: GenerateVideoNodeType,
): Promise<Partial<GenerateVideoNodeType['data']>> {
  const upstream = gatherText(incoming);
  const prompt = upstream || node.data?.prompt || '';
  if (!prompt.trim()) {
    return { status: 'error', error: 'No prompt' };
  }

  const upstreamImages = gatherImages(incoming);
  const cfg = node.data?.config;

  const submitBody: Record<string, unknown> = {
    model: cfg?.model ?? DEFAULT_VIDEO_MODEL,
    prompt,
  };
  if (cfg?.duration) submitBody.duration = cfg.duration;
  if (cfg?.ratio) submitBody.aspect_ratio = cfg.ratio;
  if (cfg?.resolution) submitBody.resolution = cfg.resolution;
  if (upstreamImages.length > 0) {
    const frames: { url: string; frame_type: 'first_frame' | 'last_frame' }[] = [
      { url: upstreamImages[0], frame_type: 'first_frame' },
    ];
    if (upstreamImages.length >= 2) {
      frames.push({ url: upstreamImages[1], frame_type: 'last_frame' });
    }
    submitBody.frame_images = frames;
  }

  const submit = await fetch('/api/video/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submitBody),
  });
  if (!submit.ok) {
    const err = await submit.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${submit.status}`);
  }
  const { polling_url, id: jobId } = (await submit.json()) as { id: string; polling_url: string };

  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const poll = await fetch(
      `/api/video/generations?polling_url=${encodeURIComponent(polling_url)}`,
    );
    if (!poll.ok) continue;
    const status = (await poll.json()) as { status: string; error?: string };
    if (status.status === 'completed') {
      const content = await fetch(
        `/api/video/generations/content?id=${encodeURIComponent(jobId)}`,
      );
      if (!content.ok) throw new Error('Failed to download video');
      const blob = await content.blob();
      return { status: 'success', video: URL.createObjectURL(blob) };
    }
    if (['failed', 'cancelled', 'expired'].includes(status.status)) {
      throw new Error(status.error || `Video ${status.status}`);
    }
  }
  throw new Error('Video generation timed out');
}
