'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Cropper, CropperRef, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { matchesShortcut, SHORTCUT_ESCAPE } from '@/lib/shortcuts';
import { Check, X } from 'lucide-react';

interface InlineCropOverlayProps {
  imageUrl: string;
  onCropComplete: (result: { blob: Blob; width: number; height: number }) => void;
  onCancel: () => void;
}

export function InlineCropOverlay({
  imageUrl,
  onCropComplete,
  onCancel,
}: InlineCropOverlayProps) {
  const cropperRef = useRef<CropperRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const applyCrop = useCallback(async () => {
    const cropper = cropperRef.current;
    if (!cropper) {
      onCancel();
      return;
    }

    const canvas = cropper.getCanvas();
    if (!canvas) {
      onCancel();
      return;
    }

    // Check if crop area is essentially the full image
    const state = cropper.getState();
    const image = cropper.getImage();
    if (state && image) {
      const coords = state.coordinates;
      if (
        coords &&
        coords.left < 5 &&
        coords.top < 5 &&
        coords.width >= (image.width || 0) - 10 &&
        coords.height >= (image.height || 0) - 10
      ) {
        onCancel();
        return;
      }
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete({
            blob,
            width: canvas.width,
            height: canvas.height,
          });
        } else {
          onCancel();
        }
      },
      'image/png',
      1.0
    );
  }, [onCropComplete, onCancel]);

  // Handle ESC to cancel, Enter to apply
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        applyCrop();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyCrop, onCancel]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Cropper
        ref={cropperRef}
        src={imageUrl}
        className="h-full w-full"
        stencilProps={{
          grid: true,
          movable: true,
          resizable: true,
          lines: true,
          handlers: true,
        }}
        imageRestriction={ImageRestriction.stencil}
        transitions={true}
        backgroundClassName="bg-black/50"
      />
      {/* Action buttons */}
      <div className="absolute bottom-2 right-2 z-20 flex gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center w-7 h-7 rounded-md bg-black/70 hover:bg-black/90 text-white/80 hover:text-white transition-colors"
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={applyCrop}
          className="flex items-center justify-center w-7 h-7 rounded-md bg-white/90 hover:bg-white text-black/80 hover:text-black transition-colors"
          title="Apply crop (Enter)"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
