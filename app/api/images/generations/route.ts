import { NextRequest, NextResponse } from 'next/server';
import { imageGenerate } from '@/lib/openrouter/images';
import { getChatModel, modelSupportsOutput } from '@/lib/openrouter/models/registry';
import { OpenRouterError } from '@/lib/openrouter/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Accepted values per OpenRouter image_config docs.
const ASPECT_RATIO_RE = /^\d+:\d+$/;
const IMAGE_SIZE_VALUES = new Set(['0.5K', '1K', '2K', '4K']);

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = Buffer.from(await blob.arrayBuffer());
  const mime = blob.type || 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function ensureDataUrl(maybeUrl: string, mime = 'image/png'): string {
  if (maybeUrl.startsWith('data:')) return maybeUrl;
  return `data:${mime};base64,${maybeUrl}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt');
    const model = formData.get('model');
    const aspectRatioField = formData.get('aspect_ratio') ?? formData.get('size');
    const imageSizeField = formData.get('image_size') ?? formData.get('resolution');
    const nField = formData.get('n');
    const seedField = formData.get('seed');

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    if (typeof model !== 'string' || !model) {
      return NextResponse.json({ error: 'Missing model' }, { status: 400 });
    }
    const modelConfig = getChatModel(model);
    if (!modelConfig) {
      return NextResponse.json({ error: `Unknown model: ${model}` }, { status: 400 });
    }
    if (!modelSupportsOutput(modelConfig, 'image')) {
      return NextResponse.json(
        { error: `Model ${model} does not support image output` },
        { status: 400 },
      );
    }

    const aspectRatio =
      typeof aspectRatioField === 'string' && ASPECT_RATIO_RE.test(aspectRatioField)
        ? aspectRatioField
        : undefined;
    const imageSize =
      typeof imageSizeField === 'string' && IMAGE_SIZE_VALUES.has(imageSizeField)
        ? imageSizeField
        : undefined;

    // Reference images for editing.
    const imageUrls: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('image')) continue;
      if (value instanceof Blob) imageUrls.push(await blobToDataUrl(value));
      else if (typeof value === 'string' && value.startsWith('http')) imageUrls.push(value);
    }

    const n = typeof nField === 'string' ? Math.max(1, Math.min(8, parseInt(nField, 10) || 1)) : 1;
    const seed = typeof seedField === 'string' ? parseInt(seedField, 10) : undefined;

    // Multi-image: parallel calls. Each chat completion returns one image; some
    // models may emit several in one response — we collect everything we get.
    const calls = Array.from({ length: n }, () =>
      imageGenerate({
        model,
        prompt,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        aspectRatio,
        imageSize,
        seed,
      }),
    );

    const results = await Promise.allSettled(calls);
    const data: { url: string }[] = [];
    const errors: { message: string; status?: number; body?: unknown }[] = [];
    let promptTokens = 0;
    let completionTokens = 0;
    for (const r of results) {
      if (r.status !== 'fulfilled') {
        const err = r.reason;
        const entry =
          err instanceof OpenRouterError
            ? { message: err.message, status: err.status, body: err.body }
            : { message: err instanceof Error ? err.message : String(err) };
        console.error('[images/generations] call failed:', entry);
        errors.push(entry);
        continue;
      }
      if (r.value.images.length === 0) {
        console.warn('[images/generations] empty images array; assistant text:', r.value.text);
        errors.push({
          message: r.value.text
            ? `Model returned no image. Text: ${r.value.text}`
            : 'Model returned no image',
        });
      }
      for (const url of r.value.images) {
        data.push({ url: ensureDataUrl(url) });
      }
      if (r.value.usage) {
        promptTokens += r.value.usage.prompt_tokens ?? 0;
        completionTokens += r.value.usage.completion_tokens ?? 0;
      }
    }

    if (data.length === 0) {
      const upstreamStatus = errors[0]?.status;
      return NextResponse.json(
        {
          error: errors[0]?.message ?? 'No image returned',
          upstream_status: upstreamStatus,
          upstream_body: errors[0]?.body,
        },
        { status: upstreamStatus && upstreamStatus >= 400 ? upstreamStatus : 502 },
      );
    }

    return NextResponse.json({
      data,
      model,
      // Aggregated across all parallel calls; the client uses this to debit
      // the user's balance at OpenRouter's actual rate (× our markup).
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      partial_errors: errors.length > 0 ? errors.map((e) => e.message) : undefined,
    });
  } catch (error) {
    const status = error instanceof OpenRouterError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[images/generations] route error:', message, error);
    return NextResponse.json({ error: message }, { status });
  }
}
