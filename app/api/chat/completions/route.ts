import { NextRequest, NextResponse } from 'next/server';
import { chatGenerate } from '@/lib/openrouter/chat';
import { getChatModel } from '@/lib/openrouter/models/registry';
import { OpenRouterError } from '@/lib/openrouter/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function blobToDataUrl(blob: Blob, fallbackMime: string): Promise<string> {
  const buf = Buffer.from(await blob.arrayBuffer());
  const mime = blob.type || fallbackMime;
  return `data:${mime};base64,${buf.toString('base64')}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get('text');
    const context = formData.get('prompt');
    const model = formData.get('model');
    const temperature = formData.get('temperature');

    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Missing prompt text' }, { status: 400 });
    }
    if (typeof model !== 'string' || !model) {
      return NextResponse.json({ error: 'Missing model' }, { status: 400 });
    }
    if (!getChatModel(model)) {
      return NextResponse.json({ error: `Unknown model: ${model}` }, { status: 400 });
    }

    // Collect any image{N} / video{N} fields the client appended.
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image')) {
        if (value instanceof Blob) imageUrls.push(await blobToDataUrl(value, 'image/png'));
        else if (typeof value === 'string' && value.startsWith('http')) imageUrls.push(value);
      } else if (key.startsWith('video')) {
        if (value instanceof Blob) videoUrls.push(await blobToDataUrl(value, 'video/mp4'));
        else if (typeof value === 'string' && value) videoUrls.push(value);
      }
    }

    const result = await chatGenerate({
      model,
      prompt: text,
      context: typeof context === 'string' ? context : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      videoUrls: videoUrls.length > 0 ? videoUrls : undefined,
      temperature: typeof temperature === 'string' ? Number(temperature) : undefined,
    });

    return NextResponse.json({
      text: result.text,
      usage: result.usage,
      // Echo the *actual* model OpenRouter routed to (matters when the client
      // sent `openrouter/auto`), falling back to the request's model.
      model: result.raw.model ?? model,
    });
  } catch (error) {
    const status = error instanceof OpenRouterError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status });
  }
}
