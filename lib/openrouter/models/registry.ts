import imageModelsJson from './image-models.json';
import textModelsJson from './text-models.json';
import videoModelsJson from './video-models.json';
import type { ChatModel, VideoModel, Modality } from '../types';

interface ModelsFile<T> {
  data: T[];
}

export const IMAGE_MODELS: readonly ChatModel[] = (imageModelsJson as ModelsFile<ChatModel>).data;
export const TEXT_MODELS: readonly ChatModel[] = (textModelsJson as ModelsFile<ChatModel>).data;
export const VIDEO_MODELS: readonly VideoModel[] = (videoModelsJson as ModelsFile<VideoModel>).data;

const CHAT_MODEL_INDEX = new Map<string, ChatModel>();
for (const m of TEXT_MODELS) CHAT_MODEL_INDEX.set(m.id, m);
for (const m of IMAGE_MODELS) CHAT_MODEL_INDEX.set(m.id, m);

const VIDEO_MODEL_INDEX = new Map<string, VideoModel>(VIDEO_MODELS.map((m) => [m.id, m]));

// Routing-only suffixes (per OpenRouter docs): selecting `:nitro` or `:floor`
// modifies provider selection at runtime but the base model still pays/validates
// against the un-suffixed registry entry. `:free`, `:beta`, `:extended` are
// distinct registry entries and resolve directly.
const ROUTING_VARIANT_SUFFIXES = [':nitro', ':floor'] as const;

export function getChatModel(id: string): ChatModel | undefined {
  const direct = CHAT_MODEL_INDEX.get(id);
  if (direct) return direct;
  for (const suffix of ROUTING_VARIANT_SUFFIXES) {
    if (id.endsWith(suffix)) {
      return CHAT_MODEL_INDEX.get(id.slice(0, -suffix.length));
    }
  }
  return undefined;
}

export function getVideoModel(id: string): VideoModel | undefined {
  return VIDEO_MODEL_INDEX.get(id);
}

export type ModelGroup = 'text' | 'image' | 'video';

export function getModelGroup(id: string): ModelGroup | undefined {
  if (TEXT_MODELS.some((m) => m.id === id)) return 'text';
  if (IMAGE_MODELS.some((m) => m.id === id)) return 'image';
  if (VIDEO_MODEL_INDEX.has(id)) return 'video';
  return undefined;
}

// Pull provider name from "provider/model-id" or "~provider/model".
export function providerOf(modelId: string): string {
  const m = modelId.replace(/^~/, '');
  const slash = m.indexOf('/');
  return slash > 0 ? m.slice(0, slash) : m;
}

export function modelSupportsInput(model: ChatModel, modality: Modality): boolean {
  return model.architecture.input_modalities.includes(modality);
}

export function modelSupportsOutput(model: ChatModel, modality: Modality): boolean {
  return model.architecture.output_modalities.includes(modality);
}

// Models that can edit/transform an existing image (text+image input → image output).
export function getImageEditingModels(): readonly ChatModel[] {
  return IMAGE_MODELS.filter(
    (m) => modelSupportsInput(m, 'image') && modelSupportsOutput(m, 'image'),
  );
}

// Models that accept text+image input and produce text (vision/multimodal chat).
export function getVisionTextModels(): readonly ChatModel[] {
  return TEXT_MODELS.filter(
    (m) => modelSupportsInput(m, 'image') && modelSupportsOutput(m, 'text'),
  );
}

// Models that accept video input and produce text (video understanding chat).
// Per OpenRouter docs, this is currently the Gemini family.
export function getVideoUnderstandingModels(): readonly ChatModel[] {
  return TEXT_MODELS.filter(
    (m) => modelSupportsInput(m, 'video') && modelSupportsOutput(m, 'text'),
  );
}

// Defaults — used by UI when no explicit selection is made.
export const DEFAULT_TEXT_MODEL = 'x-ai/grok-4.3';
export const DEFAULT_IMAGE_MODEL = 'google/gemini-3.1-flash-image-preview';
export const DEFAULT_VIDEO_MODEL = 'google/veo-3.1-fast';
