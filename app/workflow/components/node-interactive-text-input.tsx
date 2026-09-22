'use client';

import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ArrowRightToLine, CornerDownLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';
import { cn } from '@/lib/utils';
import { matchesShortcut, SHORTCUT_ENTER, SHORTCUT_ENTER_NEWLINE } from '@/lib/shortcuts';

interface InteractiveTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSend?: () => void;
  placeholders?: string[];
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  minHeight?: string;
  maxHeight?: string;
  shimmerDuration?: number;
  shimmerSpread?: number;
  showTabIndicator?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  keyDownInterceptor?: (e: React.KeyboardEvent) => boolean;
}

export const InteractiveTextInput = forwardRef<HTMLTextAreaElement, InteractiveTextInputProps>(function InteractiveTextInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  onSend,
  placeholders = [],
  className,
  disabled = false,
  readOnly = false,
  multiline = false,
  minHeight = '24px',
  maxHeight = '60px',
  shimmerDuration = 0.1,
  shimmerSpread = 2,
  showTabIndicator = true,
  placeholder,
  autoFocus = false,
  keyDownInterceptor,
}, ref) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Expose textarea ref to parent via forwardRef
  useImperativeHandle(ref, () => inputRef.current as HTMLTextAreaElement);

  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  const currentPlaceholder =
    placeholders.length > 0
      ? placeholders[placeholderIndex % placeholders.length]
      : placeholder || '';

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (keyDownInterceptor?.(e)) return;

      if (e.key === 'Tab' && value === '' && placeholders.length > 1) {
        e.preventDefault();
        setPlaceholderIndex((i) => (i + 1) % placeholders.length);
        return;
      }

      // Shift+Enter for new line (allow default behavior)
      if (matchesShortcut(e, SHORTCUT_ENTER_NEWLINE)) {
        onKeyDown?.(e);
        return;
      }

      // Enter to submit
      if (matchesShortcut(e, SHORTCUT_ENTER)) {
        e.preventDefault();
        if (value === '' && currentPlaceholder) {
          onChange(currentPlaceholder.replace(/^Try "/, '').replace(/"$/, ''));
          return;
        }
        onSend?.();
        return;
      }

      onKeyDown?.(e);
    },
    [value, placeholders, currentPlaceholder, onChange, onSend, onKeyDown, keyDownInterceptor],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const baseInputProps = {
    value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
    disabled,
    readOnly,
    ref: inputRef as React.Ref<HTMLTextAreaElement>,
    autoFocus,
  };

  return (
    <div className="relative w-full">
      {multiline ? (
        <Textarea
          {...baseInputProps}
          className={cn(
            'text-sm py-1 pr-8 pl-1 resize-none placeholder:text-xs placeholder:py-1 dark:bg-transparent bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:border-0',
            readOnly && 'opacity-50',
            className,
          )}
          style={{ minHeight, maxHeight }}
        />
      ) : (
        <input
          {...(baseInputProps as React.InputHTMLAttributes<HTMLInputElement>)}
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="text"
          className={cn(
            'flex-1 bg-transparent outline-none text-foreground w-full',
            readOnly && 'opacity-50',
            className,
          )}
        />
      )}

      {/* Shimmer placeholder — only shown when input is empty */}
      {value === '' && currentPlaceholder && (
        <div
          className={cn(
            'absolute flex flex-col w-full pointer-events-none',
            multiline
              ? 'top-0 left-0 pl-1 pr-8 py-1 -z-10 justify-between h-full'
              : 'top-0 left-0 pr-8 py-0 -z-10 h-full items-center',
          )}
        >
          <TextShimmer
            className={cn(
              multiline ? 'text-xs' : 'text-sm flex-1',
              isFocused ? 'opacity-80' : 'opacity-50',
            )}
            duration={shimmerDuration}
            spread={shimmerSpread}
          >
            {currentPlaceholder}
          </TextShimmer>
          {isFocused && showTabIndicator && multiline && (
            <div className="flex items-center gap-0 self-end">
              {placeholders.length > 1 && (
                <p className="flex flex-row items-center text-[9px] gap-1 text-muted-foreground px-2 pb-3">
                  <ArrowRightToLine className="size-2" />
                  Next
                </p>
              )}
                <p className="flex flex-row items-center text-[9px] gap-1 text-muted-foreground px-2 pb-3">
                  <CornerDownLeft className="size-2" />
                  Accept
                </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
