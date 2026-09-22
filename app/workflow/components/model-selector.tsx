'use client';

import React from 'react';
import Image from 'next/image';
import type { SelectProps } from '@radix-ui/react-select';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TEXT_MODELS,
  IMAGE_MODELS,
  VIDEO_MODELS,
  groupByProvider,
} from '@/app/workflow/model-data';

interface ModelSelectorProps<T extends { id: string; name: string; provider: string; icon: string | null; priceLabel: string; time: number }> extends SelectProps {
  value: string;
  onChange: (value: string) => void;
  models: T[];
}

function ModelSelector<T extends { id: string; name: string; provider: string; icon: string | null; priceLabel: string; time: number }>({
  value,
  onChange,
  models,
  ...props
}: ModelSelectorProps<T>) {
  const grouped = groupByProvider(models);

  return (
    <Select value={value} onValueChange={onChange} {...props}>
      <SelectTrigger className="w-full nodrag">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {Object.entries(grouped).map(([provider, providerModels]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="capitalize text-xs text-muted-foreground">
              {provider}
            </SelectLabel>
            {providerModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2 w-full">
                  {model.icon ? (
                    <Image
                      src={model.icon}
                      alt={model.provider}
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                  ) : (
                    <span className="h-4 w-4 rounded bg-muted" />
                  )}
                  <span>{model.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {model.priceLabel} · {model.time}s
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TextModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ModelSelector
      value={value}
      onChange={onChange}
      models={TEXT_MODELS}
    />
  );
}

export function ImageModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ModelSelector
      value={value}
      onChange={onChange}
      models={IMAGE_MODELS}
    />
  );
}

export function VideoModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ModelSelector
      value={value}
      onChange={onChange}
      models={VIDEO_MODELS}
    />
  );
}
