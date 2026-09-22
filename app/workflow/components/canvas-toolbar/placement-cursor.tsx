'use client';

import { useEffect, useState } from 'react';
import { Type, Image, Play, MessageCircle } from 'lucide-react';
import { PlaceableTool } from './types';

interface PlacementCursorProps {
  activeTool: PlaceableTool;
  isActive: boolean;
}

const toolIcons: Record<PlaceableTool, typeof Type> = {
  'generate-text-node': Type,
  'generate-image-node': Image,
  'generate-video-node': Play,
  'comment-node': MessageCircle,
};

export function PlacementCursor({ activeTool, isActive }: PlacementCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isActive]);

  if (!isActive || !isVisible) return null;

  const Icon = toolIcons[activeTool];

  return (
    <div
      className="pointer-events-none fixed z-[9999] flex items-center justify-center"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(4px, 4px)',
      }}
    >
      <div className="flex items-center justify-center rounded-md bg-primary p-1.5 shadow-lg">
        <Icon className="size-4 text-primary-foreground" />
      </div>
    </div>
  );
}
