// Pay-as-you-go USD pricing derived from OpenRouter's published rates,
// with a configurable markup applied at the boundary so we generate revenue.
//
// Internal unit: micro-USD (1 USD = 1_000_000 micros). Stored as integer in
// Convex to avoid floating-point drift. Display layer formats as USD.
//
// Pricing fields are dollar amounts as strings:
//   chat models — pricing.prompt / pricing.completion are USD per token
//                 pricing.image is USD per image (when present)
//   video models — pricing_skus.* are USD per second (or per token)

import type { ChatUsage, VideoModel } from './types';
import { getChatModel, getVideoModel } from './models/registry';

// ─── Knobs ───────────────────────────────────────────────────────────────────

/**
 * Markup applied on top of OpenRouter's base price, in percent.
 * 0   = pass-through (we eat fees)
 * 45  = bill 45% above OpenRouter
 * 100 = double OpenRouter's price
 *
 * Keep this number visible — it is the single source of truth for revenue.
 */
export const MARKUP_PERCENT = 45;

export const MICROS_PER_USD = 1_000_000;
export const MICROS_PER_CENT = 10_000;

// Affordability buffer: bill the actual cost after the call, but require a
// little headroom upfront so a slightly-larger-than-expected response doesn't
// overdraw. Tune lower as estimates get more accurate.
export const AFFORDABILITY_BUFFER = 1.5;

// Minimum charge per call — guards against rounding to zero on cheap models.
export const MINIMUM_CHARGE_MICROS = 1; // = $0.000001

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHARS_PER_TOKEN = 4;
const MARKUP_MULTIPLIER = 1 + MARKUP_PERCENT / 100;

function toUsd(price: string | undefined): number {
  if (!price) return 0;
  const n = parseFloat(price);
  return Number.isFinite(n) ? n : 0;
}

function applyMarkup(usd: number): number {
  return usd * MARKUP_MULTIPLIER;
}

function usdToMicros(usd: number): number {
  if (usd <= 0) return 0;
  return Math.max(MINIMUM_CHARGE_MICROS, Math.ceil(usd * MICROS_PER_USD));
}

export function microsToUsd(micros: number): number {
  return micros / MICROS_PER_USD;
}

export function formatUsd(micros: number, fractionDigits = 4): string {
  return `$${microsToUsd(micros).toFixed(fractionDigits)}`;
}

// ─── Cost shapes ─────────────────────────────────────────────────────────────

export interface CostBreakdown {
  /** Raw OpenRouter cost in USD (no markup). */
  baseUsd: number;
  /** Final billed amount in micro-USD with markup applied. */
  billedMicros: number;
}

// ─── Chat / vision (text output) ─────────────────────────────────────────────

export function estimateChatCost(
  modelId: string,
  promptText: string,
  maxOutputTokens = 1024,
): CostBreakdown {
  const model = getChatModel(modelId);
  if (!model) return { baseUsd: 0, billedMicros: 0 };

  const promptTokens = Math.ceil(promptText.length / CHARS_PER_TOKEN);
  const baseUsd =
    promptTokens * toUsd(model.pricing.prompt) +
    maxOutputTokens * toUsd(model.pricing.completion);

  return { baseUsd, billedMicros: usdToMicros(applyMarkup(baseUsd)) };
}

export function actualChatCost(modelId: string, usage: ChatUsage | undefined): CostBreakdown {
  const model = getChatModel(modelId);
  if (!model || !usage) return { baseUsd: 0, billedMicros: 0 };

  const baseUsd =
    usage.prompt_tokens * toUsd(model.pricing.prompt) +
    usage.completion_tokens * toUsd(model.pricing.completion);

  return { baseUsd, billedMicros: usdToMicros(applyMarkup(baseUsd)) };
}

// ─── Image generation (Chat Completions API with modalities=["image","text"]) ─
//
// Image generation is billed through `usage.completion_tokens` because the
// generated image bytes are encoded as completion tokens by OpenRouter (e.g.
// Nano Banana ≈ 1290–15600 output tokens per image depending on resolution).
// `pricing.image` on chat models is the *image-input* token rate, NOT the
// per-output-image flat — using it as a flat charge under-bills by ~10×.
//
// For estimates we project `OUTPUT_TOKENS_PER_IMAGE` × completion-rate; for
// actuals we read both token streams off the response usage object.

// Calibrated against OpenRouter's published per-image cost for Gemini 2.5
// Flash Image ($0.039 ÷ $2.50/M ≈ 15 600 tokens). This is intentionally on the
// higher side so the affordability check doesn't pre-approve a generation we
// then can't pay for.
const OUTPUT_TOKENS_PER_IMAGE = 16_000;

export function estimateImageCost(
  modelId: string,
  imageCount = 1,
  promptText = '',
): CostBreakdown {
  const model = getChatModel(modelId);
  if (!model) return { baseUsd: 0, billedMicros: 0 };

  const promptTokens = Math.ceil(promptText.length / CHARS_PER_TOKEN);
  const completionTokens = imageCount * OUTPUT_TOKENS_PER_IMAGE;
  const baseUsd =
    promptTokens * toUsd(model.pricing.prompt) +
    completionTokens * toUsd(model.pricing.completion);

  return { baseUsd, billedMicros: usdToMicros(applyMarkup(baseUsd)) };
}

export function actualImageCost(
  modelId: string,
  usage: ChatUsage | undefined,
): CostBreakdown {
  const model = getChatModel(modelId);
  if (!model || !usage) return { baseUsd: 0, billedMicros: 0 };

  const baseUsd =
    usage.prompt_tokens * toUsd(model.pricing.prompt) +
    usage.completion_tokens * toUsd(model.pricing.completion);

  return { baseUsd, billedMicros: usdToMicros(applyMarkup(baseUsd)) };
}

// ─── Video generation ────────────────────────────────────────────────────────

export type VideoMode = 'text-to-video' | 'image-to-video';

// Token-billed models (e.g. ByteDance Seedance) charge per video token rather
// than per second. We approximate token usage from the requested resolution
// since OpenRouter does not return a token estimate before generation.
//
// Numbers are conservative upper bounds calibrated against typical Seedance
// rates (~$0.05–$0.20 per second at 1080p, ~$0.000007/token) so we err on the
// side of slightly over-estimating affordability rather than overdrawing.
const VIDEO_TOKENS_PER_SECOND_BY_RES: Record<string, number> = {
  '480p': 2500,
  '720p': 5000,
  '1024p': 8000,
  '1080p': 10000,
  '4k': 40000,
};
const DEFAULT_VIDEO_TOKENS_PER_SECOND = 10000;

function tokensPerSecond(resolution: string | undefined): number {
  if (!resolution) return DEFAULT_VIDEO_TOKENS_PER_SECOND;
  return (
    VIDEO_TOKENS_PER_SECOND_BY_RES[resolution.toLowerCase()] ??
    DEFAULT_VIDEO_TOKENS_PER_SECOND
  );
}

interface VideoSkuPick {
  perSecondUsd?: number;
  perTokenUsd?: number;
  tokensPerSecond?: number;
}

// Walks pricing_skus in order of specificity. Returns either a per-second rate
// (most providers) or a per-token rate plus a tokens/sec heuristic (Seedance).
function pickVideoSku(
  model: VideoModel,
  resolution: string | undefined,
  withAudio: boolean,
  mode: VideoMode,
): VideoSkuPick {
  const skus = model.pricing_skus as Record<string, string | undefined>;
  const res = resolution?.toLowerCase();

  // 1) Audio-aware per-second buckets (Veo 3.1, Kling, Wan 2.6).
  if (withAudio) {
    if (res && skus[`duration_seconds_with_audio_${res}`])
      return { perSecondUsd: toUsd(skus[`duration_seconds_with_audio_${res}`]) };
    if (skus.duration_seconds_with_audio)
      return { perSecondUsd: toUsd(skus.duration_seconds_with_audio) };
  } else {
    if (res && skus[`duration_seconds_without_audio_${res}`])
      return { perSecondUsd: toUsd(skus[`duration_seconds_without_audio_${res}`]) };
    if (skus.duration_seconds_without_audio)
      return { perSecondUsd: toUsd(skus.duration_seconds_without_audio) };
  }

  // 2) Mode-specific per-second buckets (Wan 2.6 charges more for image-to-video
  //    at the same resolution; Kling lists separate buckets too).
  const modeKey = mode === 'image-to-video' ? 'image_to_video' : 'text_to_video';
  if (res && skus[`${modeKey}_duration_seconds_${res}`])
    return { perSecondUsd: toUsd(skus[`${modeKey}_duration_seconds_${res}`]) };

  // 3) Plain per-second-with-resolution buckets (Sora 2 Pro).
  if (res && skus[`duration_seconds_${res}`])
    return { perSecondUsd: toUsd(skus[`duration_seconds_${res}`]) };

  // 4) Single per-second SKU (Hailuo, Wan 2.7, etc).
  if (skus.duration_seconds) return { perSecondUsd: toUsd(skus.duration_seconds) };

  // 5) Token-billed models (ByteDance Seedance family).
  const tokenSku = withAudio
    ? skus.video_tokens
    : skus.video_tokens_without_audio ?? skus.video_tokens;
  if (tokenSku) {
    return {
      perTokenUsd: toUsd(tokenSku),
      tokensPerSecond: tokensPerSecond(resolution),
    };
  }

  return {};
}

export interface VideoCostBreakdown extends CostBreakdown {
  /** True when the matched SKU is per-token (estimate only — actuals come from OpenRouter usage). */
  estimated: boolean;
}

export function estimateVideoCost(
  modelId: string,
  durationSeconds: number,
  resolution?: string,
  withAudio = false,
  mode: VideoMode = 'text-to-video',
): VideoCostBreakdown {
  const model = getVideoModel(modelId);
  if (!model) return { baseUsd: 0, billedMicros: 0, estimated: false };

  const sku = pickVideoSku(model, resolution, withAudio, mode);

  let baseUsd = 0;
  let estimated = false;
  if (sku.perSecondUsd !== undefined) {
    baseUsd = durationSeconds * sku.perSecondUsd;
  } else if (sku.perTokenUsd !== undefined && sku.tokensPerSecond !== undefined) {
    baseUsd = durationSeconds * sku.tokensPerSecond * sku.perTokenUsd;
    estimated = true;
  }

  return {
    baseUsd,
    billedMicros: usdToMicros(applyMarkup(baseUsd)),
    estimated,
  };
}
