import { NextRequest, NextResponse } from "next/server";
import { polar } from "@/lib/polar";

/**
 * Custom-amount top-up checkout. Minimum $10 (1000 cents). Reuses
 * POLAR_PRODUCT_MARKETPLACE_ID as a generic ad-hoc-priced shell — the user-set
 * amount overrides the catalog price.
 */
export const MIN_TOPUP_CENTS = 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountInCents, customerEmail, customerExternalId } = body as {
      amountInCents: number;
      customerEmail: string;
      customerExternalId?: string;
    };

    const productId = process.env.POLAR_PRODUCT_MARKETPLACE_ID;
    if (!productId) {
      return NextResponse.json(
        { error: "Top-up product not configured" },
        { status: 500 },
      );
    }

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }
    if (!Number.isFinite(amountInCents) || amountInCents < MIN_TOPUP_CENTS) {
      return NextResponse.json(
        { error: `Minimum top-up is $${(MIN_TOPUP_CENTS / 100).toFixed(2)}` },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/checkout/topup/success?checkout_id={CHECKOUT_ID}`;

    const checkout = await polar.checkouts.create({
      products: [productId],
      prices: {
        [productId]: [
          {
            amountType: "fixed" as const,
            priceAmount: Math.round(amountInCents),
            priceCurrency: "usd",
          },
        ],
      },
      customerEmail,
      ...(customerExternalId && { externalCustomerId: customerExternalId }),
      metadata: {
        type: "topup",
        amountInCents: String(Math.round(amountInCents)),
      },
      successUrl,
    });

    return NextResponse.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
    });
  } catch (error) {
    console.error("Top-up checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 },
    );
  }
}
