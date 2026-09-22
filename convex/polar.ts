"use node";

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

interface PolarCheckout {
  id: string;
  status: string;
  amount: number;
  currency: string;
  external_customer_id?: string;
  customer_external_id?: string;
  customer_id?: string;
}

async function fetchPolarCheckout(checkoutId: string): Promise<PolarCheckout> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN not set");

  const response = await fetch(
    `https://api.polar.sh/v1/checkouts/${encodeURIComponent(checkoutId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Polar checkout fetch failed: ${response.status} ${text}`);
  }
  return (await response.json()) as PolarCheckout;
}

/**
 * Verify a Polar checkout completed for the authenticated user, then credit the
 * balance via the internal mutation. Idempotent on `checkoutId`.
 */
export const verifyAndFulfillTopup = action({
  args: { checkoutId: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{
    alreadyFulfilled: boolean;
    balanceMicros: number;
    amountInCents: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const checkout = await fetchPolarCheckout(args.checkoutId);

    if (checkout.status !== "succeeded" && checkout.status !== "confirmed") {
      throw new Error(`Checkout not completed: status=${checkout.status}`);
    }

    const externalId = checkout.customer_external_id ?? checkout.external_customer_id;
    if (externalId && externalId !== userId) {
      throw new Error("Checkout belongs to a different user");
    }

    if (!checkout.amount || checkout.amount <= 0) {
      throw new Error("Checkout amount missing");
    }

    const result: { alreadyFulfilled: boolean; balanceMicros: number } =
      await ctx.runMutation(internal.balances.fulfillTopup, {
        userId,
        polarCheckoutId: checkout.id,
        amountInCents: checkout.amount,
      });
    return {
      alreadyFulfilled: result.alreadyFulfilled,
      balanceMicros: result.balanceMicros,
      amountInCents: checkout.amount,
    };
  },
});
