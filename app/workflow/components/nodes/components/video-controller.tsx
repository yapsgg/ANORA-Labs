'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { Play, Square, Volume2, VolumeX } from 'lucide-react';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface VideoControllerProps {
  src: string;
  isHovered: boolean;
  isVisible: boolean;
  isSaving: boolean;
  width: number;
  savingOverlay?: React.ReactNode;
}

export function useVideoPlayback(src: string | undefined, isHovered: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isHovered]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setVideoDuration(video.duration);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [src]);

  const handleSeek = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMuted = useCallback(() => setIsMuted((m) => !m), []);

  return {
    videoRef,
    isMuted,
    isPlaying,
    currentTime,
    videoDuration,
    handleSeek,
    togglePlayback,
    toggleMuted,
  };
}

export function VideoPreview({
  videoRef,
  src,
  isMuted,
  isVisible,
  isSaving,
  onToggleMuted,
  savingOverlay,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  isMuted: boolean;
  isVisible: boolean;
  isSaving: boolean;
  onToggleMuted: () => void;
  savingOverlay?: React.ReactNode;
}) {
  return (
    <>
      <video
        ref={videoRef}
        src={src}
        muted={isMuted}
        loop
        playsInline
        className="w-full h-full object-cover rounded-lg"
      />

      {isVisible && (
        <button
          onClick={onToggleMuted}
          className="absolute top-0 right-0 pr-4 pt-4 z-10 text-white drop-shadow-md transition-opacity hover:opacity-80"
        >
          {isMuted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </button>
      )}

      {isSaving && savingOverlay}
    </>
  );
}

export function VideoControllerBar({
  isVisible,
  width,
  isPlaying,
  currentTime,
  videoDuration,
  onTogglePlayback,
  onSeek,
}: {
  isVisible: boolean;
  width: number;
  isPlaying: boolean;
  currentTime: number;
  videoDuration: number;
  onTogglePlayback: () => void;
  onSeek: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  if (videoDuration <= 0) return null;

  return (
    <NodeToolbar isVisible={isVisible} position={Position.Bottom} offset={12}>
      <div
        className="flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1.5 backdrop-blur-sm"
        style={{ width }}
      >
        <button
          onClick={onTogglePlayback}
          className="flex-shrink-0 text-white hover:opacity-80 transition-opacity"
        >
          {isPlaying ? (
            <Square className="size-3 fill-white" />
          ) : (
            <Play className="size-3 fill-white" />
          )}
        </button>
        <div className="relative flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer">
          <div
            className="absolute inset-y-0 left-0 bg-white rounded-full"
            style={{ width: `${(currentTime / videoDuration) * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={videoDuration}
            step={0.01}
            value={currentTime}
            onChange={onSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="flex-shrink-0 text-[10px] text-white/70 tabular-nums">
          {formatTime(currentTime)}
        </span>
      </div>
    </NodeToolbar>
  );
}
