import { Polar } from "@polar-sh/sdk";

// Lazy-initialized singleton instance
let _polar: Polar | null = null;

/**
 * Get the Polar client instance (lazy initialization)
 * This ensures env vars are available at runtime
 */
function getPolarClient(): Polar {
  if (!_polar) {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        "Missing POLAR_ACCESS_TOKEN environment variable. Polar payments will not work."
      );
    }
    _polar = new Polar({ accessToken });
  }
  return _polar;
}

/**
 * Polar client proxy that lazily initializes on first access
 * This matches the pattern: import { polar } from "@/lib/polar"
 */
export const polar = {
  get checkouts() {
    return getPolarClient().checkouts;
  },
  get subscriptions() {
    return getPolarClient().subscriptions;
  },
  get customers() {
    return getPolarClient().customers;
  },
  get orders() {
    return getPolarClient().orders;
  },
  get products() {
    return getPolarClient().products;
  },
};

/**
 * Check if Polar is configured
 */
export function isPolarConfigured(): boolean {
  return !!process.env.POLAR_ACCESS_TOKEN;
}

/**
 * Get webhook secret for verifying webhooks
 */
export function getPolarWebhookSecret(): string | undefined {
  return process.env.POLAR_WEBHOOK_SECRET;
}

/**
 * Polar product IDs from environment. The same ad-hoc shell product backs both
 * marketplace listing purchases and balance top-ups (different endpoints set
 * the price per checkout).
 */
export function getPolarProductIds() {
  return {
    marketplace: process.env.POLAR_PRODUCT_MARKETPLACE_ID,
  };
}

// Re-export types
export * from "./types";
