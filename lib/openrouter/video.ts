import { openrouterRequest, openrouterDownload } from './client';
import type {
  VideoCreateRequest,
  VideoCreateResponse,
  VideoStatusResponse,
  VideoFrameImage,
  VideoReferenceImage,
  FrameType,
} from './types';
import { getVideoModel } from './models/registry';

export interface VideoSubmitParams {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  size?: string;
  generateAudio?: boolean;
  seed?: number;
  callbackUrl?: string;
  // Image-to-video — first/last frame conditioning.
  frameImages?: { url: string; frameType: FrameType }[];
  // Reference-to-video — style guidance, no frame_type.
  inputReferences?: { url: string }[];
  // Provider passthrough — keys must match the model's allowed_passthrough_parameters.
  providerOptions?: Record<string, Record<string, unknown>>;
}

export class VideoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoValidationError';
  }
}

function validateAgainstModel(p: VideoSubmitParams) {
  const model = getVideoModel(p.model);
  if (!model) throw new VideoValidationError(`Unknown video model: ${p.model}`);

  if (p.duration !== undefined && !model.supported_durations.includes(p.duration)) {
    throw new VideoValidationError(
      `Duration ${p.duration} not in supported_durations: ${model.supported_durations.join(', ')}`,
    );
  }
  if (p.resolution !== undefined && !model.supported_resolutions.includes(p.resolution)) {
    throw new VideoValidationError(
      `Resolution ${p.resolution} not in supported_resolutions: ${model.supported_resolutions.join(', ')}`,
    );
  }
  if (p.aspectRatio !== undefined && !model.supported_aspect_ratios.includes(p.aspectRatio)) {
    throw new VideoValidationError(
      `Aspect ratio ${p.aspectRatio} not in supported_aspect_ratios: ${model.supported_aspect_ratios.join(', ')}`,
    );
  }
  if (p.size !== undefined && !model.supported_sizes.includes(p.size)) {
    throw new VideoValidationError(
      `Size ${p.size} not in supported_sizes: ${model.supported_sizes.join(', ')}`,
    );
  }
  if (p.frameImages?.length) {
    if (!model.supported_frame_images || model.supported_frame_images.length === 0) {
      throw new VideoValidationError(`Model ${p.model} does not accept frame_images`);
    }
    for (const f of p.frameImages) {
      if (!model.supported_frame_images.includes(f.frameType)) {
        throw new VideoValidationError(
          `frame_type ${f.frameType} not supported by ${p.model}`,
        );
      }
    }
  }
  if (p.generateAudio === true && model.generate_audio !== true) {
    throw new VideoValidationError(`Model ${p.model} does not produce audio`);
  }
  if (p.seed !== undefined && model.seed !== true) {
    throw new VideoValidationError(`Model ${p.model} does not accept seed`);
  }
  if (p.providerOptions) {
    for (const opts of Object.values(p.providerOptions)) {
      for (const key of Object.keys(opts)) {
        if (!model.allowed_passthrough_parameters.includes(key)) {
          throw new VideoValidationError(
            `Passthrough param "${key}" not in allowed_passthrough_parameters for ${p.model}`,
          );
        }
      }
    }
  }
}

export async function videoSubmit(params: VideoSubmitParams): Promise<VideoCreateResponse> {
  validateAgainstModel(params);

  const frame_images: VideoFrameImage[] | undefined = params.frameImages?.map((f) => ({
    type: 'image_url',
    image_url: { url: f.url },
    frame_type: f.frameType,
  }));
  const input_references: VideoReferenceImage[] | undefined = params.inputReferences?.map(
    (r) => ({ type: 'image_url', image_url: { url: r.url } }),
  );

  const body: VideoCreateRequest = {
    model: params.model,
    prompt: params.prompt,
    duration: params.duration,
    resolution: params.resolution,
    aspect_ratio: params.aspectRatio,
    size: params.size,
    generate_audio: params.generateAudio,
    seed: params.seed,
    callback_url: params.callbackUrl,
    frame_images,
    input_references,
    provider:
      params.providerOptions
        ? {
            options: Object.fromEntries(
              Object.entries(params.providerOptions).map(([slug, parameters]) => [
                slug,
                { parameters },
              ]),
            ),
          }
        : undefined,
  };

  return openrouterRequest<VideoCreateResponse>({ path: '/videos', body });
}

export async function videoPoll(pollingUrl: string): Promise<VideoStatusResponse> {
  return openrouterRequest<VideoStatusResponse>({
    method: 'GET',
    path: '',
    absoluteUrl: pollingUrl,
  });
}

// Reconstruct the OpenRouter content URL from a job id.
export function videoContentUrl(jobId: string, index = 0): string {
  return `https://openrouter.ai/api/v1/videos/${encodeURIComponent(jobId)}/content?index=${index}`;
}

// Server-side download of the MP4 bytes (auth'd).
export async function videoDownload(jobId: string, index = 0): Promise<ArrayBuffer> {
  return openrouterDownload(videoContentUrl(jobId, index));
}
