import { openrouterRequest } from './client';
import { getChatModel } from './models/registry';
import type {
  ChatCompletionRequest,
  ChatMessage,
  ChatContentPart,
  ChatUsage,
} from './types';

// Per OpenRouter docs, image generation rides on /v1/chat/completions with
// `modalities: ["image", "text"]` (or `["image"]` for image-only models). The
// response surfaces images on `choices[0].message.images` as
// `{ type, image_url: { url: <base64 data URL> } }`.
//
// Sizing knobs are provider-dependent:
//   • Gemini / Sourceful / Flux / ByteDance — accept `image_config.aspect_ratio`
//     and `image_config.image_size` ("1K"/"2K"/"4K" tiers).
//   • OpenAI GPT Image models — do NOT accept image_config; their upstream API
//     uses `size` (pixel string) and `quality` ("low"/"medium"/"high"/"auto").
//     We forward those via `provider.options.openai.parameters`.
//
// Docs: https://openrouter.ai/docs/guides/overview/multimodal/image-generation

export interface ImageGenerateParams {
  model: string;
  prompt: string;
  // Reference images for editing / image-to-image. Public URLs or data URLs.
  imageUrls?: string[];
  /** Aspect ratio string, e.g. "1:1", "16:9", "9:16". */
  aspectRatio?: string;
  /** Resolution tier, e.g. "0.5K", "1K", "2K", "4K". */
  imageSize?: string;
  seed?: number;
}

export interface ImageGenerateResult {
  /** base64 data URLs (data:image/png;base64,…). */
  images: string[];
  /** Any text the model emitted alongside the image(s). */
  text?: string;
  /** Token usage from the chat completion (drives accurate billing). */
  usage?: ChatUsage;
}

interface ChatImageMessage {
  type?: string;
  image_url: { url: string };
}

interface ImageChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: 'assistant';
      content: string | null;
      images?: ChatImageMessage[];
    };
    finish_reason: string | null;
  }>;
  usage?: ChatUsage;
}

// ── Provider-specific size translation ──────────────────────────────────────

/** Returns 'landscape', 'portrait', or 'square' for an aspect ratio string. */
function classifyRatio(ratio: string): 'landscape' | 'portrait' | 'square' {
  const m = ratio.match(/^(\d+):(\d+)$/);
  if (!m) return 'square';
  const w = parseInt(m[1], 10);
  const h = parseInt(m[2], 10);
  if (w === h) return 'square';
  return w > h ? 'landscape' : 'portrait';
}

/**
 * Map our (aspect_ratio, tier) selection to OpenAI's `size` parameter.
 * OpenAI's gpt-image accepts: "1024x1024", "1024x1536", "1536x1024", "auto".
 */
function openAISize(aspectRatio: string | undefined): string | undefined {
  if (!aspectRatio) return undefined;
  switch (classifyRatio(aspectRatio)) {
    case 'landscape':
      return '1536x1024';
    case 'portrait':
      return '1024x1536';
    case 'square':
      return '1024x1024';
  }
}

/** Map our resolution tier to OpenAI's `quality` parameter. */
function openAIQuality(tier: string | undefined): string | undefined {
  if (!tier) return undefined;
  switch (tier.toLowerCase()) {
    case '0.5k':
    case '1k':
      return 'low';
    case '2k':
      return 'medium';
    case '4k':
      return 'high';
    default:
      return 'auto';
  }
}

function isOpenAIModel(modelId: string): boolean {
  return modelId.startsWith('openai/');
}

export async function imageGenerate(params: ImageGenerateParams): Promise<ImageGenerateResult> {
  const userParts: ChatContentPart[] = [{ type: 'text', text: params.prompt }];
  for (const url of params.imageUrls ?? []) {
    userParts.push({ type: 'image_url', image_url: { url } });
  }

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: userParts.length === 1 && userParts[0].type === 'text' ? params.prompt : userParts,
    },
  ];

  // Per docs: image-only models (Flux/Sourceful) want ["image"]; multimodal
  // models that also emit captions (Gemini, GPT-Image) want ["image","text"].
  const outputs = getChatModel(params.model)?.architecture.output_modalities ?? ['image'];
  const modalities: Array<'text' | 'image'> = outputs.includes('text')
    ? ['image', 'text']
    : ['image'];

  const body: ChatCompletionRequest & Record<string, unknown> = {
    model: params.model,
    messages,
    seed: params.seed,
    modalities,
  };

  if (isOpenAIModel(params.model)) {
    // OpenAI GPT Image — pass native size/quality via provider passthrough.
    const openaiParams: Record<string, string> = {};
    const size = openAISize(params.aspectRatio);
    const quality = openAIQuality(params.imageSize);
    if (size) openaiParams.size = size;
    if (quality) openaiParams.quality = quality;
    if (Object.keys(openaiParams).length > 0) {
      body.provider = { options: { openai: { parameters: openaiParams } } };
    }
  } else {
    // Gemini / Sourceful / Flux / ByteDance — image_config.
    const imageConfig: Record<string, string> = {};
    if (params.aspectRatio) imageConfig.aspect_ratio = params.aspectRatio;
    if (params.imageSize) imageConfig.image_size = params.imageSize;
    if (Object.keys(imageConfig).length > 0) body.image_config = imageConfig;
  }

  const response = await openrouterRequest<ImageChatResponse>({
    path: '/chat/completions',
    body,
  });

  const message = response.choices?.[0]?.message;
  const images: string[] = [];
  for (const img of message?.images ?? []) {
    const url = img?.image_url?.url;
    if (typeof url === 'string' && url) images.push(url);
  }
  const text = typeof message?.content === 'string' && message.content ? message.content : undefined;

  return { images, text, usage: response.usage };
}
