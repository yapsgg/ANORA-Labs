"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useConvexAuth, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { microsToUsd } from "@/lib/openrouter/pricing";

function TopupSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const fulfill = useAction(api.polar.verifyAndFulfillTopup);

  const checkoutId = searchParams.get("checkout_id");

  const [fulfillState, setFulfillState] = useState<"idle" | "success" | "error">("idle");
  const [fulfillError, setFulfillError] = useState<string | null>(null);
  const [balanceMicros, setBalanceMicros] = useState<number>(0);
  const [amountInCents, setAmountInCents] = useState<number>(0);

  // Derived state: precondition errors are computed from inputs, not stored.
  const preconditionError: string | null = isLoading
    ? null
    : !checkoutId
      ? "Missing checkout id"
      : !isAuthenticated
        ? "Please sign in to complete your top-up"
        : null;

  const state: "loading" | "success" | "error" = preconditionError
    ? "error"
    : fulfillState === "idle"
      ? "loading"
      : fulfillState;
  const error = preconditionError ?? fulfillError;

  useEffect(() => {
    if (isLoading || !checkoutId || !isAuthenticated) return;

    let cancelled = false;
    fulfill({ checkoutId })
      .then((result) => {
        if (cancelled) return;
        setBalanceMicros(result.balanceMicros);
        setAmountInCents(result.amountInCents);
        setFulfillState("success");
        setTimeout(() => router.push("/projects"), 2500);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFulfillError(err instanceof Error ? err.message : "Top-up failed");
        setFulfillState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [checkoutId, isAuthenticated, isLoading, fulfill, router]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Confirming your payment…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-3 p-8">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm">{error}</p>
        <button
          className="text-sm underline text-muted-foreground"
          onClick={() => router.push("/projects")}
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-8">
      <Check className="size-6 text-green-500" />
      <p className="text-sm font-medium">
        +${(amountInCents / 100).toFixed(2)} added to your balance
      </p>
      <p className="text-xs text-muted-foreground">
        New balance: ${microsToUsd(balanceMicros).toFixed(4)}
      </p>
    </div>
  );
}

export default function TopupSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TopupSuccessContent />
    </Suspense>
  );
}
