'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResetOriginalActionProps {
  onReset: () => void;
}

export function ResetOriginalAction({ onReset }: ResetOriginalActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      title="Reset to original image"
      onClick={onReset}
    >
      <RotateCcw className="size-3.5" />
    </Button>
  );
}
