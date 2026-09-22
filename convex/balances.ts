import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Pay-as-you-go billing in micro-USD (1 USD = 1_000_000 micros).
// Affordability checks live in this file so balance reads + decisions stay
// transactional and we never race a debit against a top-up.

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getOrCreateBalance(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("balances")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert("balances", {
    userId,
    balanceMicros: 0,
    createdAt: now,
    updatedAt: now,
  });
  const created = await ctx.db.get(id);
  if (!created) throw new Error("Failed to create balance");
  return created;
}

async function applyDelta(
  ctx: MutationCtx,
  userId: Id<"users">,
  deltaMicros: number,
  context: {
    kind: "topup" | "usage" | "refund" | "adjustment";
    generationType?: "image" | "video" | "text";
    model?: string;
    flowId?: Id<"flows">;
    nodeId?: string;
    polarCheckoutId?: string;
    polarOrderId?: string;
    description?: string;
  },
) {
  const balance = await getOrCreateBalance(ctx, userId);
  const newMicros = balance.balanceMicros + deltaMicros;
  if (newMicros < 0) {
    throw new Error("Insufficient balance");
  }

  const now = Date.now();
  await ctx.db.patch(balance._id, {
    balanceMicros: newMicros,
    updatedAt: now,
  });

  await ctx.db.insert("balanceTransactions", {
    userId,
    kind: context.kind,
    deltaMicros,
    runningBalanceMicros: newMicros,
    generationType: context.generationType,
    model: context.model,
    flowId: context.flowId,
    nodeId: context.nodeId,
    polarCheckoutId: context.polarCheckoutId,
    polarOrderId: context.polarOrderId,
    description: context.description,
    createdAt: now,
  });

  return newMicros;
}

// ─── Public queries ──────────────────────────────────────────────────────────

export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { balanceMicros: 0 };

    const row = await ctx.db
      .query("balances")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return { balanceMicros: row?.balanceMicros ?? 0 };
  },
});

export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(args.limit ?? 50, 200);
    return ctx.db
      .query("balanceTransactions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

// ─── Public mutations ────────────────────────────────────────────────────────

/**
 * Charge the authenticated user for a generation. The cost is computed by the
 * caller using `lib/openrouter/pricing` and passed in as `costMicros`.
 *
 * Throws "Insufficient balance" if the debit would overdraw — caller should
 * gate this with `getBalance` + `estimate*Cost(...)` first.
 */
export const debitUsage = mutation({
  args: {
    costMicros: v.number(),
    generationType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("text"),
    ),
    model: v.optional(v.string()),
    flowId: v.optional(v.id("flows")),
    nodeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (args.costMicros <= 0) return { newBalanceMicros: 0, charged: 0 };

    const newBalanceMicros = await applyDelta(ctx, userId, -args.costMicros, {
      kind: "usage",
      generationType: args.generationType,
      model: args.model,
      flowId: args.flowId,
      nodeId: args.nodeId,
    });
    return { newBalanceMicros, charged: args.costMicros };
  },
});

// ─── Internal mutations (called from Next.js API routes after Polar verifies) ─

/**
 * Credit a verified Polar top-up to the user's balance. Idempotent on
 * `polarCheckoutId` — re-calling with the same id is a no-op.
 */
export const fulfillTopup = internalMutation({
  args: {
    userId: v.id("users"),
    polarCheckoutId: v.string(),
    polarOrderId: v.optional(v.string()),
    amountInCents: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("balanceTransactions")
      .withIndex("by_polar_checkout", (q) =>
        q.eq("polarCheckoutId", args.polarCheckoutId),
      )
      .first();
    if (existing) {
      const balance = await ctx.db
        .query("balances")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();
      return {
        alreadyFulfilled: true,
        balanceMicros: balance?.balanceMicros ?? 0,
      };
    }

    const deltaMicros = args.amountInCents * 10_000; // cents → micros
    const newBalanceMicros = await applyDelta(ctx, args.userId, deltaMicros, {
      kind: "topup",
      polarCheckoutId: args.polarCheckoutId,
      polarOrderId: args.polarOrderId,
    });
    return { alreadyFulfilled: false, balanceMicros: newBalanceMicros };
  },
});

/**
 * Admin-only adjustment (refund, manual credit). Not exposed to clients.
 */
export const adjust = internalMutation({
  args: {
    userId: v.id("users"),
    deltaMicros: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const newBalanceMicros = await applyDelta(ctx, args.userId, args.deltaMicros, {
      kind: "adjustment",
      description: args.description,
    });
    return { newBalanceMicros };
  },
});

// ─── Internal queries (used by Next.js API routes) ───────────────────────────

export const getBalanceForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("balances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return { balanceMicros: row?.balanceMicros ?? 0 };
  },
});
