// Types mirroring OpenRouter's public API responses.
// See: https://openrouter.ai/docs

export type Modality = 'text' | 'image' | 'audio' | 'video' | 'file';

export interface ChatModelArchitecture {
  input_modalities: Modality[];
  instruct_type: string | null;
  modality: string;
  output_modalities: Modality[];
  tokenizer: string;
}

export interface ChatModelPricing {
  prompt: string;
  completion: string;
  image?: string;
  audio?: string;
  request?: string;
  input_cache_read?: string;
  input_cache_write?: string;
  internal_reasoning?: string;
  web_search?: string;
}

export interface ChatModelTopProvider {
  context_length: number | null;
  is_moderated: boolean;
  max_completion_tokens: number | null;
}

// Shape used by both text-models.json and image-models.json
// (both endpoints route through OpenRouter's responses/chat APIs).
export interface ChatModel {
  id: string;
  canonical_slug: string;
  name: string;
  description: string;
  architecture: ChatModelArchitecture;
  context_length: number;
  created: number;
  default_parameters: Record<string, unknown>;
  expiration_date: string | null;
  hugging_face_id: string | null;
  knowledge_cutoff: string | null;
  links: { details: string };
  per_request_limits: unknown;
  pricing: ChatModelPricing;
  supported_parameters: string[];
  supported_voices: string[] | null;
  top_provider: ChatModelTopProvider;
}

// Video models follow a different schema: /api/v1/videos/models
export interface VideoModelPricingSkus {
  duration_seconds?: string;
  duration_seconds_with_audio?: string;
  duration_seconds_without_audio?: string;
  duration_seconds_with_audio_4k?: string;
  duration_seconds_with_audio_720p?: string;
  duration_seconds_without_audio_4k?: string;
  duration_seconds_without_audio_720p?: string;
  duration_seconds_1080p?: string;
  duration_seconds_720p?: string;
  duration_seconds_1024p?: string;
  text_to_video_duration_seconds_1080p?: string;
  text_to_video_duration_seconds_720p?: string;
  text_to_video_duration_seconds_480p?: string;
  image_to_video_duration_seconds_1080p?: string;
  image_to_video_duration_seconds_720p?: string;
  video_tokens?: string;
  video_tokens_without_audio?: string;
}

export type FrameType = 'first_frame' | 'last_frame';

export interface VideoModel {
  id: string;
  canonical_slug: string;
  name: string;
  description: string;
  created: number;
  generate_audio: boolean;
  hugging_face_id: string | null;
  seed: boolean | null;
  pricing_skus: VideoModelPricingSkus;
  allowed_passthrough_parameters: string[];
  supported_aspect_ratios: string[];
  supported_durations: number[];
  supported_frame_images: FrameType[] | null;
  supported_resolutions: string[];
  supported_sizes: string[];
}

// ── Chat Completions API request/response shapes ──────────────────────────────

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer';

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
  | { type: 'video_url'; video_url: { url: string } };

export interface ChatMessage {
  role: ChatRole;
  content: string | ChatContentPart[];
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  seed?: number;
  stop?: string | string[];
  response_format?: { type: 'json_object' | 'text' };
  stream?: boolean;
  /** Output modalities — set to ["image", "text"] for image-generating models. */
  modalities?: Array<'text' | 'image'>;
  /** Image-generation knobs (aspect_ratio, image_size, font_inputs, …). */
  image_config?: Record<string, unknown>;
  /** Provider-specific routing hints. */
  provider?: Record<string, unknown>;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string | null;
    reasoning?: string;
  };
  finish_reason: string | null;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: ChatCompletionChoice[];
  usage?: ChatUsage;
}

// ── Video API ────────────────────────────────────────────────────────────────

export interface VideoFrameImage {
  type: 'image_url';
  image_url: { url: string };
  frame_type: FrameType;
}

export interface VideoReferenceImage {
  type: 'image_url';
  image_url: { url: string };
}

export interface VideoCreateRequest {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  size?: string;
  generate_audio?: boolean;
  seed?: number;
  callback_url?: string;
  frame_images?: VideoFrameImage[];
  input_references?: VideoReferenceImage[];
  // Provider passthrough — keys must come from the model's allowed_passthrough_parameters.
  provider?: { options?: Record<string, { parameters?: Record<string, unknown> }> };
}

export type VideoStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'expired';

export interface VideoCreateResponse {
  id: string;
  polling_url: string;
  status: VideoStatus;
}

export interface VideoStatusResponse {
  id: string;
  generation_id?: string;
  status: VideoStatus;
  unsigned_urls?: string[];
  error?: string;
  usage?: {
    duration_seconds?: number;
    cost?: number;
  };
}

// ── Errors ───────────────────────────────────────────────────────────────────

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}
