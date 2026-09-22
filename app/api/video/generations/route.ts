import { NextRequest, NextResponse } from 'next/server';
import { videoSubmit, videoPoll, VideoValidationError } from '@/lib/openrouter/video';
import { OpenRouterError } from '@/lib/openrouter/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface SubmitBody {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  size?: string;
  generate_audio?: boolean;
  seed?: number;
  frame_images?: { url: string; frame_type: 'first_frame' | 'last_frame' }[];
  input_references?: { url: string }[];
  provider_options?: Record<string, Record<string, unknown>>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitBody;
    if (!body.model || !body.prompt?.trim()) {
      return NextResponse.json({ error: 'model and prompt are required' }, { status: 400 });
    }

    const result = await videoSubmit({
      model: body.model,
      prompt: body.prompt,
      duration: body.duration,
      resolution: body.resolution,
      aspectRatio: body.aspect_ratio,
      size: body.size,
      generateAudio: body.generate_audio,
      seed: body.seed,
      frameImages: body.frame_images?.map((f) => ({ url: f.url, frameType: f.frame_type })),
      inputReferences: body.input_references,
      providerOptions: body.provider_options,
    });

    return NextResponse.json({
      id: result.id,
      polling_url: result.polling_url,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof VideoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const status = error instanceof OpenRouterError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const pollingUrl = request.nextUrl.searchParams.get('polling_url');
    if (!pollingUrl) {
      return NextResponse.json({ error: 'polling_url is required' }, { status: 400 });
    }

    // Restrict to OpenRouter polling URLs to prevent SSRF.
    if (!pollingUrl.startsWith('https://openrouter.ai/')) {
      return NextResponse.json({ error: 'invalid polling_url' }, { status: 400 });
    }

    const result = await videoPoll(pollingUrl);

    const response: Record<string, unknown> = {
      id: result.id,
      generation_id: result.generation_id,
      status: result.status,
      usage: result.usage,
    };
    if (result.error) response.error = result.error;
    if (result.status === 'completed') {
      response.content_url = `/api/video/generations/content?id=${encodeURIComponent(result.id)}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    const status = error instanceof OpenRouterError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status });
  }
}
