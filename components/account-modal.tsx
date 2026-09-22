"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wallet } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { microsToUsd } from "@/lib/openrouter/pricing";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fmtUsd(micros: number): string {
  const sign = micros < 0 ? "-" : "+";
  return `${sign}$${microsToUsd(Math.abs(micros)).toFixed(4)}`;
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kindLabel(kind: string, generationType?: string, model?: string): string {
  if (kind === "topup") return "Top-up";
  if (kind === "refund") return "Refund";
  if (kind === "adjustment") return "Adjustment";
  if (kind === "usage") {
    return [generationType ?? "usage", model].filter(Boolean).join(" · ");
  }
  return kind;
}

export function AccountModal({ open, onOpenChange }: AccountModalProps) {
  const balance = useQuery(api.balances.getBalance);
  const transactions = useQuery(api.balances.getRecentTransactions, { limit: 50 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>Balance and recent activity.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Balance</span>
            </div>
            <span className="text-lg font-semibold">
              {balance === undefined
                ? "…"
                : `$${microsToUsd(balance.balanceMicros).toFixed(4)}`}
            </span>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Recent activity</h3>
            {transactions === undefined ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {transactions.map((tx) => (
                  <li
                    key={tx._id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">
                        {kindLabel(tx.kind, tx.generationType, tx.model)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(tx.createdAt)}
                      </span>
                    </div>
                    <span
                      className={
                        tx.deltaMicros >= 0
                          ? "text-green-600 dark:text-green-400 tabular-nums"
                          : "text-foreground tabular-nums"
                      }
                    >
                      {fmtUsd(tx.deltaMicros)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
