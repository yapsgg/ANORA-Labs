import type { GenerateTextNodeType } from '../generate-text-node';
import type { IncomingNodeData } from '@/app/workflow/hooks/use-workflow-runner';
import { DEFAULT_TEXT_MODEL, DEFAULT_TEMPERATURE } from '@/app/workflow/model-data';

function gatherText(incoming: IncomingNodeData): string {
  const parts: string[] = [];
  for (const handleNodes of Object.values(incoming)) {
    for (const node of handleNodes) {
      const text = (node?.data as { text?: string } | undefined)?.text;
      if (text) parts.push(text);
    }
  }
  return parts.join('\n\n---\n\n');
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

function gatherVideos(incoming: IncomingNodeData): string[] {
  const urls: string[] = [];
  for (const handleNodes of Object.values(incoming)) {
    for (const node of handleNodes) {
      const video = (node?.data as { video?: string } | undefined)?.video;
      if (video) urls.push(video);
    }
  }
  return urls;
}

export async function processGenerateTextNode(
  incoming: IncomingNodeData,
  node: GenerateTextNodeType,
): Promise<Partial<GenerateTextNodeType['data']>> {
  const prompt = node.data?.prompt ?? '';
  if (!prompt.trim()) {
    return { status: 'error', error: 'No prompt' };
  }

  const formData = new FormData();
  formData.append('text', prompt);
  formData.append('prompt', gatherText(incoming));
  formData.append('model', node.data?.config?.model ?? DEFAULT_TEXT_MODEL);
  formData.append('temperature', String(node.data?.config?.temperature ?? DEFAULT_TEMPERATURE));

  const images = gatherImages(incoming);
  for (let i = 0; i < images.length; i++) {
    formData.append(`image${i}`, images[i]);
  }
  const videos = gatherVideos(incoming);
  for (let i = 0; i < videos.length; i++) {
    formData.append(`video${i}`, videos[i]);
  }

  const response = await fetch('/api/chat/completions', { method: 'POST', body: formData });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.status}`);
  }
  const result = (await response.json()) as { text?: string };
  return { status: 'success', text: result.text ?? '' };
}
