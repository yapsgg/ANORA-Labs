"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";

/**
 * Marketplace Purchase Success Page
 *
 * Flow:
 * 1. User pays on Polar -> redirected here with ?checkout_id=xxx
 * 2. Reads listingId + targetProjectId from sessionStorage
 * 3. Calls fulfillPurchase mutation to fork flow + record download
 * 4. Shows success and redirects to the new workflow
 */
function MarketplaceSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const fulfillPurchase = useMutation(api.marketplace.fulfillPurchase);

  const checkoutId = searchParams.get("checkout_id");

  const [status, setStatus] = useState<
    "loading" | "fulfilling" | "success" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      setStatus("error");
      setError("No checkout ID found. Please try again.");
      return;
    }

    if (isLoading) return;

    if (!isAuthenticated) {
      setStatus("error");
      setError("Please log in to complete your purchase.");
      return;
    }

    if (status !== "loading") return;

    // Read purchase context from sessionStorage (stored before redirect to Polar)
    const listingId = sessionStorage.getItem("marketplace_listing_id");
    const targetProjectId = sessionStorage.getItem("marketplace_target_project_id");

    if (!listingId || !targetProjectId) {
      setStatus("error");
      setError(
        "Could not determine purchase details. Please try purchasing again from the marketplace."
      );
      return;
    }

    setStatus("fulfilling");
    fulfillPurchase({
      listingId: listingId as Id<"marketplaceListings">,
      targetProjectId: targetProjectId as Id<"projects">,
      polarCheckoutId: checkoutId,
    })
      .then((result) => {
        sessionStorage.removeItem("marketplace_listing_id");
        sessionStorage.removeItem("marketplace_target_project_id");
        setStatus("success");

        // Redirect to the new workflow
        setTimeout(() => {
          if (result.forkedFlowId) {
            router.push(`/workflow/${result.forkedFlowId}`);
          } else {
            router.push("/marketplace");
          }
        }, 2000);
      })
      .catch((err) => {
        console.error("Purchase fulfillment error:", err);
        setStatus("error");
        setError(
          "Failed to complete your purchase. Please contact support."
        );
      });
  }, [checkoutId, isAuthenticated, isLoading, status, fulfillPurchase, router]);

  if (!checkoutId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Invalid Checkout</h1>
          <p className="text-muted-foreground">
            No checkout ID found. Please try again.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h1 className="text-2xl font-bold">Authenticating...</h1>
          <p className="text-muted-foreground">
            Please wait while we verify your session.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Purchase Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Check className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold">Purchase Complete!</h1>
          <p className="text-muted-foreground">
            Your workflow has been added. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Completing Your Purchase</h1>
        <p className="text-muted-foreground">
          Please wait, adding the workflow to your project...
        </p>
      </div>
    </div>
  );
}

export default function MarketplaceCheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <MarketplaceSuccessContent />
    </Suspense>
  );
}
