import type { GenerateImageNodeType } from '../generate-image-node';
import type { IncomingNodeData } from '@/app/workflow/hooks/use-workflow-runner';
import { DEFAULT_IMAGE_MODEL } from '@/app/workflow/model-data';

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

export async function processGenerateImageNode(
  incoming: IncomingNodeData,
  node: GenerateImageNodeType,
): Promise<Partial<GenerateImageNodeType['data']>> {
  const upstream = gatherText(incoming);
  const prompt = upstream || node.data?.prompt || '';
  if (!prompt.trim()) {
    return { status: 'error', error: 'No prompt' };
  }

  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('model', node.data?.config?.model ?? DEFAULT_IMAGE_MODEL);
  if (node.data?.config?.size) formData.append('size', node.data.config.size);
  formData.append('n', '1');

  const images = gatherImages(incoming);
  for (let i = 0; i < images.length; i++) {
    formData.append(`image${i}`, images[i]);
  }

  const response = await fetch('/api/images/generations', { method: 'POST', body: formData });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.status}`);
  }
  const result = (await response.json()) as { data?: { url: string }[] };
  const url = result.data?.[0]?.url;
  if (!url) throw new Error('No image returned');
  return { status: 'success', image: url };
}
