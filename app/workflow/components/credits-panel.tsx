'use client';

import { useEffect, useState } from 'react';
import { Panel } from '@xyflow/react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TopupModal } from '@/components/topup-modal';
import { microsToUsd } from '@/lib/openrouter/pricing';

/** Dispatch this event to open the top-up modal from anywhere. */
export const OPEN_TOPUP_MODAL = 'open-topup-modal';

export function openTopupModal() {
  window.dispatchEvent(new CustomEvent(OPEN_TOPUP_MODAL));
}

// Backwards-compat alias for code that still imports the old name.
export const openSubscriptionModal = openTopupModal;

export function CreditsPanel() {
  const balance = useQuery(api.balances.getBalance);
  const currentUser = useQuery(api.users.viewer);
  const [billingOpen, setBillingOpen] = useState(false);

  useEffect(() => {
    const handler = () => setBillingOpen(true);
    window.addEventListener(OPEN_TOPUP_MODAL, handler);
    return () => window.removeEventListener(OPEN_TOPUP_MODAL, handler);
  }, []);

  const balanceMicros = balance?.balanceMicros ?? 0;
  const display = `$${microsToUsd(balanceMicros).toFixed(4)}`;

  return (
    <>
      <Panel position="bottom-left" className="!m-4">
        <button
          onClick={() => setBillingOpen(true)}
          className="flex items-center gap-2 rounded-lg backdrop-blur-sm px-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-sm font-medium">
            {balance === undefined ? '…' : display}
          </span>
          <span className="text-xs text-muted-foreground">balance</span>
        </button>
      </Panel>

      <TopupModal
        open={billingOpen}
        onOpenChange={setBillingOpen}
        userEmail={currentUser?.email ?? ''}
      />
    </>
  );
}
