'use client';

import { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  estimateChatCost,
  estimateImageCost,
  estimateVideoCost,
  AFFORDABILITY_BUFFER,
} from '@/lib/openrouter/pricing';
import { getVideoModel } from '@/lib/openrouter/models/registry';

type GenerationType = 'image' | 'video' | 'text';

interface UseBalanceOptions {
  flowId?: Id<'flows'> | null;
}

interface AffordEstimateInput {
  type: GenerationType;
  modelId: string;
  // Optional context for sharper estimates.
  prompt?: string;
  maxOutputTokens?: number;
  imageCount?: number;
  durationSeconds?: number;
  resolution?: string;
  withAudio?: boolean;
  videoMode?: 'text-to-video' | 'image-to-video';
}

interface UseBalanceReturn {
  /** Current balance in micro-USD (1 USD = 1_000_000 micros). */
  balanceMicros: number;
  /** Loading flag while Convex query resolves. */
  isLoading: boolean;
  /** Estimated billed cost in micro-USD for the given generation. */
  estimateCostMicros: (input: AffordEstimateInput) => number;
  /** True if balance covers the estimated cost × affordability buffer. */
  canAfford: (input: AffordEstimateInput) => boolean;
  /** Debit `costMicros` from the user balance and append a usage row. */
  debit: (
    type: GenerationType,
    costMicros: number,
    options?: { nodeId?: string; modelId?: string },
  ) => Promise<boolean>;
}

export function useBalance({ flowId }: UseBalanceOptions = {}): UseBalanceReturn {
  const balanceQuery = useQuery(api.balances.getBalance);
  const debitMutation = useMutation(api.balances.debitUsage);

  const balanceMicros = balanceQuery?.balanceMicros ?? 0;
  const isLoading = balanceQuery === undefined;

  const estimateCostMicros = useCallback((input: AffordEstimateInput): number => {
    const promptText = input.prompt ?? '';
    if (input.type === 'text') {
      return estimateChatCost(input.modelId, promptText, input.maxOutputTokens).billedMicros;
    }
    if (input.type === 'image') {
      return estimateImageCost(input.modelId, input.imageCount ?? 1, promptText).billedMicros;
    }
    // video
    const model = getVideoModel(input.modelId);
    const duration = input.durationSeconds ?? model?.supported_durations?.[0] ?? 5;
    const resolution = input.resolution ?? model?.supported_resolutions?.[0];
    return estimateVideoCost(
      input.modelId,
      duration,
      resolution,
      input.withAudio ?? !!model?.generate_audio,
      input.videoMode ?? 'text-to-video',
    ).billedMicros;
  }, []);

  const canAfford = useCallback(
    (input: AffordEstimateInput): boolean => {
      if (balanceQuery === undefined) return false;
      const estimate = estimateCostMicros(input);
      if (estimate <= 0) return balanceMicros > 0;
      return balanceMicros >= Math.ceil(estimate * AFFORDABILITY_BUFFER);
    },
    [balanceQuery, balanceMicros, estimateCostMicros],
  );

  const debit = useCallback(
    async (
      type: GenerationType,
      costMicros: number,
      options?: { nodeId?: string; modelId?: string },
    ): Promise<boolean> => {
      if (costMicros <= 0) return true;
      try {
        await debitMutation({
          costMicros,
          generationType: type,
          model: options?.modelId,
          flowId: flowId ?? undefined,
          nodeId: options?.nodeId,
        });
        return true;
      } catch (error) {
        console.error('debit failed:', error);
        return false;
      }
    },
    [debitMutation, flowId],
  );

  return { balanceMicros, isLoading, estimateCostMicros, canAfford, debit };
}
