// UI-friendly view of the OpenRouter model registry.
// Translates ChatModel / VideoModel into the shape consumed by the workflow UI:
//   { id, name, provider, icon, description?, credits, time, input, output }

import {
  TEXT_MODELS as RAW_TEXT_MODELS,
  IMAGE_MODELS as RAW_IMAGE_MODELS,
  VIDEO_MODELS as RAW_VIDEO_MODELS,
  DEFAULT_TEXT_MODEL,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  getChatModel,
  getVideoModel,
  getModelGroup,
  providerOf,
} from '@/lib/openrouter/models/registry';
import type {
  ChatModel as RawChatModel,
  VideoModel as RawVideoModel,
  Modality,
} from '@/lib/openrouter/types';
import {
  estimateChatCost,
  estimateImageCost,
  estimateVideoCost,
  formatUsd,
} from '@/lib/openrouter/pricing';

export const DEFAULT_TEMPERATURE = 0.7;
export { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL };

// ── OpenRouter routing variants ──────────────────────────────────────────────
//
// Auto Router and the `:free`/`:nitro` suffixes are documented at
// https://openrouter.ai/docs/guides/routing. Auto Router has its own registry
// entry; `:free` variants are also separate entries; `:nitro` is a runtime
// routing modifier applied as a suffix to any base chat model.

export const AUTO_ROUTER_MODEL_ID = 'openrouter/auto';
export const NITRO_SUFFIX = ':nitro';
export const FREE_SUFFIX = ':free';

export function isAutoRouter(modelId: string): boolean {
  return modelId === AUTO_ROUTER_MODEL_ID;
}

export function isFreeVariant(modelId: string): boolean {
  return modelId.endsWith(FREE_SUFFIX);
}

export function isNitroVariant(modelId: string): boolean {
  return modelId.endsWith(NITRO_SUFFIX);
}

/** Strip a routing suffix (`:nitro` only — `:free` is part of the registered ID). */
export function stripNitroSuffix(modelId: string): string {
  return isNitroVariant(modelId) ? modelId.slice(0, -NITRO_SUFFIX.length) : modelId;
}

/** Resolve the base model entry for display, regardless of routing suffix. */
export function getBaseModelConfig(modelId: string): UiModel | undefined {
  return getModelConfig(stripNitroSuffix(modelId));
}

// ── Provider metadata ────────────────────────────────────────────────────────

interface ProviderMeta {
  label: string;
  icon: string | null;
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  openai: { label: 'OpenAI', icon: '/models/openai.svg' },
  google: { label: 'Google', icon: '/models/gemini.svg' },
  anthropic: { label: 'Anthropic', icon: '/models/claude.svg' },
  'x-ai': { label: 'xAI', icon: '/models/grok.svg' },
  bytedance: { label: 'ByteDance', icon: '/models/bytedance.svg' },
  'bytedance-seed': { label: 'ByteDance', icon: '/models/bytedance.svg' },
  kwaivgi: { label: 'Kling (Kuaishou)', icon: '/models/kling.svg' },
  alibaba: { label: 'Alibaba', icon: '/models/qwen.svg' },
  minimax: { label: 'MiniMax', icon: '/models/hailuo.svg' },
  mistralai: { label: 'Mistral', icon: '/models/mistral.svg' },
  'black-forest-labs': { label: 'Black Forest Labs', icon: '/models/flux.svg' },
  'meta-llama': { label: 'Meta', icon: '/models/meta.svg' },
  deepseek: { label: 'DeepSeek', icon: '/models/deepseek.svg' },
  'moonshotai': { label: 'MoonshotAI', icon: null },
  'ibm-granite': { label: 'IBM', icon: null },
  nvidia: { label: 'NVIDIA', icon: null },
  poolside: { label: 'Poolside', icon: null },
  sourceful: { label: 'Sourceful', icon: '/models/sourceful.svg' },
  openrouter: { label: 'OpenRouter', icon: null },
  recraft: { label: 'Recraft', icon: '/models/recraft.svg' },
};

function metaFor(modelId: string): ProviderMeta {
  const p = providerOf(modelId);
  return PROVIDER_META[p] ?? { label: p, icon: null };
}

// ── Common UI shape ──────────────────────────────────────────────────────────

export interface UiModel {
  id: string;
  name: string;
  provider: string;
  icon: string | null;
  description?: string;
  /** Estimated billed cost in micro-USD for a representative call. */
  costMicros: number;
  /** Pre-formatted price (e.g. "$0.0034") for chip display. */
  priceLabel: string;
  /** Estimated wall-clock seconds for this kind of generation. */
  time: number;
  input: Modality[];
  output: Modality[];
}

export type TextModel = string;
export type ImageModel = string;
export type VideoModel = string;

// Heuristic generation-time estimates. Refine when telemetry is available.
const TIME_SEC_TEXT = 4;
const TIME_SEC_IMAGE = 10;
const TIME_SEC_VIDEO_BASE = 60;

// Representative prompt length for UI cost estimates (~40 tokens at 4 ch/tok).
const SAMPLE_PROMPT = 'a'.repeat(160);

function chatToUi(model: RawChatModel, kind: 'text' | 'image'): UiModel {
  const meta = metaFor(model.id);
  const cost =
    kind === 'image'
      ? estimateImageCost(model.id, 1, SAMPLE_PROMPT)
      : estimateChatCost(model.id, SAMPLE_PROMPT, 1024);
  return {
    id: model.id,
    name: model.name,
    provider: meta.label,
    icon: meta.icon,
    description: model.description?.split('\n')[0]?.slice(0, 140),
    costMicros: cost.billedMicros,
    priceLabel: formatUsd(cost.billedMicros),
    time: kind === 'image' ? TIME_SEC_IMAGE : TIME_SEC_TEXT,
    input: model.architecture.input_modalities,
    output: model.architecture.output_modalities,
  };
}

function videoToUi(model: RawVideoModel): UiModel {
  const meta = metaFor(model.id);
  const defaultDuration = model.supported_durations[0] ?? 5;
  const defaultRes = model.supported_resolutions[0];
  const cost = estimateVideoCost(model.id, defaultDuration, defaultRes, model.generate_audio);
  return {
    id: model.id,
    name: model.name,
    provider: meta.label,
    icon: meta.icon,
    description: model.description?.split('\n')[0]?.slice(0, 140),
    costMicros: cost.billedMicros,
    priceLabel: formatUsd(cost.billedMicros),
    time: TIME_SEC_VIDEO_BASE + defaultDuration * 8,
    input: ['text', 'image'],
    output: ['video'],
  };
}

export const TEXT_MODELS: UiModel[] = RAW_TEXT_MODELS.map((m) => chatToUi(m, 'text'));
export const IMAGE_MODELS: UiModel[] = RAW_IMAGE_MODELS.map((m) => chatToUi(m, 'image'));
export const VIDEO_MODELS: UiModel[] = RAW_VIDEO_MODELS.map(videoToUi);

const ALL_UI_MODELS = new Map<string, UiModel>(
  [...TEXT_MODELS, ...IMAGE_MODELS, ...VIDEO_MODELS].map((m) => [m.id, m]),
);

export function getModelConfig(id: string): UiModel | undefined {
  return ALL_UI_MODELS.get(id);
}

export function groupByProvider<T extends { provider: string }>(models: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const m of models) {
    (out[m.provider] ??= []).push(m);
  }
  return out;
}

// ── Image config helpers (consumed by image-toolbar) ────────────────────────
//
// OpenRouter's image generation accepts two orthogonal knobs inside
// `image_config`:
//
//   aspect_ratio  — shape, e.g. "1:1", "16:9"  → getImageSizes(modelId)
//   image_size    — resolution tier "1K"/"2K"/"4K" → getImageResolutions(modelId)
//
// Most models accept the standard ratio set; nano-banana-2 unlocks extreme
// ratios and a 0.5K tier.

const STANDARD_ASPECT_RATIOS = [
  '1:1',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '16:9',
  '9:16',
  '21:9',
  '4:5',
  '5:4',
];

const NANO_BANANA_2_EXTRA_RATIOS = ['1:4', '4:1', '1:8', '8:1'];

const STANDARD_RESOLUTIONS = ['1K', '2K', '4K'];
const NANO_BANANA_2_RESOLUTIONS = ['0.5K', '1K', '2K', '4K'];

const NANO_BANANA_2_ID = 'google/gemini-3.1-flash-image-preview';

export function getImageSizes(modelId: string): string[] {
  if (!getChatModel(modelId)) return [];
  if (modelId === NANO_BANANA_2_ID) {
    return [...STANDARD_ASPECT_RATIOS, ...NANO_BANANA_2_EXTRA_RATIOS];
  }
  return STANDARD_ASPECT_RATIOS;
}

export function getImageResolutions(modelId: string): string[] {
  if (!getChatModel(modelId)) return [];
  if (modelId === NANO_BANANA_2_ID) return NANO_BANANA_2_RESOLUTIONS;
  return STANDARD_RESOLUTIONS;
}

export type ImageSize = `${number}x${number}` | `${number}:${number}`;
export type SizeOption = ImageSize;
export type ImageModelConfig = RawChatModel;
export type VideoModelConfig = RawVideoModel;
export type VideoGenerationMode = 'text-to-video' | 'image-to-video';

// ── Cost helpers (used by use-balance.ts and UI chips) ───────────────────────

/**
 * Estimated billed cost (in micro-USD) for a representative call to `modelId`.
 * UI surfaces this for affordability checks before triggering a generation.
 */
export function getModelCostMicros(modelId: string): number {
  return ALL_UI_MODELS.get(modelId)?.costMicros ?? 0;
}

export function getModelPriceLabel(modelId: string): string {
  return ALL_UI_MODELS.get(modelId)?.priceLabel ?? '—';
}

// Re-exports used by other workflow components.
export { getChatModel, getVideoModel, getModelGroup };

// ── Video param helpers ──────────────────────────────────────────────────────

export function getVideoDurations(modelId: string): number[] {
  return getVideoModel(modelId)?.supported_durations ?? [];
}

export function getVideoRatios(modelId: string): string[] {
  return getVideoModel(modelId)?.supported_aspect_ratios ?? [];
}

export function getVideoResolutions(modelId: string): string[] {
  return getVideoModel(modelId)?.supported_resolutions ?? [];
}

// ── Source/mode resolver ─────────────────────────────────────────────────────
// Decides which model is appropriate based on what the user has connected
// upstream of a node. Kept simple; refine as more model classes are added.

export interface SourceContext {
  imageCount: number;
  videoCount: number;
  hasText: boolean;
  hasImage: boolean;
  hasVideo: boolean;
}

type SourceType = 'text' | 'image' | 'video';

export function buildSourceContext(
  sourceTypes: SourceType[],
  flags: { hasTextContent: boolean; hasImageContent: boolean; hasVideoContent: boolean },
): SourceContext {
  return {
    imageCount: sourceTypes.filter((t) => t === 'image').length,
    videoCount: sourceTypes.filter((t) => t === 'video').length,
    hasText: flags.hasTextContent,
    hasImage: flags.hasImageContent,
    hasVideo: flags.hasVideoContent,
  };
}

export function detectImageGenerationMode(ctx: SourceContext): 'text-to-image' | 'image-to-image' {
  return ctx.imageCount > 0 ? 'image-to-image' : 'text-to-image';
}

export function detectVideoGenerationMode(ctx: SourceContext): VideoGenerationMode {
  return ctx.imageCount > 0 ? 'image-to-video' : 'text-to-video';
}

export function resolveImageModel(
  mode: 'text-to-image' | 'image-to-image',
  _imageCount = 0,
): { id: string } {
  // Editing models accept text+image input and emit image; generation models
  // accept text-only input. Pick the first match.
  const candidates = RAW_IMAGE_MODELS.filter((m) => {
    const inputsImage = m.architecture.input_modalities.includes('image');
    return mode === 'image-to-image' ? inputsImage : true;
  });
  return { id: candidates[0]?.id ?? DEFAULT_IMAGE_MODEL };
}

export function resolveVideoModel(mode: VideoGenerationMode): { id: string } {
  if (mode === 'image-to-video') {
    const candidates = RAW_VIDEO_MODELS.filter(
      (m) => m.supported_frame_images && m.supported_frame_images.length > 0,
    );
    return { id: candidates[0]?.id ?? DEFAULT_VIDEO_MODEL };
  }
  return { id: DEFAULT_VIDEO_MODEL };
}

export function getCompatibleModels(
  kind: 'image' | 'video',
  ctx: SourceContext,
): RawChatModel[] | RawVideoModel[] {
  if (kind === 'video') {
    if (ctx.imageCount > 0) {
      return RAW_VIDEO_MODELS.filter(
        (m) => m.supported_frame_images && m.supported_frame_images.length > 0,
      );
    }
    return [...RAW_VIDEO_MODELS];
  }
  // Image
  if (ctx.imageCount > 0) {
    return RAW_IMAGE_MODELS.filter((m) => m.architecture.input_modalities.includes('image'));
  }
  return [...RAW_IMAGE_MODELS];
}
