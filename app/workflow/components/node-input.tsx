'use client';

import React, { useRef } from 'react';
import { SubmitButton } from './submit-button';
import { GenerationCountButton } from './generation-count-button';
import { InteractiveTextInput } from './node-interactive-text-input';
import { useMention } from '../hooks/use-mention';
import { MentionDropdown } from './mention-dropdown';

type ChatInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
  isSubmitting?: boolean;
  stop: () => void;
  status?: string;
  isHovered?: boolean;
  selected?: boolean;
  readOnly?: boolean;
  placeholders?: string[];
  showDetails?: boolean;
  nodeId: string;
  nodeType?: string;
  generationCount?: number;
  onGenerationCountChange?: (count: number) => void;
};

export function ChatInput({
  value,
  onValueChange,
  onSend,
  isSubmitting = false,
  stop,
  status = 'completed',
  isHovered = false,
  selected = false,
  readOnly = false,
  placeholders = [],
  showDetails = false,
  nodeId,
  nodeType,
  generationCount,
  onGenerationCountChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    mentionState,
    handleKeyDown: mentionKeyDown,
    handleChange: mentionHandleChange,
    selectItem,
    closeMention,
    dropdownPosition,
  } = useMention({
    textareaRef,
    value,
    onChange: onValueChange,
    currentNodeId: nodeId,
  });

  const handleMainButtonClick = () => {
    if (isSubmitting && status !== 'generating') {
      return;
    }

    if (isSubmitting && status === 'generating') {
      stop();
      return;
    }

    onSend();
  };

  return (
    <div
      className={`px-1 w-full relative z-10 transition-all duration-300 whitespace-pre-wrap nodrag cursor-default ${
        selected ? 'nowheel' : ''
      }`}
    >
      <div
        className={`relative transition-opacity duration-300 ${showDetails ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <InteractiveTextInput
          ref={textareaRef}
          value={value}
          onChange={mentionHandleChange}
          onSend={onSend}
          placeholders={placeholders}
          disabled={isSubmitting}
          readOnly={readOnly}
          multiline={true}
          shimmerDuration={2}
          shimmerSpread={2}
          keyDownInterceptor={mentionKeyDown}
          className={`
            min-h-[54px] h-[60px] text-xs py-1 pr-10 pl-1 resize-none placeholder:text-xs placeholder:py-1 dark:bg-transparent bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:border-0
            ${readOnly ? 'opacity-50' : ''}
          `}
        />

        {mentionState.isOpen && (
          <MentionDropdown
            items={mentionState.items}
            selectedIndex={mentionState.selectedIndex}
            textareaRef={textareaRef}
            caretPosition={dropdownPosition}
            onSelect={selectItem}
            onClose={closeMention}
          />
        )}

        <div
          className={`absolute bottom-0 -translate-y-2 right-0 flex flex-col items-center gap-2 transition-opacity duration-200 ${
            isHovered || selected ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {(nodeType === 'image' || nodeType === 'video') &&
            generationCount !== undefined &&
            onGenerationCountChange && (
              <GenerationCountButton
                count={generationCount}
                onChange={onGenerationCountChange}
              />
            )}
          <SubmitButton
            isSubmitting={isSubmitting}
            status={status}
            value={value}
            handleMainButtonClick={handleMainButtonClick}
          />
        </div>
      </div>
    </div>
  );
}
