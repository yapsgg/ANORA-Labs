import { NextRequest, NextResponse } from "next/server";
import { polar } from "@/lib/polar";

/**
 * Marketplace Purchase Checkout Endpoint
 *
 * Creates a Polar checkout session for purchasing a paid marketplace workflow.
 * Uses ad-hoc pricing so each listing can have its own price — the product in
 * Polar is just a shell; the actual amount is set per checkout via `prices`.
 *
 * After payment, Polar redirects to /checkout/marketplace/success with checkout_id.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, listingName, priceInCents, customerEmail, customerExternalId } =
      body as {
        listingId: string;
        listingName: string;
        priceInCents: number;
        customerEmail: string;
        customerExternalId?: string;
      };

    const productId = process.env.POLAR_PRODUCT_MARKETPLACE_ID;

    if (!productId) {
      return NextResponse.json(
        { error: "Marketplace product not configured" },
        { status: 500 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    if (!listingId || !priceInCents || priceInCents < 100) {
      return NextResponse.json(
        { error: "Listing ID and price (minimum $1.00) are required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/checkout/marketplace/success?checkout_id={CHECKOUT_ID}`;

    const checkout = await polar.checkouts.create({
      products: [productId],
      // Override the product's catalog price with the listing's actual price
      prices: {
        [productId]: [
          {
            amountType: "fixed" as const,
            priceAmount: priceInCents,
            priceCurrency: "usd",
          },
        ],
      },
      customerEmail,
      ...(customerExternalId && { externalCustomerId: customerExternalId }),
      metadata: {
        type: "marketplace",
        listingId,
        listingName,
        priceInCents: priceInCents.toString(),
      },
      successUrl,
    });

    return NextResponse.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
    });
  } catch (error) {
    console.error("Marketplace checkout error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
