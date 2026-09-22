'use client';

import { useCallback, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  extractFilesFromDragEvent,
  validateFiles,
  formatFileSize,
  createPreviewUrl,
  revokePreviewUrl,
} from '../services/asset-upload-service';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  maxFiles?: number;
  showPreview?: boolean;
  compact?: boolean;
}

interface FilePreview {
  file: File;
  url: string;
  error?: string;
}

export function Dropzone({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  disabled = false,
  className,
  maxFiles = 10,
  showPreview = false,
  compact = false,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(
    (files: File[]) => {
      // Validate files
      const validationResults = validateFiles(files);
      const validFiles: File[] = [];
      const newErrors: string[] = [];
      const newPreviews: FilePreview[] = [];

      validationResults.forEach((result, index) => {
        if (result.valid && result.file) {
          if (validFiles.length < maxFiles) {
            validFiles.push(result.file);
            if (showPreview) {
              newPreviews.push({
                file: result.file,
                url: createPreviewUrl(result.file),
              });
            }
          } else {
            newErrors.push(`File "${files[index].name}" skipped: Maximum ${maxFiles} files allowed`);
          }
        } else if (result.error) {
          newErrors.push(result.error);
        }
      });

      setErrors(newErrors);

      if (showPreview) {
        // Cleanup old preview URLs
        previews.forEach((p) => revokePreviewUrl(p.url));
        setPreviews(newPreviews);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [maxFiles, showPreview, previews, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = extractFilesFromDragEvent(e);
      processFiles(files);
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(Array.from(files));
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [processFiles]
  );

  const removePreview = useCallback(
    (index: number) => {
      setPreviews((prev) => {
        const newPreviews = [...prev];
        revokePreviewUrl(newPreviews[index].url);
        newPreviews.splice(index, 1);
        return newPreviews;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    previews.forEach((p) => revokePreviewUrl(p.url));
    setPreviews([]);
    setErrors([]);
  }, [previews]);

  if (compact) {
    return (
      <label
        className={cn(
          'flex items-center justify-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
          'border border-dashed border-border hover:border-primary/50 hover:bg-accent/50',
          isDragOver && 'border-primary bg-accent',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Drop or click</span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
      </label>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-6 rounded-lg cursor-pointer transition-all',
          'border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/30',
          isDragOver && 'border-primary bg-accent/50 scale-[1.02]',
          disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            'bg-muted',
            isDragOver && 'bg-primary/10'
          )}
        >
          <Upload
            className={cn(
              'w-6 h-6 transition-colors',
              isDragOver ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragOver ? 'Drop files here' : 'Drag & drop images'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse {multiple && `(max ${maxFiles} files)`}
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
      </label>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* File previews */}
      {showPreview && previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {previews.length} file{previews.length > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-md overflow-hidden bg-muted"
              >
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] text-white truncate">{preview.file.name}</p>
                  <p className="text-[10px] text-white/70">
                    {formatFileSize(preview.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline dropzone for use inside nodes
 */
interface InlineDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  className?: string;
  hasImage?: boolean;
}

export function InlineDropzone({
  onFileSelected,
  disabled = false,
  className,
  hasImage = false,
}: InlineDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = extractFilesFromDragEvent(e);
      const validationResults = validateFiles(files);

      // Take first valid file
      const firstValid = validationResults.find((r) => r.valid && r.file);
      if (firstValid?.file) {
        onFileSelected(firstValid.file);
      }
    },
    [disabled, onFileSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const [validation] = validateFiles([file]);
        if (validation.valid && validation.file) {
          onFileSelected(validation.file);
        }
      }
      e.target.value = '';
    },
    [onFileSelected]
  );

  return (
    <label
      className={cn(
        'flex flex-col items-center justify-center gap-2 w-full h-full cursor-pointer transition-all rounded-md',
        'border-2 border-dashed',
        hasImage ? 'border-transparent hover:border-border/50' : 'border-border',
        isDragOver && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!hasImage && (
        <>
          <ImageIcon
            className={cn(
              'w-8 h-8 transition-colors',
              isDragOver ? 'text-primary' : 'text-muted-foreground/50'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {isDragOver ? 'Drop image' : 'Drop image here'}
          </span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
