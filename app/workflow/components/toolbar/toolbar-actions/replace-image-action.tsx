'use client';

import { useRef } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateFile } from '@/app/workflow/services/bunny-upload-service';
import { toast } from 'sonner';

interface ReplaceImageActionProps {
  onReplace: (file: File) => void;
  isUploading?: boolean;
}

export function ReplaceImageAction({ onReplace, isUploading }: ReplaceImageActionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    e.target.value = '';

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    onReplace(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title="Replace image"
        onClick={handleClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ImageUp className="size-3.5" />
        )}
      </Button>
    </>
  );
}
