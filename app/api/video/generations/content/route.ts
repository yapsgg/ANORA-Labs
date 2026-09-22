import { NextRequest, NextResponse } from 'next/server';
import { videoDownload } from '@/lib/openrouter/video';
import { OpenRouterError } from '@/lib/openrouter/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Streams the MP4 bytes for a completed video job. Used by the client to
// upload the result to Bunny via /api/bunny/upload.
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const indexParam = request.nextUrl.searchParams.get('index');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const index = indexParam ? parseInt(indexParam, 10) : 0;
    const bytes = await videoDownload(id, Number.isFinite(index) ? index : 0);

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    const status = error instanceof OpenRouterError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status });
  }
}
