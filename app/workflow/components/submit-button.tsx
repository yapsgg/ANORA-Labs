'use client';

import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SubmitButtonProps = {
  isSubmitting: boolean;
  status: string;
  value: string;
  handleMainButtonClick: () => void;
};

export function SubmitButton({
  isSubmitting = false,
  status = 'completed',
  value = '',
  handleMainButtonClick = () => {},
}: SubmitButtonProps) {
  return (
    <Button
      variant="default"
      size="icon"
      className={`
        h-7 w-7 rounded-full transition-all duration-300 ease-out mr-1
        ${isSubmitting ? 'cursor-wait' : ''}
        ${status === 'error' ? 'bg-destructive' : ''}
        ${value.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
      onClick={handleMainButtonClick}
      disabled={isSubmitting || value.length === 0}
      type="button"
      aria-label={
        isSubmitting && status === 'generating'
          ? 'Stop generating'
          : 'Generate'
      }
    >
      {isSubmitting && status === 'generating' ? (
        <Square className="size-3 fill-current" />
      ) : (
        <ArrowUp className="size-3 stroke-4" />
      )}
    </Button>
  );
}
