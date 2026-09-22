import { Checkout } from "@polar-sh/nextjs";

/**
 * Polar.sh checkout handler using @polar-sh/nextjs
 *
 * Usage from client:
 *   window.location.href = `/api/polar/checkout?products=${PRODUCT_ID}`
 *
 * The Checkout handler reads `products` from the query param,
 * creates a session on Polar, and redirects the user to pay.
 * After payment, Polar redirects to POLAR_SUCCESS_URL.
 */
export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.POLAR_SUCCESS_URL!,
});
