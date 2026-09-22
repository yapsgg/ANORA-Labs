"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Coins, Minus, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { microsToUsd } from "@/lib/openrouter/pricing";

interface TopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

const MIN_DOLLARS = 10;
const PRESETS = [10, 25, 50, 100];

export function TopupModal({ open, onOpenChange, userEmail }: TopupModalProps) {
  const currentUser = useQuery(api.users.viewer);
  const balance = useQuery(api.balances.getBalance);
  const [dollars, setDollars] = React.useState<number>(25);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const balanceMicros = balance?.balanceMicros ?? 0;

  const adjust = (delta: number) => {
    setDollars((prev) => Math.max(MIN_DOLLARS, prev + delta));
  };

  const handleTopup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/polar/checkout/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountInCents: Math.round(dollars * 100),
          customerEmail: userEmail,
          customerExternalId: currentUser?._id,
        }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error ?? "Failed to start checkout");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="size-5" />
            Top up your balance
          </DialogTitle>
          <DialogDescription>
            Pay-as-you-go. Charges run at OpenRouter pricing — your balance never expires.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border bg-muted/40 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current balance</span>
            <span className="text-sm font-semibold">
              {balance === undefined
                ? "…"
                : `$${microsToUsd(balanceMicros).toFixed(4)}`}
            </span>
          </div>

          <div className="space-y-3">
            <Label>Amount (USD)</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjust(-5)}
                disabled={dollars <= MIN_DOLLARS}
              >
                <Minus className="size-4" />
              </Button>
              <div className="flex items-center w-full rounded-md border bg-background px-3">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={dollars}
                  min={MIN_DOLLARS}
                  step={5}
                  onChange={(e) =>
                    setDollars(
                      Math.max(MIN_DOLLARS, parseInt(e.target.value, 10) || MIN_DOLLARS),
                    )
                  }
                  className="border-0 text-center text-lg font-semibold focus-visible:ring-0"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => adjust(5)}>
                <Plus className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Minimum top-up: ${MIN_DOLLARS}
            </p>
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            {PRESETS.map((amount) => (
              <Button
                key={amount}
                variant={dollars === amount ? "default" : "outline"}
                size="sm"
                onClick={() => setDollars(amount)}
              >
                ${amount}
              </Button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleTopup}
            disabled={loading || dollars < MIN_DOLLARS}
          >
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            Continue to checkout — ${dollars}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
