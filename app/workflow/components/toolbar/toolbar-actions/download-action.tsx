'use client';

import { useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadImage, downloadVideo } from '@/app/workflow/services/download-service';
import { toast } from 'sonner';

interface DownloadActionProps {
  url?: string;
  filename?: string;
  type?: 'image' | 'video';
}

export function DownloadAction({
  url,
  filename = 'download',
  type = 'image',
}: DownloadActionProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!url || isDownloading) return;

    setIsDownloading(true);

    try {
      const downloadFn = type === 'video' ? downloadVideo : downloadImage;
      const result = await downloadFn(url, {
        filename,
        onError: (error) => {
          toast.error(`Download failed: ${error.message}`);
        },
      });

      if (result.success) {
        toast.success(`${type === 'video' ? 'Video' : 'Image'} downloaded`);
      }
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  }, [url, filename, type, isDownloading]);

  if (!url) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      title="Download"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
    </Button>
  );
}
