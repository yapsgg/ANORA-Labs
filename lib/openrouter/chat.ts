import { openrouterRequest } from './client';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatContentPart,
  ChatMessage,
} from './types';

export interface ChatGenerateParams {
  model: string;
  prompt: string;
  // Prior context to prepend as a system message.
  context?: string;
  // System instruction; defaults to a concise assistant persona.
  systemPrompt?: string;
  // Vision: public/data URLs to include alongside the prompt.
  imageUrls?: string[];
  // Video inputs: URLs (e.g. YouTube for Gemini AI Studio) or base64 data URLs
  // for local files. Only models with video input modality will accept these.
  videoUrls?: string[];
  temperature?: number;
  maxTokens?: number;
  seed?: number;
}

export interface ChatGenerateResult {
  text: string;
  usage?: ChatCompletionResponse['usage'];
  raw: ChatCompletionResponse;
}

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

export async function chatGenerate(params: ChatGenerateParams): Promise<ChatGenerateResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: params.systemPrompt ?? DEFAULT_SYSTEM_PROMPT },
  ];

  if (params.context && params.context.trim()) {
    messages.push({
      role: 'user',
      content: `Context:\n${params.context}`,
    });
  }

  const hasMedia =
    (params.imageUrls && params.imageUrls.length > 0) ||
    (params.videoUrls && params.videoUrls.length > 0);

  if (hasMedia) {
    const parts: ChatContentPart[] = [{ type: 'text', text: params.prompt }];
    for (const url of params.imageUrls ?? []) {
      parts.push({ type: 'image_url', image_url: { url } });
    }
    for (const url of params.videoUrls ?? []) {
      parts.push({ type: 'video_url', video_url: { url } });
    }
    messages.push({ role: 'user', content: parts });
  } else {
    messages.push({ role: 'user', content: params.prompt });
  }

  const body: ChatCompletionRequest = {
    model: params.model,
    messages,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    seed: params.seed,
  };

  const response = await openrouterRequest<ChatCompletionResponse>({
    path: '/chat/completions',
    body,
  });

  const text = response.choices?.[0]?.message?.content ?? '';
  return { text, usage: response.usage, raw: response };
}
